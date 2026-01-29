import { memo } from 'react';
import { Target } from 'lucide-react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface WinRateWidgetProps extends WidgetProps {
  winRate: number;
  wins: number;
  losses: number;
  totalTrades: number;
}

/**
 * Win Rate Widget - Compact responsive design with circular indicator
 */
export const WinRateWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  winRate,
  wins,
  losses,
  totalTrades,
}: WinRateWidgetProps) => {
  const { t } = useTranslation();
  const isGoodWinRate = winRate >= 50;
  
  // Calculate the stroke offset for the circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Target className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {t('widgets.winRate.title')}
        </span>
      </div>

      {/* Main Content - Circular Chart + Value */}
      <div className="flex items-center justify-between gap-3 flex-1 min-h-0">
        {/* Win Rate Value */}
        <div className="flex flex-col gap-0.5">
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            isGoodWinRate ? "text-neon-green" : "text-neon-red"
          )}>
            {winRate.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-neon-green/15 text-neon-green font-semibold">
              {wins}W
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neon-red/15 text-neon-red font-semibold">
              {losses}L
            </span>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative h-14 w-14 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              className="text-muted/20"
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              className={isGoodWinRate ? "text-neon-green" : "text-neon-red"}
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground">
              {totalTrades}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
