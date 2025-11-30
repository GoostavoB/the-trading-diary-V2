import { memo } from 'react';
import { Target } from 'lucide-react';
import { formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';

interface WinRateWidgetProps extends WidgetProps {
  winRate: number;
  wins: number;
  losses: number;
  totalTrades: number;
}

/**
 * S Widget (1×1) - Compact stat
 * Per spec: padding 8-10px, max 3 lines, typography 10-18px
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

  return (
    <div className="flex items-center justify-between h-full p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Win Rate
          </span>
        </div>

        <div>
          <div className="text-3xl font-bold gradient-text tracking-tight">
            {formatPercent(winRate)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
              {wins}W
            </span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20">
              {losses}L
            </span>
          </div>
        </div>
      </div>

      {/* Circular Progress Premium */}
      <div className="relative h-16 w-16 flex items-center justify-center">
        <svg className="h-full w-full -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
          {/* Background Circle */}
          <path
            className="text-muted/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          {/* Progress Circle */}
          <path
            className={winRate >= 50 ? "text-neon-green drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "text-neon-red drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]"}
            strokeDasharray={`${winRate}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`h-12 w-12 rounded-full blur-xl opacity-20 ${winRate >= 50 ? 'bg-neon-green' : 'bg-neon-red'}`} />
        </div>
      </div>
    </div>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
