import { memo } from 'react';
import { formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface WeightedAvgROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  weightedAvgROI: number;
}

/**
 * S Widget (1×1) - Compact stat
 * Per spec: padding 8-10px, max 3 lines, typography 10-18px
 */
export const WeightedAvgROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  weightedAvgROI,
}: WeightedAvgROIWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = weightedAvgROI >= 0;

  return (
    <div className="p-2 h-full flex flex-col justify-center">
      {/* Top: Label (10-11px) */}
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        Weighted Avg ROI
      </div>

      {/* Middle: Main value (16-18px bold) */}
      <div className={`text-xl font-semibold mt-1 flex items-baseline gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
        {formatPercent(weightedAvgROI)}
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
      </div>

      {/* Bottom: Secondary text (10px) */}
      <div className="text-[10px] text-muted-foreground mt-0.5">
        Volume-weighted
      </div>
    </div>
  );
});

WeightedAvgROIWidget.displayName = 'WeightedAvgROIWidget';
