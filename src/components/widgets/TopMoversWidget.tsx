import { memo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { PremiumTable, PremiumTableRow } from '@/components/ui/PremiumTable';
import { TopMoversCard } from '@/components/TopMoversCard';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopMoversWidgetProps extends WidgetProps {
  trades: Trade[];
}

/**
 * M Widget (2×1) - Medium panel  
 * Per spec: padding 10-14px, max 3 items, ranked list
 */
export const TopMoversWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades,
}: TopMoversWidgetProps) => {
  const [period, setPeriod] = useState('24h');

  // Get top 3 movers
  const topMovers = trades
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Movers</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[80px] h-7 text-xs bg-muted/30 border-transparent hover:bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="7d">7d</SelectItem>
            <SelectItem value="30d">30d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PremiumTable density="compact" className="p-2">
        {topMovers.length > 0 ? (
          topMovers.map((trade, idx) => {
            const isProfit = trade.pnl >= 0;
            const changePercent = (trade.pnl / trade.entry_price) * 100;

            return (
              <PremiumTableRow
                key={`${trade.symbol}-${idx}`}
                density="compact"
                className="bg-muted/20 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${isProfit ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
                    }`}>
                    {isProfit ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{trade.symbol}</span>
                </div>
                <span className={`text-sm font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'
                  }`}>
                  {isProfit ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
              </PremiumTableRow>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            No trades yet
          </div>
        )}
      </PremiumTable>
    </div>
  );
});

TopMoversWidget.displayName = 'TopMoversWidget';
