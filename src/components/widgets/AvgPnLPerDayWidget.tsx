import { memo } from 'react';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface AvgPnLPerDayWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerDay: number;
}

/**
 * S Widget (1×1) - Compact stat
 * Per spec: padding 8-10px, max 3 lines, typography 10-18px
 */
export const AvgPnLPerDayWidget = memo(({
  id,
  isEditMode,
  onRemove,
  avgPnLPerDay,
}: AvgPnLPerDayWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgPnLPerDay >= 0;

  return (

    <div className="p-2 h-full flex flex-col justify-center">
      {/* Top: Label (10-11px) */}
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        Avg P&L / Day
      </div>

      {/* Middle: Main value (16-18px bold) */}
      <div className={`text-xl font-semibold mt-1 flex items-baseline gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
        {isPositive ? '' : '-'}
        <BlurredCurrency amount={Math.abs(avgPnLPerDay)} className="inline" />
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
      </div>

      {/* Bottom: Secondary text (10px) */}
      <div className="text-[10px] text-muted-foreground mt-0.5">
        Daily average
      </div>
    </div>
  );
});

AvgPnLPerDayWidget.displayName = 'AvgPnLPerDayWidget';
