import { memo } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface WinRateWidgetProps extends WidgetProps {
  winRate: number;
  wins: number;
  losses: number;
  totalTrades: number;
}

function getWinRateTier(rate: number) {
  if (rate >= 70) return { label: 'Elite', color: 'text-emerald-300', track: 'stroke-emerald-400', glow: 'drop-shadow-[0_0_8px_rgb(52,211,153)]' };
  if (rate >= 60) return { label: 'Strong', color: 'text-lime-300', track: 'stroke-lime-400', glow: '' };
  if (rate >= 50) return { label: 'Positive', color: 'text-amber-300', track: 'stroke-amber-400', glow: '' };
  if (rate >= 40) return { label: 'Developing', color: 'text-orange-300', track: 'stroke-orange-400', glow: '' };
  return { label: 'Needs work', color: 'text-rose-300', track: 'stroke-rose-400', glow: '' };
}

export const WinRateWidget = memo(({
  winRate,
  wins,
  losses,
  totalTrades,
}: WinRateWidgetProps) => {
  const { t } = useTranslation();
  const tier = getWinRateTier(winRate);

  // Arc: 270° sweep (¾ circle), starts at -225° (bottom-left)
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.75; // 270°
  const totalArc = circ * arcFraction;
  const filled = totalArc * (winRate / 100);
  const gap = circ - totalArc;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Label */}
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
        {t('widgets.winRate.title', 'Win Rate')}
      </div>

      {/* Arc + Number */}
      <div className="flex items-center gap-3">
        {/* Custom arc gauge */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size} height={size}
            style={{ transform: 'rotate(135deg)' }}
          >
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${totalArc} ${gap}`}
            />
            {/* Fill */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              className={tier.track}
              strokeOpacity={0.75}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ - filled}`}
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
          </svg>
          {/* Center: percent */}
          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-1">
            <span className={cn("text-lg font-black tabular-nums leading-none", tier.color)}>
              {winRate.toFixed(0)}%
            </span>
            <span className="text-[8px] text-muted-foreground/40 mt-0.5">{totalTrades} trades</span>
          </div>
        </div>

        {/* Stats column */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Tier badge */}
          <span className={cn(
            "inline-flex text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded",
            "border bg-white/[0.04]",
            tier.color,
            tier.color.replace('text-', 'border-').replace('-300', '-400/20')
          )}>
            {tier.label}
          </span>

          {/* W / L split */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-1 flex-1 rounded-full overflow-hidden bg-white/5">
                <div
                  className="h-full bg-emerald-400/60 rounded-full transition-all duration-700"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-emerald-400/70 font-semibold">{wins}W</span>
              <span className="text-rose-400/70 font-semibold">{losses}L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
