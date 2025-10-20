import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CurrentROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  currentROI: number;
  initialInvestment: number;
  currentBalance: number;
}

export const CurrentROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  currentROI,
  initialInvestment,
  currentBalance,
}: CurrentROIWidgetProps) => {
  const isPositive = currentROI >= 0;

  return (
    <WidgetWrapper
      id={id}
      title="Current ROI"
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(currentROI)}
            className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}
            suffix="%"
            prefix={isPositive ? '' : '-'}
          />
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Initial:</span>
            <span className="font-medium">{formatCurrency(initialInvestment)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Current:</span>
            <span className="font-medium">{formatCurrency(currentBalance)}</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
});

CurrentROIWidget.displayName = 'CurrentROIWidget';
