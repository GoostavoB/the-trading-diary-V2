import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { ExchangeService } from '../_shared/adapters/ExchangeService.ts';
import { decrypt, LegacyCredentialError } from '../_shared/exchangeUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchRequest {
  connectionId: string;
  mode: 'preview' | 'import';
  selectedTradeIds?: string[];
  startDate?: string;
  endDate?: string;
}

/** trades.trade_type CHECK only allows 'spot' | 'futures' | 'dex'. Map adapter marketType onto it — never hardcode. */
function toTradeType(marketType: string | undefined): 'spot' | 'futures' {
  return marketType === 'spot' ? 'spot' : 'futures';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { connectionId, mode, selectedTradeIds, startDate, endDate }: FetchRequest = await req.json();

    // Fetch connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('exchange_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Handle import mode
    if (mode === 'import') {
      if (!selectedTradeIds || selectedTradeIds.length === 0) {
        throw new Error('No trades selected for import');
      }

      // Fetch selected pending trades
      const { data: pendingTrades, error: fetchError } = await supabaseClient
        .from('exchange_pending_trades')
        .select('*')
        .in('id', selectedTradeIds)
        .eq('connection_id', connectionId);

      if (fetchError) throw fetchError;

      // Insert into trades table
      let imported = 0;
      let skipped = 0;

      for (const pending of pendingTrades || []) {
        const { error } = await supabaseClient
          .from('trades')
          .insert(pending.trade_data);

        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            console.error('Insert error:', error);
          }
        } else {
          imported++;
        }
      }

      // Clean up pending trades
      await supabaseClient
        .from('exchange_pending_trades')
        .delete()
        .eq('connection_id', connectionId);

      // Update connection
      await supabaseClient
        .from('exchange_connections')
        .update({
          sync_status: 'success',
          last_synced_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', connectionId);

      return new Response(
        JSON.stringify({
          success: true,
          tradesImported: imported,
          tradesSkipped: skipped,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to syncing for preview mode
    await supabaseClient
      .from('exchange_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connectionId);

    // Create sync history record
    const { data: syncHistory } = await supabaseClient
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

    // Decrypt credentials (AES-256-GCM — see _shared/exchangeUtils.ts).
    // Rows saved before the encryption fix (plain Base64) will fail to
    // decrypt here — that's expected, not a bug: prompt reconnect instead
    // of crashing unhelpfully.
    let apiKey: string;
    let apiSecret: string;
    let apiPassphrase: string | undefined;
    try {
      apiKey = await decrypt(connection.api_key_encrypted);
      apiSecret = await decrypt(connection.api_secret_encrypted);
      apiPassphrase = connection.api_passphrase_encrypted
        ? await decrypt(connection.api_passphrase_encrypted)
        : undefined;
    } catch (error) {
      const message =
        error instanceof LegacyCredentialError
          ? error.message
          : 'Failed to read stored credentials. Please reconnect this exchange.';

      await supabaseClient
        .from('exchange_connections')
        .update({ sync_status: 'error', sync_error: message })
        .eq('id', connectionId);

      throw new Error(message);
    }

    // Calculate date range. sync_start_date is a hard floor stored on the
    // connection — it always wins over whatever the caller requests, so
    // "only import trades from date X forward" holds true even if some
    // future caller forgets to pass startDate (e.g. a cron job).
    const endTime = endDate ? new Date(endDate) : new Date();
    const requestedStart = startDate ? new Date(startDate) : null;
    const floor = connection.sync_start_date ? new Date(connection.sync_start_date) : null;
    const defaultStart = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // fallback: last 30 days
    const startTime =
      floor && (!requestedStart || requestedStart < floor) ? floor : requestedStart ?? defaultStart;

    const marketTypes: string[] =
      Array.isArray(connection.market_types) && connection.market_types.length > 0
        ? connection.market_types
        : ['spot', 'swap'];

    // Initialize exchange service and fetch trades with timeout
    const exchangeService = new ExchangeService();
    
    console.log(`[${connection.exchange_name}] Initializing exchange connection...`);
    const initialized = await exchangeService.initializeExchange(
      connection.exchange_name,
      { apiKey, apiSecret, apiPassphrase }
    );

    if (!initialized) {
      const initError = exchangeService.lastInitError;
      const errorMsg =
        initError?.type === 'network'
          ? `Could not reach ${connection.exchange_name} right now. This is a network/connectivity issue, not your API key. Please try again in a moment. (${initError.message})`
          : initError?.type === 'auth'
            ? `Invalid API credentials. Please check your API key and secret. (${initError.message})`
            : initError?.message ?? `Connection to ${connection.exchange_name} failed.`;
      console.error(`[${connection.exchange_name}] Connection failed (${initError?.type ?? 'unknown'}):`, errorMsg);
      
      await supabaseClient
        .from('exchange_connections')
        .update({
          sync_status: 'error',
          sync_error: errorMsg,
        })
        .eq('id', connectionId);

      throw new Error(errorMsg);
    }
    
    console.log(`[${connection.exchange_name}] Connection successful`);
    
    // Get display name for better logging
    const displayName = exchangeService.getExchangeName(connection.exchange_name) || connection.exchange_name;

    // Fetch trades with 60 second timeout
    console.log(`[${displayName}] Fetching trades from ${startTime.toISOString()} to ${endTime.toISOString()}...`);
    
    const fetchPromise = exchangeService.syncExchange(connection.exchange_name, {
      startDate: startTime,
      endDate: endTime,
      marketTypes,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sync timed out. Please try again with a smaller date range.')), 60000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (!result.success || !result.trades) {
      const errorMessage = result.error || 'Failed to fetch trades. Please try again.';
      console.error(`[${displayName}] Fetch failed:`, errorMessage);
      
      await supabaseClient
        .from('exchange_connections')
        .update({
          sync_status: 'error',
          sync_error: errorMessage,
        })
        .eq('id', connectionId);

      throw new Error(errorMessage);
    }
    
    console.log(`[${displayName}] Successfully fetched ${result.trades.length} trades`);

    // Normalize trades for database
    console.log(`[${displayName}] Normalizing ${result.trades.length} trades for database...`);
    
    // IMPORTANT: these keys must match the REAL `trades` table columns (see
    // src/integrations/supabase/types.ts, the generated source of truth —
    // NOT what earlier versions of this function guessed). The previous
    // version wrote `pair`, `type`, `size`, `fee`, `fee_currency`,
    // `exchange`, `broker_name`, `pnl_percentage` — none of which exist as
    // columns on `trades`, and it never set `symbol_temp` (a legacy NOT
    // NULL column). That insert would have failed outright the moment
    // anyone actually confirmed an import. Field mapping below mirrors the
    // working manual-entry path in src/pages/Upload.tsx.
    const allTrades = result.trades.map((trade) => {
      const openedAt = new Date(trade.timestamp).toISOString();
      const tradeType = toTradeType(trade.marketType);
      const side = trade.side === 'buy' ? 'long' : trade.side === 'sell' ? 'short' : trade.side;

      return {
        user_id: user.id,
        symbol: trade.symbol,
        symbol_temp: trade.symbol, // legacy NOT NULL column — must always be set
        side,
        side_temp: side,
        trade_type: tradeType, // 'spot' | 'futures' — never hardcode 'spot'
        broker: displayName,
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
        notes: `Imported from ${displayName} (${tradeType}). Order ID: ${trade.orderId ?? trade.id}`,
      };
    });

    // Store trades in pending_trades table (preview mode)
    console.log(`[${displayName}] Storing ${allTrades.length} trades in pending_trades table...`);
    
    let stored = 0;
    let errors = 0;
    
    for (const trade of allTrades) {
      const { error } = await supabaseClient
        .from('exchange_pending_trades')
        .insert({
          user_id: user.id,
          connection_id: connectionId,
          trade_data: trade,
          is_selected: true,
        });
      
      if (error) {
        console.error(`[${displayName}] Failed to store trade:`, error);
        errors++;
      } else {
        stored++;
      }
    }
    
    console.log(`[${displayName}] Stored ${stored} trades (${errors} errors)`);

    // Update connection status
    await supabaseClient
      .from('exchange_connections')
      .update({
        sync_status: 'pending_review',
        sync_error: null,
      })
      .eq('id', connectionId);

    // Update sync history
    if (syncHistory) {
      await supabaseClient
        .from('exchange_sync_history')
        .update({
          trades_fetched: stored,
          status: 'pending_review',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncHistory.id);
    }

    console.log(`[${displayName}] Fetch complete. ${stored} trades ready for review.`);

    return new Response(
      JSON.stringify({
        success: true,
        tradesFetched: stored,
        exchangeName: displayName,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-exchange-trades:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Update connection status with error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: req.headers.get('Authorization')! },
          },
        }
      );

      const { connectionId } = await req.json().catch(() => ({}));
      
      if (connectionId) {
        await supabaseClient
          .from('exchange_connections')
          .update({
            sync_status: 'error',
            sync_error: errorMessage,
          })
          .eq('id', connectionId);
      }
    } catch (updateError) {
      console.error('Failed to update connection status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
