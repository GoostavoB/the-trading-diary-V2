import { useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Radio } from 'lucide-react';
import { Trade } from '@/types/trade';
import { DEFAULT_SIGNAL_SOURCE } from '@/hooks/useSignalSources';

interface SignalSourcePerformanceProps {
  trades: Trade[];
}

interface SourceStats {
  source: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

const formatCurrency = (value: number) =>
  `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const SignalSourcePerformance = ({ trades }: SignalSourcePerformanceProps) => {
  const stats = useMemo<SourceStats[]>(() => {
    const map = new Map<string, { trades: number; wins: number; losses: number; totalPnl: number }>();

    trades.forEach((trade) => {
      const source = (trade.signal_source || '').trim() || DEFAULT_SIGNAL_SOURCE;
      const pnl = Number(trade.profit_loss ?? trade.pnl ?? 0);
      const entry = map.get(source) || { trades: 0, wins: 0, losses: 0, totalPnl: 0 };
      entry.trades += 1;
      if (pnl > 0) entry.wins += 1;
      else if (pnl < 0) entry.losses += 1;
      entry.totalPnl += pnl;
      map.set(source, entry);
    });

    return Array.from(map.entries())
      .map(([source, e]) => ({
        source,
        trades: e.trades,
        wins: e.wins,
        losses: e.losses,
        winRate: e.trades > 0 ? (e.wins / e.trades) * 100 : 0,
        totalPnl: e.totalPnl,
        avgPnl: e.trades > 0 ? e.totalPnl / e.trades : 0,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades]);

  return (
    <PremiumCard className="p-6 glass">
      <div className="flex items-center gap-3 mb-1">
        <Radio className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Performance by signal source</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Compare your own trades against each group or person that sends you signals.
      </p>

      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No trades in this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/60">
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 px-4 font-medium text-right">Trades</th>
                <th className="py-2 px-4 font-medium text-right">Win rate</th>
                <th className="py-2 px-4 font-medium text-right">W / L</th>
                <th className="py-2 px-4 font-medium text-right">Avg P&amp;L</th>
                <th className="py-2 pl-4 font-medium text-right">Total P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.source} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.source}</td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums">{row.trades}</td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums">
                    {row.winRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums text-muted-foreground">
                    {row.wins} / {row.losses}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-num tabular-nums ${
                      row.avgPnl >= 0 ? 'text-apple-green' : 'text-apple-red'
                    }`}
                  >
                    {formatCurrency(row.avgPnl)}
                  </td>
                  <td
                    className={`py-2.5 pl-4 text-right font-num tabular-nums font-semibold ${
                      row.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'
                    }`}
                  >
                    {formatCurrency(row.totalPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PremiumCard>
  );
};
