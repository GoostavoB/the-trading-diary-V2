import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alert {
  id: string;
  user_id: string;
  alert_type: string;
  threshold_value: number;
  comparison_operator: string;
  cooldown_minutes: number;
  last_triggered_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting performance alert monitoring...');

    // Get all enabled alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('performance_alerts')
      .select('*')
      .eq('is_enabled', true);

    if (alertsError) throw alertsError;

    console.log(`Found ${alerts?.length || 0} enabled alerts`);

    const triggeredAlerts = [];

    for (const alert of alerts || []) {
      // Check cooldown period
      if (alert.last_triggered_at) {
        const lastTriggered = new Date(alert.last_triggered_at);
        const cooldownEnd = new Date(lastTriggered.getTime() + alert.cooldown_minutes * 60000);
        if (new Date() < cooldownEnd) {
          console.log(`Alert ${alert.id} still in cooldown`);
          continue;
        }
      }

      // Get user's trades for calculation
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', alert.user_id)
        .is('deleted_at', null);

      if (tradesError) {
        console.error(`Error fetching trades for user ${alert.user_id}:`, tradesError);
        continue;
      }

      if (!trades || trades.length === 0) continue;

      // Calculate the metric based on alert type
      let currentValue = 0;
      let shouldTrigger = false;

      switch (alert.alert_type) {
        case 'win_rate': {
          const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
          currentValue = (winningTrades / trades.length) * 100;
          break;
        }

        case 'total_pnl':
          currentValue = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          break;

        case 'daily_pnl': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTrades = trades.filter(t => new Date(t.entry_time) >= today);
          currentValue = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          break;
        }

        case 'total_trades':
          currentValue = trades.length;
          break;

        case 'losing_streak': {
          let streak = 0;
          const sortedTrades = [...trades].sort((a, b) =>
            new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime()
          );
          for (const trade of sortedTrades) {
            if ((trade.pnl || 0) < 0) {
              streak++;
            } else {
              break;
            }
          }
          currentValue = streak;
          break;
        }

        default:
          continue;
      }

      // Check if alert should trigger based on comparison operator
      switch (alert.comparison_operator) {
        case '>':
          shouldTrigger = currentValue > alert.threshold_value;
          break;
        case '<':
          shouldTrigger = currentValue < alert.threshold_value;
          break;
        case '>=':
          shouldTrigger = currentValue >= alert.threshold_value;
          break;
        case '<=':
          shouldTrigger = currentValue <= alert.threshold_value;
          break;
        case '==':
          shouldTrigger = currentValue === alert.threshold_value;
          break;
      }

      if (shouldTrigger) {
        console.log(`Triggering alert ${alert.id} for user ${alert.user_id}`);

        // Create alert history entry
        const { error: historyError } = await supabase
          .from('alert_history')
          .insert({
            alert_id: alert.id,
            user_id: alert.user_id,
            alert_type: alert.alert_type,
            triggered_value: currentValue,
            threshold_value: alert.threshold_value,
            message: `${alert.alert_type.replace('_', ' ')} ${alert.comparison_operator} ${alert.threshold_value}`,
          });

        if (historyError) {
          console.error('Error creating alert history:', historyError);
        }

        // Update last triggered timestamp
        const { error: updateError } = await supabase
          .from('performance_alerts')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        if (updateError) {
          console.error('Error updating alert:', updateError);
        }

        triggeredAlerts.push({
          alertId: alert.id,
          userId: alert.user_id,
          type: alert.alert_type,
          value: currentValue,
        });
      }
    }

    console.log(`Monitoring complete. Triggered ${triggeredAlerts.length} alerts.`);

    return new Response(
      JSON.stringify({
        success: true,
        triggeredCount: triggeredAlerts.length,
        triggeredAlerts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in monitor-performance-alerts:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
