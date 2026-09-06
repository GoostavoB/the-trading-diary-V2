import { useMemo, useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trade } from '@/types/trade';
import { TagCategory, TAG_CATEGORY_META } from '@/hooks/useTradeTags';

interface TagPerformanceProps {
  trades: Trade[];
}

interface TagStats {
  tag: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

const CATEGORIES: TagCategory[] = ['setup', 'error', 'market'];

const tagsOf = (trade: Trade, category: TagCategory): string[] => {
  if (category === 'setup') return trade.setup_tags || [];
  if (category === 'error') return trade.error_tags || [];
  return trade.market_tags || [];
};

const formatCurrency = (value: number) =>
  `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const TagPerformance = ({ trades }: TagPerformanceProps) => {
  const [category, setCategory] = useState<TagCategory>('setup');

  const stats = useMemo<TagStats[]>(() => {
    const map = new Map<string, { trades: number; wins: number; losses: number; totalPnl: number }>();

    trades.forEach((trade) => {
      const pnl = Number(trade.profit_loss ?? trade.pnl ?? 0);
      tagsOf(trade, category).forEach((raw) => {
        const tag = (raw || '').trim();
        if (!tag) return;
        const entry = map.get(tag) || { trades: 0, wins: 0, losses: 0, totalPnl: 0 };
        entry.trades += 1;
        if (pnl > 0) entry.wins += 1;
        else if (pnl < 0) entry.losses += 1;
        entry.totalPnl += pnl;
        map.set(tag, entry);
      });
    });

    return Array.from(map.entries())
      .map(([tag, e]) => ({
        tag,
        trades: e.trades,
        wins: e.wins,
        losses: e.losses,
        winRate: e.trades > 0 ? (e.wins / e.trades) * 100 : 0,
        totalPnl: e.totalPnl,
        avgPnl: e.trades > 0 ? e.totalPnl / e.trades : 0,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades, category]);

  return (
    <PremiumCard className="p-6 glass">
      <div className="flex items-center gap-3 mb-1">
        <Tags className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Performance by tag</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Win rate, trade count and P&amp;L grouped by your own tags.
      </p>

      <div className="flex gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? 'default' : 'outline'}
            onClick={() => setCategory(c)}
          >
            {TAG_CATEGORY_META[c].label}
          </Button>
        ))}
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No trades tagged in this category yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/60">
                <th className="py-2 pr-4 font-medium">Tag</th>
                <th className="py-2 px-4 font-medium text-right">Trades</th>
                <th className="py-2 px-4 font-medium text-right">Win rate</th>
                <th className="py-2 px-4 font-medium text-right">W / L</th>
                <th className="py-2 px-4 font-medium text-right">Avg P&amp;L</th>
                <th className="py-2 pl-4 font-medium text-right">Total P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.tag} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.tag}</td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums">{row.trades}</td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums">
                    {row.winRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-num tabular-nums text-muted-foreground">
                    {row.wins} / {row.losses}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-4 text-right font-num tabular-nums',
                      row.avgPnl >= 0 ? 'text-apple-green' : 'text-apple-red'
                    )}
                  >
                    {formatCurrency(row.avgPnl)}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 pl-4 text-right font-num tabular-nums font-semibold',
                      row.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'
                    )}
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
