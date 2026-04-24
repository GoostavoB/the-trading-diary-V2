import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface CompactKPIRowProps {
  totalPnL: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  className?: string;
}

// ────────────────────────────────────────────────────────────
// A) TOTAL P&L — Apple Premium oscilloscope
// ────────────────────────────────────────────────────────────
const PnLScope = memo(({ value }: { value: number }) => {
  const isProfit = value >= 0;
  const isFlat = value === 0;

  const points = useMemo(() => {
    const n = 40;
    const seed = Math.abs(value) % 997 || 13;
    const amp = isFlat ? 0.08 : 0.55;
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 100;
      const t = (i + seed % 7) * 0.45;
      const y =
        50 +
        Math.sin(t) * 14 * amp +
        Math.sin(t * 2.3 + seed) * 6 * amp +
        Math.sin(t * 0.7) * 3 * amp;
      pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }, [value, isFlat]);

  const areaPoints = `0,100 ${points} 100,100`;
  const stroke = isProfit ? 'hsl(var(--electric-blue))' : 'hsl(var(--apple-red))';
  const area = isProfit ? 'hsl(var(--electric-blue) / 0.18)' : 'hsl(var(--apple-red) / 0.18)';

  const abs = Math.abs(value);
  const formatted = abs >= 1000
    ? `${(abs / 1000).toFixed(2)}K`
    : abs.toFixed(2);

  return (
    <div className="card-premium rounded-ios-card flex flex-col gap-1.5 overflow-hidden min-w-[180px] flex-1">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-medium text-space-300">Total P&amp;L</span>
        <span className={cn('pulse-dot', isProfit ? '' : 'danger')} />
      </div>

      <div className="px-3">
        <div className={cn(
          'font-display font-semibold text-2xl leading-none tabular-nums font-num',
          isProfit ? 'text-space-100' : 'text-apple-red'
        )}>
          {isProfit ? '+' : '-'}${formatted}
        </div>
      </div>

      <div className="relative h-10 mx-2 mb-2 rounded-ios border border-space-500/70 bg-space-800/40 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <polygon points={areaPoints} fill={area} />
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
});
PnLScope.displayName = 'PnLScope';

// ────────────────────────────────────────────────────────────
// B) WIN RATE — Apple Premium bar
// ────────────────────────────────────────────────────────────
const WinRateBar = memo(({ value }: { value: number }) => {
  const tier =
    value >= 55 ? { label: 'Strong', chip: 'chip-green', bar: 'bg-apple-green', text: 'text-space-100' } :
    value >= 45 ? { label: 'Solid',  chip: 'chip-electric', bar: 'bg-electric', text: 'text-space-100' } :
    value >= 35 ? { label: 'Weak',   chip: 'chip-orange', bar: 'bg-apple-orange', text: 'text-space-100' } :
    { label: 'Poor', chip: 'chip-red', bar: 'bg-apple-red', text: 'text-apple-red' };

  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="card-premium rounded-ios-card flex flex-col gap-1 overflow-hidden min-w-[170px] flex-1">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-medium text-space-300">Win rate</span>
        <span className={cn(tier.chip, 'text-[10px]')}>{tier.label}</span>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className={cn('font-display font-semibold text-2xl leading-none tabular-nums font-num', tier.text)}>
          {value.toFixed(1)}
          <span className="text-space-400 text-xl">%</span>
        </div>
        <div className="h-2 bg-space-600 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', tier.bar)}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
});
WinRateBar.displayName = 'WinRateBar';

// ────────────────────────────────────────────────────────────
// C) ROI — Apple Premium gauge ring
// ────────────────────────────────────────────────────────────
const RoiGauge = memo(({ value }: { value: number }) => {
  const isPositive = value >= 0;
  const size = 64;
  const cx = size / 2;
  const cy = size / 2;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const totalArc = circ * arcFraction;
  const pct = Math.min(100, Math.abs(value)) / 100;
  const filled = totalArc * pct;
  const gap = circ - totalArc;

  const stroke = isPositive ? 'hsl(var(--electric-blue))' : 'hsl(var(--apple-red))';

  return (
    <div className="card-premium rounded-ios-card flex items-center gap-2 overflow-hidden min-w-[150px] flex-1">
      <div className="flex flex-col justify-between p-3 h-full w-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-space-300">ROI</span>
          <span className={cn('pulse-dot', isPositive ? '' : 'danger')} style={{ width: 6, height: 6 }} />
        </div>

        <div className="flex items-center justify-center mt-1">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="hsl(var(--space-gray-600))"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${totalArc} ${gap}`}
              />
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circ - filled}`}
                style={{
                  transition: 'stroke-dasharray 0.8s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'font-display font-semibold text-sm tabular-nums leading-none font-num',
                isPositive ? 'text-space-100' : 'text-apple-red'
              )}>
                {isPositive ? '+' : '-'}{Math.abs(value).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
RoiGauge.displayName = 'RoiGauge';

// ────────────────────────────────────────────────────────────
// D) TOTAL TRADES — Apple Premium dot-matrix
// ────────────────────────────────────────────────────────────
const TradeMatrix = memo(({ total }: { total: number }) => {
  const cap = 60;
  const visible = Math.min(total, cap);
  const seed = total % 7;

  return (
    <div className="card-premium rounded-ios-card flex flex-col gap-1 overflow-hidden min-w-[140px] flex-1">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-medium text-space-300">Trades</span>
      </div>
      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="font-display font-semibold text-2xl leading-none text-space-100 tabular-nums font-num">
          {total}
        </div>
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0,1fr))' }}>
          {Array.from({ length: cap }).map((_, i) => {
            const active = i < visible;
            const isWin = active && ((i * 13 + seed) % 3 !== 0);
            return (
              <div
                key={i}
                className={cn(
                  'w-[6px] h-[6px] rounded-sm',
                  !active ? 'bg-space-600/40' :
                  isWin ? 'bg-apple-green/50' : 'bg-apple-red/50'
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
TradeMatrix.displayName = 'TradeMatrix';

// ────────────────────────────────────────────────────────────
// E) STREAK — Apple Premium flame / counter
// ────────────────────────────────────────────────────────────
const StreakHud = memo(({ streak }: { streak: { type: 'win' | 'loss'; count: number } }) => {
  const hot = streak.type === 'win' && streak.count >= 4;
  const cold = streak.type === 'loss' && streak.count >= 3;

  const chipClass = hot ? 'chip-green' : cold ? 'chip-red' : streak.type === 'win' ? 'chip-electric' : 'chip';
  const chipLabel = hot ? 'Hot streak' : cold ? 'Cold streak' : streak.type === 'win' ? 'Winning' : 'Losing';
  const numberCls =
    hot ? 'text-apple-green'
    : cold ? 'text-apple-red'
    : streak.type === 'win' ? 'text-space-100'
    : 'text-space-300';
  const flameCls = hot ? 'text-apple-green' : cold ? 'text-apple-red' : 'text-space-400';

  const dots = 10;
  const filled = Math.min(streak.count, dots);

  return (
    <div className="card-premium rounded-ios-card flex flex-col gap-1 overflow-hidden min-w-[150px] flex-1">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-space-300">
          <Flame className={cn('w-3.5 h-3.5', flameCls)} />
          Streak
        </span>
        <span className={cn(chipClass, 'text-[10px]')}>{chipLabel}</span>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="flex items-end gap-1">
          <div className={cn('font-display font-semibold text-2xl leading-none tabular-nums font-num', numberCls)}>
            {streak.count}
          </div>
          <div className={cn('text-sm font-medium mb-[2px]', numberCls)}>
            {streak.type === 'win' ? 'W' : 'L'}
          </div>
        </div>

        <div className="flex gap-[3px]">
          {Array.from({ length: dots }).map((_, i) => {
            const active = i < filled;
            return (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all',
                  !active ? 'bg-space-600/60' :
                  hot ? 'bg-apple-green' :
                  cold ? 'bg-apple-red' :
                  streak.type === 'win' ? 'bg-electric' : 'bg-space-400'
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
StreakHud.displayName = 'StreakHud';

// ────────────────────────────────────────────────────────────
export const CompactKPIRow = memo(({
  totalPnL,
  roi,
  winRate,
  totalTrades,
  currentStreak,
  className,
}: CompactKPIRowProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-wrap items-stretch gap-2',
        className
      )}
    >
      <PnLScope value={totalPnL} />
      <WinRateBar value={winRate} />
      <RoiGauge value={roi} />
      <TradeMatrix total={totalTrades} />
      <StreakHud streak={currentStreak} />
    </div>
  );
});

CompactKPIRow.displayName = 'CompactKPIRow';
