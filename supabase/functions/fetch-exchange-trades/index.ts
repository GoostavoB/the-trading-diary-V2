import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { ExchangeService } from '../_shared/adapters/ExchangeService.ts';

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
  symbol?: string;
}

function decrypt(encryptedText: string): string {
  return atob(encryptedText);
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

    const { connectionId, mode, selectedTradeIds, startDate, endDate, symbol }: FetchRequest = await req.json();

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

    // Decrypt credentials
    const apiKey = decrypt(connection.api_key_encrypted);
    const apiSecret = decrypt(connection.api_secret_encrypted);
    const apiPassphrase = connection.api_passphrase_encrypted 
      ? decrypt(connection.api_passphrase_encrypted)
      : undefined;

    // Calculate date range
    const endTime = endDate ? new Date(endDate) : new Date();
    const startTime = startDate
      ? new Date(startDate)
      : new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    // Initialize exchange service and fetch trades with timeout
    const exchangeService = new ExchangeService();
    
    console.log(`[${connection.exchange_name}] Initializing exchange connection...`);
    const initialized = await exchangeService.initializeExchange(
      connection.exchange_name,
      { apiKey, apiSecret, apiPassphrase }
    );

    if (!initialized) {
      const errorMsg = 'Invalid API credentials. Please check your API key and secret.';
      console.error(`[${connection.exchange_name}] Connection failed:`, errorMsg);
      
      await supabaseClient
        .from('exchange_connections')
        .update({
          sync_status: 'error',
          sync_error: errorMsg,
        })
        .eq('id', connectionId);

      throw new Error(`Failed to connect to ${connection.exchange_name}. Please check your credentials.`);
    }
    
    console.log(`[${connection.exchange_name}] Connection successful`);
    
    const displayName = exchangeService.getExchangeName(connection.exchange_name) || connection.exchange_name;
    const tradingType = connection.trading_type || 'spot';

    // Futures health check when applicable
    if (tradingType === 'futures' || tradingType === 'both') {
      const futHealth = await exchangeService.performFuturesHealthCheck(connection.exchange_name);
      console.log(`[${displayName}] Futures health:`, futHealth);
      if (futHealth && futHealth.status === 'down') {
        const errMsg = `Futures permission check failed${futHealth.lastError ? `: ${futHealth.lastError}` : ''}`;
        await supabaseClient
          .from('exchange_connections')
          .update({ sync_status: 'error', sync_error: errMsg })
          .eq('id', connectionId);
        if (syncHistory) {
          await supabaseClient
            .from('exchange_sync_history')
            .update({ status: 'error', completed_at: new Date().toISOString() })
            .eq('id', syncHistory.id);
        }
        return new Response(JSON.stringify({ error: errMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    console.log(`[${displayName}] Fetching ${tradingType} trades from ${startTime.toISOString()} to ${endTime.toISOString()}...`);
    
    let fetchedTrades: any[] = [];
    
    if (tradingType === 'spot' || tradingType === 'both') {
      const spotResult = await exchangeService.syncExchange(connection.exchange_name, {
        startDate: startTime,
        endDate: endTime,
        tradingType: 'spot',
        symbol,
      });
      if (spotResult.trades) {
        fetchedTrades.push(...spotResult.trades.map(t => ({ ...t, trading_type: 'spot' })));
      }
    }
    
    if (tradingType === 'futures' || tradingType === 'both') {
      const futuresResult = await exchangeService.syncExchange(connection.exchange_name, {
        startDate: startTime,
        endDate: endTime,
        tradingType: 'futures',
        symbol,
      });
      if (futuresResult.trades) {
        fetchedTrades.push(...futuresResult.trades.map(t => ({ ...t, trading_type: 'futures' })));
      }
    }

  // Fallback: if user selected spot but nothing returned, try futures for exchanges that support it
  const supportsFutures = ['bingx','binance','bybit','mexc','okx','gateio','kucoin'].includes(connection.exchange_name.toLowerCase());
  if (tradingType === 'spot' && fetchedTrades.length === 0 && supportsFutures) {
    console.log(`[${displayName}] Spot returned 0 trades, trying futures as fallback...`);
    const futuresResult = await exchangeService.syncExchange(connection.exchange_name, {
      startDate: startTime,
      endDate: endTime,
      tradingType: 'futures',
      symbol,
    });
    if (futuresResult.trades) {
      fetchedTrades.push(...futuresResult.trades.map(t => ({ ...t, trading_type: 'futures' })));
    }
  }

    console.log(`[${displayName}] Successfully fetched ${fetchedTrades.length} trades`);

    // Normalize trades for database
    console.log(`[${displayName}] Normalizing ${fetchedTrades.length} trades for database...`);
    
    const allTrades = fetchedTrades.map(trade => ({
      user_id: user.id,
      pair: trade.symbol,
      side: trade.side === 'buy' ? 'long' : trade.side === 'sell' ? 'short' : trade.side,
      type: trade.trading_type === 'futures' ? 'futures' : 'spot',
      entry_price: trade.price,
      exit_price: trade.price,
      size: trade.quantity,
      pnl: 0,
      pnl_percentage: 0,
      fee: trade.fee,
      fee_currency: trade.feeCurrency || trade.feeAsset || 'USDT',
      exchange: displayName,
      opened_at: new Date(trade.timestamp).toISOString(),
      closed_at: new Date(trade.timestamp).toISOString(),
      notes: `Imported from ${displayName}. Order ID: ${trade.orderId}`,
      broker_name: displayName,
    }));

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
        symbolUsed: symbol || null,
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
