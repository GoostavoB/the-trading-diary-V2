import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CompactKPIRowProps {
  totalPnL: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  className?: string;
}

// ────────────────────────────────────────────────────────────
// A) TOTAL P&L — oscilloscope / live scope readout
// ────────────────────────────────────────────────────────────
const PnLScope = memo(({ value }: { value: number }) => {
  const isProfit = value >= 0;
  const isFlat = value === 0;

  // Deterministic "live waveform" based on value magnitude
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

  const abs = Math.abs(value);
  const formatted = abs >= 1000
    ? `${(abs / 1000).toFixed(2)}K`
    : abs.toFixed(2);

  return (
    <div className="hud-panel hud-corners relative flex flex-col gap-1.5 p-0 overflow-hidden min-w-[180px] flex-1">
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />

      {/* terminal header */}
      <div className="term-header" style={{ padding: '0.25rem 0.5rem' }}>
        <span className="tracking-widest">P_L.LIVE // USD</span>
        <span className={cn('pulse-dot ml-auto', isProfit ? '' : 'danger')} />
      </div>

      <div className="px-3 pt-1 pb-0.5">
        <div
          className={cn(
            'font-display text-2xl leading-none chromatic tabular-nums',
            isProfit ? 'glow-text' : 'glow-text-danger'
          )}
        >
          {isProfit ? '+' : '-'}${formatted}
        </div>
      </div>

      {/* oscilloscope */}
      <div className="relative h-10 mx-2 mb-1 border-t border-b border-phosphor-dim overflow-hidden bg-void">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* mid-line */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--phosphor) / 0.2)" strokeWidth="0.3" strokeDasharray="1 1.5" />
          <polyline
            points={points}
            fill="none"
            stroke={isProfit ? 'hsl(var(--phosphor))' : 'hsl(var(--danger))'}
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 2px ${isProfit ? 'hsl(var(--phosphor))' : 'hsl(var(--danger))'})` }}
          />
        </svg>
        <div className="scan-bar" />
      </div>
    </div>
  );
});
PnLScope.displayName = 'PnLScope';

// ────────────────────────────────────────────────────────────
// B) WIN RATE — ASCII progress bar
// ────────────────────────────────────────────────────────────
const WinRateBar = memo(({ value }: { value: number }) => {
  const cells = 20;
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * cells);

  const tier =
    value >= 55 ? { label: 'ELITE', cls: '' } :
    value >= 45 ? { label: 'OK', cls: 'amber' } :
    { label: 'POOR', cls: 'danger' };

  const colorText =
    value >= 55 ? 'text-phosphor glow-text' :
    value >= 45 ? 'text-amber-term glow-text-amber' :
    'text-danger';

  return (
    <div className="hud-panel hud-corners relative flex flex-col gap-1 p-0 min-w-[170px] flex-1">
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />
      <div className="term-header" style={{ padding: '0.25rem 0.5rem' }}>
        <span className="tracking-widest">WIN_RATE.PCT</span>
        <span className={cn('status-pill ml-auto', tier.cls)} style={{ fontSize: '0.6rem', padding: '0 0.35rem' }}>
          {tier.label}
        </span>
      </div>

      <div className="px-3 py-2 flex flex-col gap-1">
        <div className={cn('font-display text-2xl leading-none tabular-nums', colorText)}>
          {value.toFixed(1)}<span className="text-phosphor-dim">%</span>
        </div>
        {/* ASCII-esque bar */}
        <div className="flex gap-[2px] mt-1" aria-hidden>
          {Array.from({ length: cells }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1',
                i < filled
                  ? value >= 55 ? 'bg-phosphor' : value >= 45 ? 'bg-amber-term' : 'bg-danger'
                  : 'bg-phosphor-dim opacity-40'
              )}
              style={
                i < filled
                  ? { boxShadow: '0 0 4px currentColor' }
                  : undefined
              }
            />
          ))}
        </div>
        <div className="text-[9px] text-phosphor-dim tracking-widest mt-0.5">
          [{'█'.repeat(filled)}{'░'.repeat(cells - filled)}]
        </div>
      </div>
    </div>
  );
});
WinRateBar.displayName = 'WinRateBar';

// ────────────────────────────────────────────────────────────
// D) ROI — 270° gauge ring
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

  const stroke = isPositive ? 'hsl(var(--phosphor))' : 'hsl(var(--danger))';

  return (
    <div className="hud-panel hud-corners relative flex items-center gap-2 p-0 min-w-[150px] flex-1">
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />

      <div className="flex flex-col justify-between p-2 h-full w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] tracking-widest text-phosphor-dim">ROI.PCT</span>
          <span className={cn('pulse-dot ml-auto', isPositive ? '' : 'danger')} style={{ width: 5, height: 5 }} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="hsl(var(--phosphor) / 0.15)"
                strokeWidth={4}
                strokeDasharray={`${totalArc} ${gap}`}
              />
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={4}
                strokeLinecap="butt"
                strokeDasharray={`${filled} ${circ - filled}`}
                style={{
                  transition: 'stroke-dasharray 0.8s ease-out',
                  filter: `drop-shadow(0 0 4px ${stroke})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'font-display text-sm chromatic tabular-nums leading-none',
                isPositive ? 'text-phosphor glow-text' : 'text-danger glow-text-danger'
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
// E) TOTAL TRADES — dot-matrix
// ────────────────────────────────────────────────────────────
const TradeMatrix = memo(({ total }: { total: number }) => {
  // Visualize up to 60 dots for the chip; fill pattern reflects magnitude
  const cap = 60;
  const visible = Math.min(total, cap);
  // Seeded "wins" pattern for vibe (real W/L would need wins prop — kept compact)
  const seed = total % 7;

  return (
    <div className="hud-panel hud-corners relative flex flex-col gap-1 p-0 min-w-[140px] flex-1">
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />
      <div className="term-header" style={{ padding: '0.25rem 0.5rem' }}>
        <span className="tracking-widest">TRADES.N</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        <div className="font-display text-2xl leading-none text-phosphor glow-text tabular-nums">
          {total.toString().padStart(3, '0')}
        </div>
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0,1fr))' }}>
          {Array.from({ length: cap }).map((_, i) => {
            const active = i < visible;
            const isWin = active && ((i * 13 + seed) % 3 !== 0);
            return (
              <div
                key={i}
                className={cn(
                  'w-[6px] h-[6px]',
                  !active ? 'bg-phosphor-dim opacity-30' :
                  isWin ? 'bg-phosphor' : 'bg-danger'
                )}
                style={active ? { boxShadow: '0 0 3px currentColor' } : undefined}
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
// F) STREAK — flame / counter HUD
// ────────────────────────────────────────────────────────────
const StreakHud = memo(({ streak }: { streak: { type: 'win' | 'loss'; count: number } }) => {
  const hot = streak.type === 'win' && streak.count >= 4;
  const cold = streak.type === 'loss' && streak.count >= 3;

  const panelCls = hot ? 'hud-panel-amber' : cold ? 'hud-panel-danger' : 'hud-panel';
  const pillCls = hot ? 'amber' : cold ? 'danger' : '';
  const pillLabel = hot ? 'HOT' : cold ? 'COLD' : 'NEUTRAL';
  const numberCls = hot ? 'text-amber-term glow-text-amber'
    : cold ? 'text-danger glow-text-danger'
    : streak.type === 'win' ? 'text-phosphor glow-text'
    : 'text-phosphor-dim';

  const dots = 10;
  const filled = Math.min(streak.count, dots);

  return (
    <div className={cn(panelCls, 'hud-corners relative flex flex-col gap-1 p-0 min-w-[140px] flex-1')}>
      <span className="hud-c tl" />
      <span className="hud-c tr" />
      <span className="hud-c bl" />
      <span className="hud-c br" />

      <div className="flex items-center justify-between px-2 pt-1.5">
        <span className="text-[9px] tracking-widest text-phosphor-dim">STREAK</span>
        <span className={cn('status-pill', pillCls)} style={{ fontSize: '0.58rem', padding: '0 0.35rem' }}>
          {pillLabel}
        </span>
      </div>

      <div className="px-3 pb-2 flex items-end gap-1">
        <div className={cn('font-display text-3xl leading-none tabular-nums chromatic', numberCls)}>
          {streak.count}
        </div>
        <div className={cn('text-sm font-display mb-[2px]', numberCls)}>
          {streak.type === 'win' ? 'W' : 'L'}
        </div>
      </div>

      <div className="flex gap-[3px] px-3 pb-2">
        {Array.from({ length: dots }).map((_, i) => {
          const active = i < filled;
          const isLast = i === filled - 1;
          return (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1',
                !active ? 'bg-phosphor-dim opacity-30' :
                hot ? 'bg-amber-term' :
                cold ? 'bg-danger' :
                streak.type === 'win' ? 'bg-phosphor' : 'bg-phosphor-dim',
                isLast && active ? 'animate-pulse-glow' : ''
              )}
              style={active ? { boxShadow: '0 0 4px currentColor' } : undefined}
            />
          );
        })}
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
        'scanlines relative flex flex-wrap items-stretch gap-2 p-2 bg-void border border-phosphor-dim',
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
