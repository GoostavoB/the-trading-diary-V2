// Exchange proxy - always-on Node service.
//
// WHY THIS EXISTS: Supabase Edge Functions run on Deno's serverless edge
// runtime, which has a documented, unresolved intermittent outbound-fetch
// failure ("TypeError: fetch failed" / DNS resolution errors), more likely
// right after a cold boot. See:
//   https://github.com/supabase/edge-runtime/issues/263
//   https://github.com/supabase/supabase/issues/21453
// This service runs as one normal long-lived Node process - no cold starts,
// no Deno-specific networking quirks.
//
// MIGRATION STRATEGY: only BingX is handled natively here so far. Every
// other exchange's "preview" request is transparently forwarded to the
// existing Supabase Edge Function.

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { decrypt, LegacyCredentialError } from './crypto.js';
import * as bingx from './exchanges/bingx.js';

const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
.split(',')
.map((s) => s.trim())
.filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.');
  process.exit(1);
}

const EXCHANGE_HANDLERS = {
  bingx,
};

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.length || (origin && ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

function toTradeType(marketType) {
  return marketType === 'spot' ? 'spot' : 'futures';
}

function supabaseForRequest(req) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.authorization || '' } },
  });
}

async function handleImport(req, res, supabase, user, connectionId, selectedTradeIds) {
  if (!selectedTradeIds || selectedTradeIds.length === 0) {
    return res.status(400).json({ error: 'No trades selected for import' });
  }

const { data: pendingTrades, error: fetchError } = await supabase
  .from('exchange_pending_trades')
  .select('*')
  .in('id', selectedTradeIds)
  .eq('connection_id', connectionId);

if (fetchError) throw fetchError;

let imported = 0;
  let skipped = 0;

for (const pending of pendingTrades || []) {
  const { error } = await supabase.from('trades').insert(pending.trade_data);
  if (error) {
    if (error.code === '23505') skipped++;
    else console.error('Insert error:', error);
  } else {
    imported++;
  }
}

await supabase.from('exchange_pending_trades').delete().eq('connection_id', connectionId);

await supabase
  .from('exchange_connections')
  .update({ sync_status: 'success', last_synced_at: new Date().toISOString(), sync_error: null })
  .eq('id', connectionId);

return res.json({ success: true, tradesImported: imported, tradesSkipped: skipped });
}

async function forwardToLegacyEdgeFunction(req, res) {
  const upstream = `${SUPABASE_URL}/functions/v1/fetch-exchange-trades`;
  const resp = await fetch(upstream, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(req.body),
  });
  const text = await resp.text();
  res.status(resp.status);
  res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
  res.send(text);
}

