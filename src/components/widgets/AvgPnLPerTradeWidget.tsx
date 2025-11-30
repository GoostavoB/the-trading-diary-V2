import { memo } from 'react';
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

/**
 * S Widget (1×1) - Compact stat
 * Per spec: padding 8-10px, max 3 lines, typography 10-18px
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

    <div className="p-2 h-full flex flex-col justify-center">
      {/* Top: Label (10-11px) */}
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {t('widgets.avgPnLPerTrade.title')}
      </div>

      {/* Middle: Main value (16-18px bold) */}
      <div className={`text-xl font-semibold mt-1 flex items-baseline gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
        {isPositive ? '' : '-'}
        <BlurredCurrency amount={Math.abs(avgPnLPerTrade)} className="inline" />
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
      </div>

      {/* Bottom: Secondary text (10px) */}
      <div className="text-[10px] text-muted-foreground mt-0.5">
        Per trade average
      </div>
    </div>
  );
});

AvgPnLPerTradeWidget.displayName = 'AvgPnLPerTradeWidget';
