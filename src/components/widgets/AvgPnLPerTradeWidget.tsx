import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AvgPnLPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerTrade: number;
}

export const AvgPnLPerTradeWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgPnLPerTrade,
}: AvgPnLPerTradeWidgetProps) => {
  const isPositive = avgPnLPerTrade >= 0;

  return (
    <WidgetWrapper
      id={id}
      title="Avg P&L Per Trade"
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(avgPnLPerTrade)}
            className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}
            prefix={isPositive ? '$' : '-$'}
          />
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Average profit/loss per executed trade
        </p>
      </div>
    </WidgetWrapper>
  );
});

AvgPnLPerTradeWidget.displayName = 'AvgPnLPerTradeWidget';
