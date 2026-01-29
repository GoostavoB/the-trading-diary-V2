import { memo } from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { cn } from '@/lib/utils';

interface AvgPnLPerDayWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerDay: number;
}

/**
 * Avg P&L Per Day Widget - Compact responsive design
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
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Calendar className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Avg P&L / Day
        </span>
      </div>

      {/* Main Value */}
      <div className="flex-1 flex items-center gap-2 min-h-0">
        <BlurredCurrency 
          amount={Math.abs(avgPnLPerDay)} 
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            isPositive ? 'text-neon-green' : 'text-neon-red'
          )}
        />
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-neon-green shrink-0" />
        ) : (
          <TrendingDown className="h-4 w-4 text-neon-red shrink-0" />
        )}
      </div>

      {/* Subtitle */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        Daily average
      </span>
    </div>
  );
});

AvgPnLPerDayWidget.displayName = 'AvgPnLPerDayWidget';
