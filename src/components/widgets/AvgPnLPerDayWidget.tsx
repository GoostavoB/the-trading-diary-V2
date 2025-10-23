import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

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
  const { t } = useTranslation();
  const isPositive = avgPnLPerDay >= 0;

  return (
    <WidgetWrapper
      id={id}
      title={t('widgets.avgPnLPerDay.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className={`text-3xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? '' : '-'}
            <BlurredCurrency amount={Math.abs(avgPnLPerDay)} className="inline" />
          </div>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-profit" />
          ) : (
            <TrendingDown className="h-5 w-5 text-loss" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{tradingDays} {t('widgets.tradingDays')}</span>
        </div>
      </div>
    </WidgetWrapper>
  );
});

AvgPnLPerDayWidget.displayName = 'AvgPnLPerDayWidget';
