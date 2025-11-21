import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/utils/formatNumber';

interface WeightedAvgROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  weightedAvgROI: number;
  totalTrades: number;
  totalCapitalInvested: number;
}

export const WeightedAvgROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  weightedAvgROI,
  totalTrades,
  totalCapitalInvested,
}: WeightedAvgROIWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = weightedAvgROI >= 0;

  return (
    <WidgetWrapper
      id={id}
      title="Weighted Average ROI"
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(weightedAvgROI)}
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
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{totalTrades} {totalTrades === 1 ? 'trade' : 'trades'}</p>
          <p className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(totalCapitalInvested)} capital allocated
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
});

WeightedAvgROIWidget.displayName = 'WeightedAvgROIWidget';
