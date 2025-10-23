import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

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
  const { t } = useTranslation();
  const isPositive = avgPnLPerTrade >= 0;

  return (
    <WidgetWrapper
      id={id}
      title={t('widgets.avgPnLPerTrade.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? '' : '-'}
            <BlurredCurrency amount={Math.abs(avgPnLPerTrade)} className="inline" />
          </div>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('widgets.avgPnLDescription')}
        </p>
      </div>
    </WidgetWrapper>
  );
});

AvgPnLPerTradeWidget.displayName = 'AvgPnLPerTradeWidget';
