import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface AvgPnLPerDayWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerDay: number;
  tradingDays: number;
}

export const AvgPnLPerDayWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgPnLPerDay,
  tradingDays,
}: AvgPnLPerDayWidgetProps) => {
  const isPositive = avgPnLPerDay >= 0;

  return (
    <WidgetWrapper
      id={id}
      title="Avg P&L Per Day"
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(avgPnLPerDay)}
            className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}
            prefix={isPositive ? '$' : '-$'}
          />
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{tradingDays} trading days</span>
        </div>
      </div>
    </WidgetWrapper>
  );
});

AvgPnLPerDayWidget.displayName = 'AvgPnLPerDayWidget';
