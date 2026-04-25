// ────────────────────────────────────────────────────────────────────────────
// POST /snaptrade-sync-trades
//   Pulls activities from SnapTrade, normalizes BUY/SELL events into the local
//   `trades` table, and dedupes via `aggregator_trade_map`.
//
//   Body: { connectionId?: string, startDate?: 'YYYY-MM-DD' }
//     - if connectionId omitted → syncs all connections
//     - if startDate omitted    → defaults to last 90 days on first sync,
//       otherwise resumes from `last_synced_at`
//
//   Returns: { imported: number, skipped: number, errors: string[] }
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { snapTradeListActivities, snapTradeListAccounts } from '../_shared/snaptrade.ts';

interface ActivityRow {
  id: string;
  account: { id: string; name: string };
  symbol?: { symbol: string; raw_symbol?: string };
  price: number | null;
  units: number | null;
  amount: number | null;
  currency: { code: string };
  type: string;
  trade_date?: string;
  settlement_date?: string;
  fee?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const { connectionId, startDate } = await req.json().catch(() => ({}));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: aggUser } = await supabaseAdmin
      .from('aggregator_users')
      .select('provider_user_id, provider_user_secret')
      .eq('user_id', user.id)
      .eq('provider', 'snaptrade')
      .maybeSingle();

    if (!aggUser) return errorResponse('Not registered with SnapTrade', 400);

    // Determine which accounts to sync
    let accountFilter: string | undefined;
    if (connectionId) {
      const { data: conn } = await supabaseAdmin
        .from('aggregator_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connection_id', connectionId)
        .maybeSingle();
      if (!conn) return errorResponse('Connection not found', 404);

      // We don't store account IDs — fetch them from SnapTrade
      const accounts = await snapTradeListAccounts(
        aggUser.provider_user_id,
        aggUser.provider_user_secret,
      );
      accountFilter = accounts.map(a => a.id).join(',');
    }

    // Determine date range
    const effectiveStart = startDate ||
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Mark as syncing
    if (connectionId) {
      await supabaseAdmin
        .from('aggregator_connections')
        .update({ status: 'syncing' })
        .eq('user_id', user.id)
        .eq('connection_id', connectionId);
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Pull activities (only BUY/SELL — we ignore deposits, dividends, etc here)
    const buys = await snapTradeListActivities({
      userId: aggUser.provider_user_id,
      userSecret: aggUser.provider_user_secret,
      startDate: effectiveStart,
      type: 'BUY',
      accounts: accountFilter,
    }).catch((e) => { errors.push(`BUY fetch: ${e.message}`); return [] as ActivityRow[]; });

    const sells = await snapTradeListActivities({
      userId: aggUser.provider_user_id,
      userSecret: aggUser.provider_user_secret,
      startDate: effectiveStart,
      type: 'SELL',
      accounts: accountFilter,
    }).catch((e) => { errors.push(`SELL fetch: ${e.message}`); return [] as ActivityRow[]; });

    const all: ActivityRow[] = [...buys, ...sells];

    // Group BUY+SELL pairs into round-trip trades by symbol+account.
    // Naive FIFO matching — perfect for spot, OK for perps (each fill is its own row).
    type Open = { activity: ActivityRow; remainingUnits: number };
    const opensByKey = new Map<string, Open[]>();

    // Sort chronologically
    all.sort((a, b) => (a.trade_date || '').localeCompare(b.trade_date || ''));

    for (const act of all) {
      const symbol = act.symbol?.symbol || act.symbol?.raw_symbol;
      if (!symbol || act.units == null || act.price == null) {
        skipped++;
        continue;
      }
      const key = `${act.account.id}::${symbol}`;

      // Already imported?
      const { data: dupe } = await supabaseAdmin
        .from('aggregator_trade_map')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'snaptrade')
        .eq('provider_trade_id', act.id)
        .maybeSingle();
      if (dupe) { skipped++; continue; }

      if (act.type === 'BUY') {
        const arr = opensByKey.get(key) || [];
        arr.push({ activity: act, remainingUnits: Math.abs(act.units) });
        opensByKey.set(key, arr);

        // Persist as an "open" trade record (closed_at null)
        const { data: inserted, error } = await supabaseAdmin
          .from('trades')
          .insert({
            user_id: user.id,
            symbol,
            side: 'long',
            entry_price: act.price,
            position_size: Math.abs(act.units),
            trade_date: act.trade_date,
            opened_at: act.trade_date,
            trading_fee: act.fee || 0,
            source: 'snaptrade',
            exchange: act.account.name,
          })
          .select('id')
          .single();
        if (error) { errors.push(`Insert open: ${error.message}`); continue; }

        await supabaseAdmin.from('aggregator_trade_map').insert({
          user_id: user.id,
          provider: 'snaptrade',
          provider_trade_id: act.id,
          trade_id: inserted.id,
        });
        imported++;
      }

      if (act.type === 'SELL') {
        // Match against earliest open; if none, treat as standalone short
        const arr = opensByKey.get(key) || [];
        const sellUnits = Math.abs(act.units);

        if (arr.length === 0) {
          // No open position to close — record as standalone short open.
          // (User can edit later if it was a partial close they manually logged before sync.)
          const { data: inserted, error } = await supabaseAdmin
            .from('trades')
            .insert({
              user_id: user.id,
              symbol,
              side: 'short',
              entry_price: act.price,
              position_size: sellUnits,
              trade_date: act.trade_date,
              opened_at: act.trade_date,
              trading_fee: act.fee || 0,
              source: 'snaptrade',
              exchange: act.account.name,
            })
            .select('id')
            .single();
          if (error) { errors.push(`Insert short: ${error.message}`); continue; }
          await supabaseAdmin.from('aggregator_trade_map').insert({
            user_id: user.id,
            provider: 'snaptrade',
            provider_trade_id: act.id,
            trade_id: inserted.id,
          });
          imported++;
          continue;
        }

        // Close the FIFO open
        const open = arr[0];
        const matchedUnits = Math.min(open.remainingUnits, sellUnits);
        const pnl = (act.price - open.activity.price!) * matchedUnits;

        // Find the trade_id we created on BUY
        const { data: openMap } = await supabaseAdmin
          .from('aggregator_trade_map')
          .select('trade_id')
          .eq('user_id', user.id)
          .eq('provider', 'snaptrade')
          .eq('provider_trade_id', open.activity.id)
          .maybeSingle();

        if (openMap?.trade_id) {
          await supabaseAdmin
            .from('trades')
            .update({
              exit_price: act.price,
              closed_at: act.trade_date,
              profit_loss: pnl,
              roi: open.activity.price ? ((act.price - open.activity.price) / open.activity.price) * 100 : null,
              trading_fee: (open.activity.fee || 0) + (act.fee || 0),
            })
            .eq('id', openMap.trade_id);
        }

        await supabaseAdmin.from('aggregator_trade_map').insert({
          user_id: user.id,
          provider: 'snaptrade',
          provider_trade_id: act.id,
          trade_id: openMap?.trade_id ?? null,
        });
        imported++;

        open.remainingUnits -= matchedUnits;
        if (open.remainingUnits <= 0) arr.shift();
      }
    }

    // Update connection metadata
    if (connectionId) {
      await supabaseAdmin
        .from('aggregator_connections')
        .update({
          status: errors.length ? 'error' : 'active',
          last_synced_at: new Date().toISOString(),
          last_error: errors.length ? errors.join(' | ').slice(0, 1000) : null,
          trade_count: imported,
        })
        .eq('user_id', user.id)
        .eq('connection_id', connectionId);
    }

    return jsonResponse({ imported, skipped, errors });
  } catch (err) {
    console.error('[snaptrade-sync-trades] error', err);
    return errorResponse((err as Error).message || 'Internal error', 500);
  }
});
