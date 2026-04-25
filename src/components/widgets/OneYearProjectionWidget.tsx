import { memo, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Calculator, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OneYearProjectionWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  currentBalance: number;
  totalPnL: number;
  tradingDays: number;
  totalTrades: number;
  winRate: number;              // 0-100
  profitFactor: number;
  avgWin: number;               // absolute $ (historical avg)
  avgLoss: number;              // absolute $ (historical avg)
}

type Horizon = {
  label: string;
  shortLabel: string;
  tradingDays: number;
};

const HORIZONS: Horizon[] = [
  { label: '7 days',   shortLabel: '7d',  tradingDays: 5 },
  { label: '14 days',  shortLabel: '14d', tradingDays: 10 },
  { label: '30 days',  shortLabel: '30d', tradingDays: 21 },
  { label: '3 months', shortLabel: '3m',  tradingDays: 63 },
  { label: '6 months', shortLabel: '6m',  tradingDays: 126 },
  { label: '1 year',   shortLabel: '1y',  tradingDays: 252 },
  { label: '2 years',  shortLabel: '2y',  tradingDays: 504 },
  { label: '3 years',  shortLabel: '3y',  tradingDays: 756 },
  { label: '5 years',  shortLabel: '5y',  tradingDays: 1260 },
];

type Mode = 'compound' | 'linear';

// ── Realism caps ──
// With small samples (23 trades), the observed per-trade edge grossly
// overstates long-run reality. Without a cap, $500 → $7.95B in 1y appears.
// We cap the per-trade growth factor and the total multiplier so the chart
// stays in a useful envelope. The user is told when the cap kicks in.
const PER_TRADE_GROWTH_MAX = 1.02;       // +2% per trade ceiling (already aggressive)
const PER_TRADE_GROWTH_MIN = 0.95;       // -5% per trade floor
const TOTAL_MULTIPLIER_MAX = 50;         // cap final balance at 50× starting capital
const TOTAL_MULTIPLIER_MIN = 0.05;       // and at 5% (95% drawdown) on the down side

const clampPerTrade = (g: number) =>
  Math.max(PER_TRADE_GROWTH_MIN, Math.min(PER_TRADE_GROWTH_MAX, g));

const clampMultiple = (m: number) => {
  if (!isFinite(m) || isNaN(m)) return TOTAL_MULTIPLIER_MAX;
  return Math.max(TOTAL_MULTIPLIER_MIN, Math.min(TOTAL_MULTIPLIER_MAX, m));
};

/**
 * Projection Widget — Interactive
 *
 * Slider lets the user sweep horizons from 7d → 5y and the curve + hero balance
 * update live. Two calculation models:
 *
 *   COMPOUND — position size scales with capital (risk % fixed). This is the
 *   "trabalho de formiga" Gustavo described: stops grow as capital grows, so
 *   gains accelerate. Growth is geometric.
 *     riskPct = avgLoss / currentCapital
 *     rewardPct = avgWin / currentCapital
 *     growthFactor = (winRate × (1 + rewardPct)) + ((1-winRate) × (1 - riskPct))
 *     capital_after_N = currentCapital × growthFactor^N
 *
 *   LINEAR — position size stays constant (fixed $ per trade). Growth is linear.
 *     EV = (winRate × avgWin) − ((1-winRate) × avgLoss)
 *     capital_after_N = currentCapital + EV × N
 *
 * Milestones ($1K / $10K / $50K / $100K / $500K / $1M) render as horizontal
 * reference lines on the chart.
 */
