import { memo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopMoversWidgetProps extends WidgetProps {
  trades: Trade[];
}

/**
 * M Widget - Horizontal compact layout
 * Shows top 3 movers side-by-side for efficient space usage
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
      <div className="p-2 border-b border-border/50 flex items-center justify-between">
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

      <div className="p-2 flex items-center gap-2 overflow-x-auto">
        {topMovers.length > 0 ? (
          topMovers.map((trade, idx) => {
            const isProfit = trade.pnl >= 0;
            const changePercent = (trade.pnl / trade.entry_price) * 100;

            return (
              <div
                key={`${trade.symbol}-${idx}`}
                className="flex-1 min-w-[110px] p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors border border- border/30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm">{trade.symbol}</span>
                  <div className={`p-1 rounded ${isProfit ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'}`}>
                    {isProfit ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                  </div>
                </div>
                <div className={`text-lg font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                  {isProfit ? '+' : ''}{changePercent.toFixed(1)}%
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4 w-full">
            No trades yet
          </div>
        )}
      </div>
    </div>
  );
});

TopMoversWidget.displayName = 'TopMoversWidget';
