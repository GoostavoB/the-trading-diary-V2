import { memo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { cn } from '@/lib/utils';

interface AvgPnLPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerTrade: number;
}

/**
 * Avg P&L Per Trade Widget - Compact responsive design
 */
export const AvgPnLPerTradeWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgPnLPerTrade,
}: AvgPnLPerTradeWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgPnLPerTrade >= 0;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {t('widgets.avgPnLPerTrade.title')}
        </span>
      </div>

      {/* Main Value */}
      <div className="flex-1 flex items-center gap-2 min-h-0">
        <BlurredCurrency 
          amount={Math.abs(avgPnLPerTrade)} 
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            isPositive ? 'text-neon-green' : 'text-neon-red'
          )}
        />
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-neon-green shrink-0" />
        ) : (
          <TrendingDown className="h-4 w-4 text-neon-red shrink-0" />
        )}
      </div>

      {/* Subtitle */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        Per trade average
      </span>
    </div>
  );
});

AvgPnLPerTradeWidget.displayName = 'AvgPnLPerTradeWidget';
