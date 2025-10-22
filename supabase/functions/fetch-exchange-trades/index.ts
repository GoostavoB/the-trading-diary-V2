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

    // Initialize exchange service and fetch trades
    const exchangeService = new ExchangeService();
    const initialized = await exchangeService.initializeExchange(
      connection.exchange_name,
      { apiKey, apiSecret, apiPassphrase }
    );

    if (!initialized) {
      throw new Error(`Failed to connect to ${connection.exchange_name}. Please check your credentials.`);
    }

    const result = await exchangeService.syncExchange(connection.exchange_name, {
      startDate: startTime,
      endDate: endTime,
    });

    if (!result.success || !result.trades) {
      throw new Error(result.error || 'Failed to fetch trades');
    }

    // Normalize trades for database
    const allTrades = result.trades.map(trade => ({
      user_id: user.id,
      pair: trade.symbol,
      side: trade.side,
      type: 'spot' as const,
      entry_price: trade.price,
      exit_price: trade.price,
      size: trade.quantity,
      pnl: 0,
      pnl_percentage: 0,
      fee: trade.fee,
      fee_currency: trade.feeCurrency || trade.feeAsset || 'USDT',
      exchange: connection.exchange_name,
      opened_at: new Date(trade.timestamp).toISOString(),
      closed_at: new Date(trade.timestamp).toISOString(),
      notes: `Imported from ${connection.exchange_name}. Order ID: ${trade.orderId}`,
      broker_name: connection.exchange_name,
    }));

    // Store trades in pending_trades table (preview mode)
    for (const trade of allTrades) {
      await supabaseClient
        .from('exchange_pending_trades')
        .insert({
          user_id: user.id,
          connection_id: connectionId,
          trade_data: trade,
          is_selected: true,
        });
    }

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
          trades_fetched: allTrades.length,
          status: 'pending_review',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncHistory.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tradesFetched: allTrades.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
