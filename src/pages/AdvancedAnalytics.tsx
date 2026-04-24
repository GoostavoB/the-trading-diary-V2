import { useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { AdvancedMetricsCard } from '@/components/analytics/AdvancedMetricsCard';
import { ABTestingPanel } from '@/components/analytics/ABTestingPanel';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumFeatureLock } from '@/components/PremiumFeatureLock';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/trade';
import { SEO } from '@/components/SEO';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { Loader2 } from 'lucide-react';

export default function AdvancedAnalytics() {
  const { isFeatureLocked } = usePremiumFeatures();
  const isPremiumLocked = isFeatureLocked('pro');
  const { user } = useAuth();

  // Fetch real trades from Supabase
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['trades-advanced-analytics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('trade_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!trades.length) return null;

    const wins = trades.filter(t => (t.profit_loss ?? 0) > 0);
    const losses = trades.filter(t => (t.profit_loss ?? 0) <= 0);
    const totalPnL = trades.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
    const winRate = (wins.length / trades.length) * 100;
    const avgProfit = wins.length ? wins.reduce((s, t) => s + (t.profit_loss ?? 0), 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + (t.profit_loss ?? 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgProfit * wins.length) / (avgLoss * losses.length) : 0;

    // Max drawdown
    let peak = 0, equity = 0, maxDD = 0;
    for (const t of trades) {
      equity += t.profit_loss ?? 0;
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
      if (dd < maxDD) maxDD = dd;
    }

    // Trade distribution by duration
    const scalp = trades.filter(t => (t.duration_minutes ?? 0) < 5 && (t.duration_hours ?? 0) === 0 && (t.duration_days ?? 0) === 0).length;
    const day = trades.filter(t => (t.duration_days ?? 0) === 0 && !((t.duration_minutes ?? 0) < 5 && (t.duration_hours ?? 0) === 0)).length;
    const swing = trades.filter(t => (t.duration_days ?? 0) > 0).length;

    // Cumulative PnL for charts
    let cum = 0;
    const pnlSeries = trades.map(t => {
      cum += t.profit_loss ?? 0;
      return { date: (t.trade_date ?? t.created_at).substring(0, 10), value: Math.round(cum * 100) / 100 };
    });

    // Rolling win rate (7-trade window)
    const wrSeries = trades.map((_, i) => {
      const window = trades.slice(Math.max(0, i - 6), i + 1);
      const wr = window.filter(t => (t.profit_loss ?? 0) > 0).length / window.length * 100;
      return { date: (trades[i].trade_date ?? trades[i].created_at).substring(0, 10), value: Math.round(wr) };
    });

    // Individual trade profit series
    const profitSeries = trades.map(t => ({
      date: (t.trade_date ?? t.created_at).substring(0, 10),
      value: Math.round((t.profit_loss ?? 0) * 100) / 100,
    }));

    return { totalPnL, winRate, avgProfit, profitFactor, maxDD, scalp, day, swing, pnlSeries, wrSeries, profitSeries };
  }, [trades]);

  const fmt = (n: number, decimals = 2) =>
    n >= 0 ? `+$${n.toFixed(decimals)}` : `-$${Math.abs(n).toFixed(decimals)}`;

  return (
    <>
      <SEO
        title="Advanced Analytics | The Trading Diary"
        description="Deep dive into your trading performance with advanced analytics and A/B testing."
        noindex={true}
      />
      <AppLayout>
        <PremiumFeatureLock requiredPlan="pro" isLocked={isPremiumLocked}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
              <p className="text-muted-foreground">
                Detailed performance insights and experimentation tools
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !metrics ? (
              <PremiumCard className="p-12 text-center">
                <p className="text-muted-foreground">No trades yet — add some trades to see your advanced analytics.</p>
              </PremiumCard>
            ) : (
              <>
                {/* Top KPI cards — real computed data */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <AdvancedMetricsCard
                    title="Cumulative P&L"
                    value={fmt(metrics.totalPnL)}
                    change={metrics.totalPnL >= 0 ? Math.abs((metrics.totalPnL / trades.length) * 10) : -Math.abs((metrics.totalPnL / trades.length) * 10)}
                    data={metrics.pnlSeries}
                    type="area"
                    icon="dollar"
                  />
                  <AdvancedMetricsCard
                    title="Win Rate (rolling 7)"
                    value={`${metrics.winRate.toFixed(1)}%`}
                    change={metrics.winRate - 50}
                    data={metrics.wrSeries}
                    type="line"
                    icon="percent"
                  />
                  <AdvancedMetricsCard
                    title="Avg Profit per Trade"
                    value={fmt(metrics.avgProfit)}
                    change={metrics.avgProfit >= 0 ? 1 : -1}
                    data={metrics.profitSeries}
                    type="area"
                    icon="trending"
                  />
                </div>

                <Tabs defaultValue="metrics" className="w-full">
                  <TabsList>
                    <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                    <TabsTrigger value="testing">A/B Testing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metrics" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Trade Distribution — computed from real durations */}
                      <PremiumCard className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Trade Distribution</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Scalping (<5 min)', count: metrics.scalp },
                            { label: 'Day Trading (intraday)', count: metrics.day },
                            { label: 'Swing Trading (>1 day)', count: metrics.swing },
                          ].map(({ label, count }) => {
                            const pct = trades.length > 0 ? Math.round((count / trades.length) * 100) : 0;
                            return (
                              <div key={label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-muted-foreground">{label}</span>
                                  <span className="font-medium text-sm">{pct}% ({count})</span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </PremiumCard>

                      {/* Risk Metrics — real computed */}
                      <PremiumCard className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-1 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Profit Factor</span>
                            <span className={`font-medium ${metrics.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                              {metrics.profitFactor.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Max Drawdown</span>
                            <span className="font-medium text-red-500">
                              {metrics.maxDD.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Win Rate</span>
                            <span className="font-medium">{metrics.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Total Trades</span>
                            <span className="font-medium">{trades.length}</span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-muted-foreground">Total P&L</span>
                            <span className={`font-semibold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              <BlurredCurrency value={metrics.totalPnL} />
                            </span>
                          </div>
                        </div>
                      </PremiumCard>
                    </div>
                  </TabsContent>

                  <TabsContent value="testing" className="mt-6">
                    <ABTestingPanel />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </PremiumFeatureLock>
      </AppLayout>
    </>
  );
}
