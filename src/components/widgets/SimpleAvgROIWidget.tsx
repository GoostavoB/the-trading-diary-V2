import { memo } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface SimpleAvgROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  simpleAvgROI: number;
  totalTrades: number;
}

export const SimpleAvgROIWidget = memo(({
  id,
  isEditMode,
  onRemove,
  simpleAvgROI,
  totalTrades,
}: SimpleAvgROIWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = simpleAvgROI >= 0;

  return (

    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-sm">Simple Average ROI</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={Math.abs(simpleAvgROI)}
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
          Average return across {totalTrades} {totalTrades === 1 ? 'trade' : 'trades'}
        </p>
      </div>
    </div>
  );
});

SimpleAvgROIWidget.displayName = 'SimpleAvgROIWidget';