app.post('/fetch-exchange-trades', async (req, res) => {
  const { connectionId, mode, selectedTradeIds, startDate, endDate } = req.body || {};

         try {
           const supabase = supabaseForRequest(req);
           const {
             data: { user },
             error: userError,
           } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: connection, error: connectionError } = await supabase
           .from('exchange_connections')
           .select('*')
           .eq('id', connectionId)
           .eq('user_id', user.id)
           .single();

  if (connectionError || !connection) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  if (mode === 'import') {
    return await handleImport(req, res, supabase, user, connectionId, selectedTradeIds);
  }

  const exchangeName = (connection.exchange_name || '').toLowerCase();
           const handler = EXCHANGE_HANDLERS[exchangeName];

  if (!handler) {
    return await forwardToLegacyEdgeFunction(req, res);
  }

  await supabase.from('exchange_connections').update({ sync_status: 'syncing' }).eq('id', connectionId);

  const { data: syncHistory } = await supabase
           .from('exchange_sync_history')
           .insert({
             user_id: user.id,
             connection_id: connectionId,
             exchange_name: connection.exchange_name,
             sync_type: 'manual',
             status: 'processing',
           })
           .select()
           .single();

  let apiKey, apiSecret, apiPassphrase;
           try {
             apiKey = decrypt(connection.api_key_encrypted);
             apiSecret = decrypt(connection.api_secret_encrypted);
             apiPassphrase = connection.api_passphrase_encrypted
             ? decrypt(connection.api_passphrase_encrypted)
               : undefined;
           } catch (error) {
             const message =
               error instanceof LegacyCredentialError
             ? error.message
               : 'Failed to read stored credentials. Please reconnect this exchange.';
             await supabase
             .from('exchange_connections')
             .update({ sync_status: 'error', sync_error: message })
             .eq('id', connectionId);
             return res.status(500).json({ error: message });
           }

  const endTime = endDate ? new Date(endDate) : new Date();
           const requestedStart = startDate ? new Date(startDate) : null;
           const floor = connection.sync_start_date ? new Date(connection.sync_start_date) : null;
           const defaultStart = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
           const startTime = floor && (!requestedStart || requestedStart < floor) ? floor : requestedStart ?? defaultStart;

  const marketTypes =
    Array.isArray(connection.market_types) && connection.market_types.length > 0
           ? connection.market_types
    : ['spot', 'swap'];

  try {
    await handler.testConnection({ apiKey, apiSecret, apiPassphrase });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
    .from('exchange_connections')
    .update({ sync_status: 'error', sync_error: `Invalid API credentials or ${exchangeName} rejected the request: ${message}` })
    .eq('id', connectionId);
    return res.status(502).json({ error: `Failed to connect to ${exchangeName}: ${message}` });
  }

  let trades;
           try {
             trades = await handler.fetchTrades({
               apiKey,
               apiSecret,
               apiPassphrase,
               startTime,
               endTime,
               marketTypes,
             });
           } catch (error) {
             const message = error instanceof Error ? error.message : String(error);
             await supabase
             .from('exchange_connections')
             .update({ sync_status: 'error', sync_error: message })
             .eq('id', connectionId);
             return res.status(502).json({ error: message });
           }

  const allTrades = trades.map((trade) => {
    const openedAt = new Date(trade.timestamp).toISOString();
    const tradeType = toTradeType(trade.marketType);
    const side = trade.side === 'buy' ? 'long' : trade.side === 'sell' ? 'short' : trade.side;

                               return {
                                 user_id: user.id,
                                 symbol: trade.symbol,
                                 symbol_temp: trade.symbol,
                                 side,
                                 side_temp: side,
                                 trade_type: tradeType,
                                 broker: exchangeName,
                                 entry_price: trade.price,
                                 exit_price: trade.price,
                                 position_size: trade.quantity,
                                 pnl: 0,
                                 roi: 0,
                                 trading_fee: trade.fee ?? 0,
                                 opened_at: openedAt,
                                 closed_at: openedAt,
                                 trade_date: openedAt,
                                 exchange_source: connection.exchange_name,
                                 exchange_trade_id: trade.id || trade.orderId || null,
                                 trade_hash: `${connection.exchange_name}_${trade.id || trade.orderId}_${openedAt}`,
                                 notes: `Imported from ${exchangeName} (${tradeType}). Order ID: ${trade.orderId ?? trade.id}`,
                               };
  });

  let stored = 0;
           let errors = 0;
           for (const trade of allTrades) {
             const { error } = await supabase
             .from('exchange_pending_trades')
             .insert({ user_id: user.id, connection_id: connectionId, trade_data: trade, is_selected: true });
             if (error) {
               errors++;
             } else {
               stored++;
             }
           }

  await supabase
           .from('exchange_connections')
           .update({ sync_status: 'pending_review', sync_error: null })
           .eq('id', connectionId);

  if (syncHistory) {
    await supabase
    .from('exchange_sync_history')
    .update({ trades_fetched: stored, status: 'pending_review', completed_at: new Date().toISOString() })
    .eq('id', syncHistory.id);
  }

  return res.json({ success: true, tradesFetched: stored, exchangeName });
         } catch (error) {
           const message = error instanceof Error ? error.message : 'Internal server error';

  try {
    const supabase = supabaseForRequest(req);
    if (connectionId) {
      await supabase
      .from('exchange_connections')
      .update({ sync_status: 'error', sync_error: message })
      .eq('id', connectionId);
    }
  } catch (updateError) {
    console.error('Failed to update connection status:', updateError);
  }

  return res.status(500).json({ error: message });
         }
});

app.listen(PORT, () => {
  console.log(`exchange-proxy listening on :${PORT}`);
});