export const OneYearProjectionWidget = memo(({
  currentBalance,
  tradingDays,
  totalTrades,
  winRate,
  avgWin,
  avgLoss,
}: OneYearProjectionWidgetProps) => {
  const [sliderIdx, setSliderIdx] = useState(5); // default = 1y
  const [mode, setMode] = useState<Mode>('compound');

  const horizon = HORIZONS[sliderIdx];
  const hasNoData = totalTrades === 0 || tradingDays === 0 || currentBalance <= 0;

  // ── Core math ──
  const model = useMemo(() => {
    const tradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
    const wrFrac = Math.max(0, Math.min(1, winRate / 100));
    const lossFrac = 1 - wrFrac;

    // Linear EV
    const evPerTrade = (wrFrac * avgWin) - (lossFrac * avgLoss);

    // Compound: derive risk % from avgLoss vs currentCapital
    const rewardPct = currentBalance > 0 ? avgWin / currentBalance : 0;
    const riskPct = currentBalance > 0 ? avgLoss / currentBalance : 0;
    const rawGrowthFactor = wrFrac * (1 + rewardPct) + lossFrac * (1 - riskPct);
    const growthFactor = clampPerTrade(rawGrowthFactor);
    const wasCapped = rawGrowthFactor !== growthFactor;

    return { tradesPerDay, wrFrac, lossFrac, evPerTrade, rewardPct, riskPct, growthFactor, rawGrowthFactor, wasCapped };
  }, [tradingDays, totalTrades, winRate, avgWin, avgLoss, currentBalance]);

  // ── Horizon-specific result ──
  const result = useMemo(() => {
    const days = horizon.tradingDays;
    const trades = model.tradesPerDay * days;
    let projectedBalance: number;
    let capped = model.wasCapped;

    if (mode === 'compound') {
      const rawMultiple = Math.pow(model.growthFactor, trades);
      const safeMultiple = clampMultiple(rawMultiple);
      if (safeMultiple !== rawMultiple) capped = true;
      projectedBalance = currentBalance * safeMultiple;
    } else {
      projectedBalance = currentBalance + (model.evPerTrade * trades);
      // Clamp linear too — at most 50× starting balance
      const linearMax = currentBalance * TOTAL_MULTIPLIER_MAX;
      const linearMin = currentBalance * TOTAL_MULTIPLIER_MIN;
      if (projectedBalance > linearMax) { projectedBalance = linearMax; capped = true; }
      if (projectedBalance < linearMin) { projectedBalance = linearMin; capped = true; }
    }
    const projectedPnL = projectedBalance - currentBalance;
    const growthPct = currentBalance > 0 ? (projectedPnL / currentBalance) * 100 : 0;

    return { trades: Math.round(trades), projectedBalance, projectedPnL, growthPct, capped };
  }, [horizon, mode, model, currentBalance]);

  // ── Curve points across the selected horizon ──
  const curve = useMemo(() => {
    if (hasNoData) return { points: [] as { x: number; y: number }[], path: '', area: '', yMin: 0, yMax: 0, W: 100, H: 64 };

    const days = horizon.tradingDays;
    // Sample once per trading day for performance
    const samples = Math.min(days, 300);
    const step = days / samples;
    const pts: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i++) {
      const d = i * step;
      const trades = model.tradesPerDay * d;
      let y: number;
      if (mode === 'compound') {
        const rawMultiple = Math.pow(model.growthFactor, trades);
        y = currentBalance * clampMultiple(rawMultiple);
      } else {
        y = currentBalance + (model.evPerTrade * trades);
        const linearMax = currentBalance * TOTAL_MULTIPLIER_MAX;
        const linearMin = currentBalance * TOTAL_MULTIPLIER_MIN;
        y = Math.max(linearMin, Math.min(linearMax, y));
      }
      pts.push({ x: i / samples, y });
    }

    const ys = pts.map(p => p.y);
    // Include currentBalance in yRange so the start point is honest
    const yMin = Math.min(currentBalance, ...ys);
    const yMax = Math.max(currentBalance, ...ys);
    const yRange = (yMax - yMin) || 1;
    const W = 100;
    const H = 64;
    const path = pts.map((p, i) => {
      const x = p.x * W;
      const y = H - ((p.y - yMin) / yRange) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(3)} ${y.toFixed(3)}`;
    }).join(' ');
    const area = `${path} L${W} ${H} L0 ${H} Z`;

    return { points: pts, path, area, yMin, yMax, W, H };
  }, [horizon, mode, model, currentBalance, hasNoData]);

  // ── Milestones inside yRange ──
  const milestones = useMemo(() => {
    const targets = [1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000];
    return targets
      .filter(t => t > curve.yMin && t < curve.yMax)
      .map(t => {
        const y = curve.H - ((t - curve.yMin) / ((curve.yMax - curve.yMin) || 1)) * curve.H;
        // When will it be crossed?
        const crossedAt = curve.points.find(p => p.y >= t);
        const crossedXPct = crossedAt ? crossedAt.x * 100 : null;
        return { target: t, y, crossedXPct };
      });
  }, [curve]);

  // ── Format ──
  const formatCurrency = (n: number, compact = true) => {
    const abs = Math.abs(n);
    if (compact) {
      if (abs >= 1_000_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000_000).toFixed(2)}B`;
      if (abs >= 1_000_000)     return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
      if (abs >= 10_000)        return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: abs >= 1000 ? 0 : 2,
    }).format(n);
  };

  if (hasNoData) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-space-200 tracking-tight">
            Projection
          </span>
          <span className="chip">Need more data</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-space-300 leading-snug max-w-[280px]">
            Log a few trades to unlock a forward projection based on your actual win rate, R:R, and pace.
          </p>
        </div>
      </div>
    );
  }

  const isPositive = result.projectedPnL >= 0;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-space-200 tracking-tight">
            Projection
          </span>
          <span className="text-[10px] text-space-400">· drag to explore</span>
          {result.capped && (
            <span
              className="chip chip-orange text-[10px] !py-0 !px-1.5"
              title="Projection capped at 50× starting balance / 95% drawdown. Small samples grossly overstate compounded growth — treat this as an upper envelope, not a target."
            >
              Capped for realism
            </span>
          )}
        </div>
        {/* Mode toggle (segmented control) */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-ios glass-thin">
          <button
            type="button"
            onClick={() => setMode('compound')}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
              mode === 'compound'
                ? 'bg-space-600 text-space-100'
                : 'text-space-300 hover:text-space-100'
            )}
          >
            Compound
          </button>
          <button
            type="button"
            onClick={() => setMode('linear')}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
              mode === 'linear'
                ? 'bg-space-600 text-space-100'
                : 'text-space-300 hover:text-space-100'
            )}
          >
            Linear
          </button>
        </div>
      </div>

      {/* ── Hero row: horizon + projected balance ── */}
      <div className="px-5 pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] text-space-300 uppercase tracking-wider">
            In {horizon.label}
          </div>
          <div className={cn(
            'font-display text-4xl md:text-5xl font-bold tabular-nums tracking-tight leading-none mt-1',
            isPositive ? 'text-gradient-electric' : 'text-gradient-loss'
          )}>
            {formatCurrency(result.projectedBalance, true)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-space-300 uppercase tracking-wider">Growth</div>
          <div className={cn(
            'font-num text-lg font-semibold tabular-nums mt-1',
            isPositive ? 'text-apple-green' : 'text-apple-red'
          )}>
            {isPositive ? '+' : ''}{formatCurrency(result.projectedPnL, true)}
          </div>
          <div className={cn(
            'text-xs tabular-nums',
            isPositive ? 'text-apple-green' : 'text-apple-red'
          )}>
            {result.growthPct >= 0 ? '+' : ''}{result.growthPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="relative px-5 pb-2">
        <svg
          viewBox={`0 0 ${curve.W} ${curve.H}`}
          className="w-full h-20 md:h-24"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="projFillP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--apple-green))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--apple-green))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="projFillN" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--apple-red))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--apple-red))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Milestone reference lines */}
          {milestones.map((m) => (
            <g key={m.target}>
              <line
                x1="0"
                x2={curve.W}
                y1={m.y}
                y2={m.y}
                stroke="hsl(var(--space-gray-400))"
                strokeWidth="0.3"
                strokeDasharray="1 1.5"
                opacity="0.55"
              />
              <text
                x={curve.W - 1}
                y={m.y - 1}
                fill="hsl(var(--space-gray-300))"
                fontSize="3"
                textAnchor="end"
                className="font-num"
              >
                {m.target >= 1_000_000 ? `$${m.target / 1_000_000}M` : `$${m.target / 1_000}K`}
              </text>
            </g>
          ))}

          {/* Fill + line */}
          {curve.area && (
            <path d={curve.area} fill={`url(#${isPositive ? 'projFillP' : 'projFillN'})`} />
          )}
          {curve.path && (
            <path
              d={curve.path}
              fill="none"
              stroke={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'}
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* End point */}
          {curve.points.length > 0 && (() => {
            const last = curve.points[curve.points.length - 1];
            const x = last.x * curve.W;
            const y = curve.H - ((last.y - curve.yMin) / ((curve.yMax - curve.yMin) || 1)) * curve.H;
            return (
              <g>
                <circle cx={x} cy={y} r="1.6" fill={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'} />
                <circle cx={x} cy={y} r="4" fill="none" stroke={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'} strokeWidth="0.5" opacity="0.5" />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── Slider ── */}
      <div className="px-5 pb-3">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={HORIZONS.length - 1}
            value={sliderIdx}
            onChange={(e) => setSliderIdx(parseInt(e.target.value, 10))}
            className="w-full h-1.5 appearance-none cursor-pointer bg-transparent
              [&::-webkit-slider-runnable-track]:h-1.5
              [&::-webkit-slider-runnable-track]:bg-space-600
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:-mt-[5px]
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-electric
              [&::-webkit-slider-thumb]:shadow-electric
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-space-800
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-moz-range-track]:h-1.5
              [&::-moz-range-track]:bg-space-600
              [&::-moz-range-track]:rounded-full
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-electric
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-space-800
              [&::-moz-range-thumb]:cursor-grab"
          />
          {/* Tick labels */}
          <div className="mt-2 flex justify-between text-[9px] text-space-400 tabular-nums select-none">
            {HORIZONS.map((h, i) => (
              <button
                key={h.shortLabel}
                type="button"
                onClick={() => setSliderIdx(i)}
                className={cn(
                  'transition-colors hover:text-space-200',
                  i === sliderIdx && 'text-electric font-semibold'
                )}
              >
                {h.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer breakdown ── */}
      <div className="grid grid-cols-4 gap-0 border-t border-space-500/40">
        <div className="px-3 py-2.5 border-r border-space-500/40">
          <div className="flex items-center gap-1 text-[9px] text-space-300 uppercase tracking-wider">
            <Calculator className="w-2.5 h-2.5" />
            Trades
          </div>
          <div className="mt-0.5 font-num text-xs font-semibold text-space-100 tabular-nums">
            {result.trades.toLocaleString()}
          </div>
        </div>
        <div className="px-3 py-2.5 border-r border-space-500/40">
          <div className="text-[9px] text-space-300 uppercase tracking-wider">Pace</div>
          <div className="mt-0.5 font-num text-xs font-semibold text-space-100 tabular-nums">
            {model.tradesPerDay.toFixed(1)}/day
          </div>
        </div>
        <div className="px-3 py-2.5 border-r border-space-500/40">
          <div className="flex items-center gap-1 text-[9px] text-space-300 uppercase tracking-wider">
            <Target className="w-2.5 h-2.5" />
            Risk/trade
          </div>
          <div className="mt-0.5 font-num text-xs font-semibold text-apple-red tabular-nums">
            {(model.riskPct * 100).toFixed(2)}%
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1 text-[9px] text-space-300 uppercase tracking-wider">
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5 text-apple-green" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-apple-red" />
            )}
            EV/trade
          </div>
          <div className={cn(
            'mt-0.5 font-num text-xs font-semibold tabular-nums',
            model.evPerTrade >= 0 ? 'text-apple-green' : 'text-apple-red'
          )}>
            {model.evPerTrade >= 0 ? '+' : ''}${model.evPerTrade.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

OneYearProjectionWidget.displayName = 'OneYearProjectionWidget';
