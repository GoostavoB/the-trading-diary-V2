import { memo, useMemo } from 'react';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { Sparkles, TrendingUp, TrendingDown, Clock, Target, Award } from 'lucide-react';

interface AIInsightsWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const AIInsightsWidget = memo(({ trades }: AIInsightsWidgetProps) => {
  const insights = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Best & worst asset
    const byAsset: Record<string, { pnl: number; count: number }> = {};
    trades.forEach(t => {
      const sym = t.symbol || 'Unknown';
      if (!byAsset[sym]) byAsset[sym] = { pnl: 0, count: 0 };
      byAsset[sym].pnl += t.profit_loss ?? 0;
      byAsset[sym].count++;
    });
    const assetEntries = Object.entries(byAsset);
    const bestAsset = assetEntries.sort((a, b) => b[1].pnl - a[1].pnl)[0];
    const worstAsset = assetEntries.sort((a, b) => a[1].pnl - b[1].pnl)[0];

    // Best period of day
    const byPeriod: Record<string, { wins: number; total: number }> = {
      morning: { wins: 0, total: 0 },
      afternoon: { wins: 0, total: 0 },
      night: { wins: 0, total: 0 },
    };
    trades.forEach(t => {
      const p = (t.period_of_day as string) || 'morning';
      if (byPeriod[p]) {
        byPeriod[p].total++;
        if ((t.profit_loss ?? 0) > 0) byPeriod[p].wins++;
      }
    });
    const bestPeriod = Object.entries(byPeriod)
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];

    // Best setup
    const bySetup: Record<string, { wins: number; total: number }> = {};
    trades.filter(t => t.setup).forEach(t => {
      const s = t.setup!;
      if (!bySetup[s]) bySetup[s] = { wins: 0, total: 0 };
      bySetup[s].total++;
      if ((t.profit_loss ?? 0) > 0) bySetup[s].wins++;
    });
    const setupEntries = Object.entries(bySetup).filter(([, v]) => v.total >= 2);
    const bestSetup = setupEntries.sort(
      (a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)
    )[0];

    // Current streak
    const sorted = [...trades].sort((a, b) =>
      new Date(b.trade_date ?? b.created_at).getTime() - new Date(a.trade_date ?? a.created_at).getTime()
    );
    let streak = 0;
    const isWin = (sorted[0]?.profit_loss ?? 0) > 0;
    for (const t of sorted) {
      const win = (t.profit_loss ?? 0) > 0;
      if (win === isWin) streak++;
      else break;
    }

    return { bestAsset, worstAsset, bestPeriod, bestSetup, streak, isWin };
  }, [trades]);

  if (!insights) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Add trades to see your insights</p>
      </div>
    );
  }

  const periodLabel: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
  };

  const items = [
    {
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Best Asset',
      value: insights.bestAsset?.[0] ?? '—',
      sub: insights.bestAsset
        ? `+$${insights.bestAsset[1].pnl.toFixed(0)} total`
        : '',
    },
    {
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Worst Asset',
      value: insights.worstAsset?.[0] ?? '—',
      sub: insights.worstAsset
        ? `$${insights.worstAsset[1].pnl.toFixed(0)} total`
        : '',
    },
    {
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      label: 'Best Time',
      value: insights.bestPeriod
        ? periodLabel[insights.bestPeriod[0]]
        : '—',
      sub: insights.bestPeriod
        ? `${Math.round((insights.bestPeriod[1].wins / insights.bestPeriod[1].total) * 100)}% win rate`
        : '',
    },
    {
      icon: Target,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      label: 'Best Setup',
      value: insights.bestSetup?.[0] ?? 'N/A',
      sub: insights.bestSetup
        ? `${Math.round((insights.bestSetup[1].wins / insights.bestSetup[1].total) * 100)}% win rate`
        : 'Log more trades',
    },
    {
      icon: Award,
      color: insights.isWin ? 'text-green-500' : 'text-red-400',
      bg: insights.isWin ? 'bg-green-500/10' : 'bg-red-500/10',
      label: insights.isWin ? 'Win Streak' : 'Loss Streak',
      value: `${insights.streak} trade${insights.streak !== 1 ? 's' : ''}`,
      sub: insights.isWin ? 'Keep going!' : 'Review your plan',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">AI Insights</h3>
        <span className="ml-auto text-xs text-muted-foreground">From {trades.length} trades</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {items.map(({ icon: Icon, color, bg, label, value, sub }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${bg}`}>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
              <p className="text-sm font-semibold truncate">{value}</p>
            </div>
            {sub && (
              <span className="text-xs text-muted-foreground flex-shrink-0">{sub}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

AIInsightsWidget.displayName = 'AIInsightsWidget';
