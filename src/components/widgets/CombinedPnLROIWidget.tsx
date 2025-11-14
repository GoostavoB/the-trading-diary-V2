import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface CombinedPnLROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerTrade: number;
}

export const CombinedPnLROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgPnLPerTrade,
}: CombinedPnLROIWidgetProps) => {
  const { t } = useTranslation();
  const isPnLPositive = avgPnLPerTrade >= 0;

  return (
    <WidgetWrapper
      id={id}
      title={t('widgets.avgPnLPerTrade.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className={`text-3xl font-bold ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
            {isPnLPositive ? '' : '-'}
            <BlurredCurrency amount={Math.abs(avgPnLPerTrade)} className="inline" />
          </div>
          {isPnLPositive ? (
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

CombinedPnLROIWidget.displayName = 'CombinedPnLROIWidget';
