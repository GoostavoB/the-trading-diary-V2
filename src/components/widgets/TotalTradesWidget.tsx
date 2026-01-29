import { memo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface TotalTradesWidgetProps extends WidgetProps {
  totalTrades: number;
  trend?: number;
}

/**
 * Total Trades Widget - Compact responsive design
 */
export const TotalTradesWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  totalTrades,
  trend,
}: TotalTradesWidgetProps) => {
  const { t } = useTranslation();
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositiveTrend = (trend ?? 0) > 0;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {t('widgets.totalTrades.title')}
        </span>
      </div>

      {/* Main Value */}
      <div className="flex-1 flex items-center min-h-0">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
          <AnimatedCounter value={totalTrades} />
        </span>
      </div>

      {/* Trend indicator */}
      {hasTrend && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
            isPositiveTrend 
              ? "bg-neon-green/10 text-neon-green" 
              : "bg-neon-red/10 text-neon-red"
          )}>
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="tabular-nums">
              {isPositiveTrend ? '+' : ''}{trend}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {t('widgets.thisWeek')}
          </span>
        </div>
      )}
    </div>
  );
});

TotalTradesWidget.displayName = 'TotalTradesWidget';
