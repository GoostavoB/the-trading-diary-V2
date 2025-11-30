import { memo } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AvgROIPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgROIPerTrade: number;
  totalTrades: number;
}

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

    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-sm">{t('widgets.avgROIPerTrade.title')}</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(avgROIPerTrade)}
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
        <p className="text-sm text-muted-foreground">
          {t('widgets.avgROIAcross', { count: totalTrades })}
        </p>
      </div>
    </div>
  );
});

AvgROIPerTradeWidget.displayName = 'AvgROIPerTradeWidget';
