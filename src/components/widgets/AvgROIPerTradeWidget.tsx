import { memo } from 'react';
import { Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface AvgROIPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgROIPerTrade: number;
  totalTrades: number;
}

/**
 * Avg ROI Per Trade Widget - Compact responsive design
 */
export const AvgROIPerTradeWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgROIPerTrade,
  totalTrades,
}: AvgROIPerTradeWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgROIPerTrade >= 0;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Percent className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {t('widgets.avgROIPerTrade.title')}
        </span>
      </div>

      {/* Main Value */}
      <div className="flex-1 flex items-center gap-2 min-h-0">
        <AnimatedCounter
          value={Math.abs(avgROIPerTrade)}
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            isPositive ? 'text-neon-green' : 'text-neon-red'
          )}
          suffix="%"
          prefix={isPositive ? '+' : '-'}
        />
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-neon-green shrink-0" />
        ) : (
          <TrendingDown className="h-4 w-4 text-neon-red shrink-0" />
        )}
      </div>

      {/* Subtitle */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {t('widgets.avgROIAcross', { count: totalTrades })}
      </span>
    </div>
  );
});

AvgROIPerTradeWidget.displayName = 'AvgROIPerTradeWidget';
