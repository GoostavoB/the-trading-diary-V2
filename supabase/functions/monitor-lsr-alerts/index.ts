import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LSRData {
  symbol: string;
  longAccount: number;
  shortAccount: number;
  longShortRatio: number;
  timestamp: number;
}

interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: 'rapid_change' | 'cross_below_1' | 'cross_above_1';
  threshold_percentage: number;
  direction: 'up' | 'down' | 'both';
  cooldown_minutes: number;
  last_triggered_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting LSR monitoring cycle...');

    // Symbols to monitor
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const triggeredAlerts: any[] = [];

    for (const symbol of symbols) {
      // Fetch Binance LSR data
      const binanceData = await fetchBinanceLSR(symbol);
      const bybitData = await fetchBybitLSR(symbol);

      if (!binanceData && !bybitData) {
        console.log(`No data available for ${symbol}`);
        continue;
      }

      // Calculate combined ratio
      const currentRatio = calculateCombinedRatio(binanceData, bybitData);
      const longAccount = binanceData?.longAccount || bybitData?.longAccount || 0;
      const shortAccount = binanceData?.shortAccount || bybitData?.shortAccount || 0;

      // Get previous value
      const { data: previousData } = await supabaseClient
        .from('lsr_latest_values')
        .select('ratio_value')
        .eq('symbol', symbol)
        .single();

      const previousRatio = previousData?.ratio_value || currentRatio;

      // Update latest value
      await supabaseClient.rpc('update_lsr_latest_value', {
        p_symbol: symbol,
        p_ratio_value: currentRatio,
        p_long_account: longAccount,
        p_short_account: shortAccount,
        p_binance_ratio: binanceData?.longShortRatio || null,
        p_bybit_ratio: bybitData?.longShortRatio || null,
      });

      // Fetch active alerts for this symbol
      const { data: alerts } = await supabaseClient
        .from('lsr_alerts')
        .select('*')
        .eq('symbol', symbol)
        .eq('is_enabled', true);

      if (!alerts || alerts.length === 0) continue;

      // Check each alert
      for (const alert of alerts as Alert[]) {
        // Check daily cap
        const { data: canTrigger } = await supabaseClient.rpc('check_daily_alert_cap', {
          p_user_id: alert.user_id,
        });

        if (!canTrigger) {
          console.log(`Daily cap reached for user ${alert.user_id}`);
          continue;
        }

        // Check cooldown
        if (alert.last_triggered_at) {
          const lastTrigger = new Date(alert.last_triggered_at);
          const cooldownEnd = new Date(lastTrigger.getTime() + alert.cooldown_minutes * 60000);
          if (new Date() < cooldownEnd) {
            continue;
          }
        }

        // Evaluate alert conditions
        const shouldTrigger = evaluateAlert(alert, currentRatio, previousRatio);

        if (shouldTrigger) {
          const changePercentage = ((currentRatio - previousRatio) / previousRatio) * 100;
          const direction = changePercentage > 0 ? 'up' : 'down';

          // Create alert history entry
          const { data: historyEntry, error } = await supabaseClient
            .from('lsr_alert_history')
            .insert({
              user_id: alert.user_id,
              alert_id: alert.id,
              symbol: alert.symbol,
              alert_type: alert.alert_type,
              ratio_value: currentRatio,
              previous_value: previousRatio,
              change_percentage: changePercentage,
              direction: direction,
              long_account: longAccount,
              short_account: shortAccount,
            })
            .select()
            .single();

          if (!error && historyEntry) {
            // Update last triggered time
            await supabaseClient
              .from('lsr_alerts')
              .update({ last_triggered_at: new Date().toISOString() })
              .eq('id', alert.id);

            // Update daily stats
            await supabaseClient.rpc('increment_daily_alert_count', {
              p_user_id: alert.user_id,
            });

            triggeredAlerts.push({
              alert_id: alert.id,
              user_id: alert.user_id,
              symbol: alert.symbol,
              type: alert.alert_type,
              ratio: currentRatio,
              change: changePercentage,
            });

            console.log(`Alert triggered: ${alert.alert_type} for ${symbol} (user: ${alert.user_id})`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        monitored_symbols: symbols.length,
        triggered_alerts: triggeredAlerts.length,
        alerts: triggeredAlerts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in monitor-lsr-alerts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchBinanceLSR(symbol: string): Promise<LSRData | null> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;

    const latest = data[0];
    return {
      symbol,
      longAccount: parseFloat(latest.longAccount),
      shortAccount: parseFloat(latest.shortAccount),
      longShortRatio: parseFloat(latest.longShortRatio),
      timestamp: latest.timestamp,
    };
  } catch (error) {
    console.error(`Error fetching Binance LSR for ${symbol}:`, error);
    return null;
  }
}

async function fetchBybitLSR(symbol: string): Promise<LSRData | null> {
  try {
    // Bybit uses different symbol format (BTCUSDT -> BTCUSDT)
    const response = await fetch(
      `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=5min&limit=1`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.result?.list || data.result.list.length === 0) return null;

    const latest = data.result.list[0];
    const buyRatio = parseFloat(latest.buyRatio);
    const sellRatio = parseFloat(latest.sellRatio);
    
    return {
      symbol,
      longAccount: buyRatio,
      shortAccount: sellRatio,
      longShortRatio: buyRatio / sellRatio,
      timestamp: parseInt(latest.timestamp),
    };
  } catch (error) {
    console.error(`Error fetching Bybit LSR for ${symbol}:`, error);
    return null;
  }
}

function calculateCombinedRatio(binance: LSRData | null, bybit: LSRData | null): number {
  if (binance && bybit) {
    return (binance.longShortRatio + bybit.longShortRatio) / 2;
  }
  return binance?.longShortRatio || bybit?.longShortRatio || 1.0;
}

function evaluateAlert(alert: Alert, current: number, previous: number): boolean {
  switch (alert.alert_type) {
    case 'rapid_change':
      return evaluateRapidChange(current, previous, alert);
    case 'cross_below_1':
      return evaluateCrossBelowOne(current, previous);
    case 'cross_above_1':
      return evaluateCrossAboveOne(current, previous);
    default:
      return false;
  }
}

function evaluateRapidChange(current: number, previous: number, alert: Alert): boolean {
  const changePercent = ((current - previous) / previous) * 100;
  const absChange = Math.abs(changePercent);

  // Check if change meets threshold
  if (absChange < alert.threshold_percentage) return false;

  // Check direction preference
  if (alert.direction === 'up' && changePercent <= 0) return false;
  if (alert.direction === 'down' && changePercent >= 0) return false;

  return true;
}

function evaluateCrossBelowOne(current: number, previous: number): boolean {
  // Hysteresis: previous must be >= 1.02, current must be <= 0.98
  return previous >= 1.02 && current <= 0.98;
}

function evaluateCrossAboveOne(current: number, previous: number): boolean {
  // Hysteresis: previous must be <= 0.98, current must be >= 1.02
  return previous <= 0.98 && current >= 1.02;
}
