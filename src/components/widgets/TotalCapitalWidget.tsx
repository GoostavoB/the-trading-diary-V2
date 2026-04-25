import { memo, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types/trade';

interface TotalCapitalWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  initialCapital: number;
  currentCapital: number;
  totalPnL: number;
  trades: Trade[];
  /** Optional explicit goal amount (USD). If absent, defaults to initialCapital * 5. */
  targetAmount?: number;
}

type Timeframe = '7D' | '1M' | '3M' | '6M' | 'YTD' | 'ALL';
const TIMEFRAMES: Timeframe[] = ['7D', '1M', '3M', '6M', 'YTD', 'ALL'];

interface CurvePoint {
  x: number;
  y: number;
  date: Date | null;
  delta: number;
  tradeIndex: number; // -1 for the seed point
}

/**
 * Total Capital — hero widget.
 * Shows the story of the account: where it started, where it is, how much grew.
 *
 * Layout:
 *   [ INITIAL ]  →  [ CURRENT (big) ]  →  [ GROWTH + % ]
 *   [ 7D | 1M | 3M | 6M | YTD | ALL  tabs ]
 *   [  sparkline of cumulative capital across all trades  ]
 *      - peak/trough markers
 *      - drawdown shaded
 *      - dashed goal line
 */
export const TotalCapitalWidget = memo(({
  initialCapital,
  currentCapital,
  totalPnL,
  trades,
  targetAmount,
}: TotalCapitalWidgetProps) => {
  const isPositive = totalPnL >= 0;
  const growthPct = initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0;

  // Tooltip hover state for marker dots
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    color: 'green' | 'red';
  } | null>(null);

  // Active timeframe tab
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');

  const formatCurrency = (n: number, opts?: { compact?: boolean }) => {
    if (opts?.compact) {
      const abs = Math.abs(n);
      if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
      if (abs >= 10_000)    return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(n);
  };

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Filter trades by active timeframe
  const filteredTrades = useMemo(() => {
    if (trades.length === 0) return [];
    const validTrades = trades.filter(t => t.trade_date || t.closed_at);
    if (timeframe === 'ALL') return validTrades;

    const now = new Date();
    let cutoff: Date;
    if (timeframe === 'YTD') {
      cutoff = new Date(now.getFullYear(), 0, 1);
    } else {
      const days =
        timeframe === '7D' ? 7 :
        timeframe === '1M' ? 30 :
        timeframe === '3M' ? 90 :
        timeframe === '6M' ? 180 : 0;
      cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    return validTrades.filter(t => {
      const dateStr = t.trade_date || t.closed_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getTime() >= cutoff.getTime();
    });
  }, [trades, timeframe]);

  // Build cumulative capital curve from filtered trades
  const curve = useMemo(() => {
    const W = 100;
    const H = 48;
    if (filteredTrades.length === 0) {
      return { path: '', area: '', drawdown: '', W, H, points: [] as CurvePoint[], yMin: 0, yRange: 1 };
    }

    const sorted = [...filteredTrades].sort((a, b) => {
      const da = new Date(a.trade_date || a.closed_at || a.created_at || 0).getTime();
      const db = new Date(b.trade_date || b.closed_at || b.created_at || 0).getTime();
      return da - db;
    });

    let running = initialCapital;
    const pts: CurvePoint[] = [
      { x: 0, y: initialCapital, date: null, delta: 0, tradeIndex: -1 },
    ];
    sorted.forEach((t, i) => {
      const pnl = t.profit_loss || 0;
      running += pnl;
      const dateStr = t.trade_date || t.closed_at;
      pts.push({
        x: i + 1,
        y: running,
        date: dateStr ? new Date(dateStr) : null,
        delta: pnl,
        tradeIndex: i,
      });
    });

    const ys = pts.map(p => p.y);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const yRange = (yMax - yMin) || 1;

    const toX = (i: number) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W);
    const toY = (yVal: number) => H - ((yVal - yMin) / yRange) * H;

    const path = pts.map((p, i) => {
      const x = toX(p.x);
      const y = toY(p.y);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    const area = `${path} L${W} ${H} L0 ${H} Z`;

    // Drawdown polygon: walk peak; whenever current < peak, draw a band between them
    let runningPeak = pts[0].y;
    const peakYs: number[] = [];
    for (const p of pts) {
      if (p.y > runningPeak) runningPeak = p.y;
      peakYs.push(runningPeak);
    }
    // Build an SVG path that traces the peak line forward then the actual line back.
    // Only segments where current < peak count as drawdown — but for a clean polygon
    // we trace the full thing; areas where peak == current have zero height.
    const forward = pts.map((p, i) => {
      const x = toX(p.x);
      const y = toY(peakYs[i]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    const backward = pts.slice().reverse().map((p) => {
      const x = toX(p.x);
      const y = toY(p.y);
      return `L${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    const drawdown = `${forward} ${backward} Z`;

    return { path, area, drawdown, W, H, points: pts, yMin, yRange };
  }, [filteredTrades, initialCapital]);

  // Find the top N best peaks and worst troughs in the curve.
  // Algorithm: a point qualifies if its delta from the previous point is a local extreme
  // within a window of ±2 trades AND its |delta| > 0.5 * stddev of all deltas.
  const markers = useMemo(() => {
    const pts = curve.points;
    if (pts.length < 3) return { peaks: [] as CurvePoint[], troughs: [] as CurvePoint[] };

    // Use the trade points only (exclude the seed at index 0)
    const tradePts = pts.slice(1);
    const deltas = tradePts.map(p => p.delta);
    const meanAbs = deltas.reduce((a, b) => a + Math.abs(b), 0) / deltas.length || 0;
    const variance = deltas.reduce((a, b) => a + (b - meanAbs) * (b - meanAbs), 0) / deltas.length;
    const sigma = Math.sqrt(variance) || 0;
    const threshold = Math.max(0.5 * sigma, 0.0001);

    const window = 2;
    const peakCandidates: CurvePoint[] = [];
    const troughCandidates: CurvePoint[] = [];

    for (let i = 0; i < tradePts.length; i++) {
      const p = tradePts[i];
      const lo = Math.max(0, i - window);
      const hi = Math.min(tradePts.length - 1, i + window);
      let isLocalMaxDelta = true;
      let isLocalMinDelta = true;
      for (let j = lo; j <= hi; j++) {
        if (j === i) continue;
        if (tradePts[j].delta > p.delta) isLocalMaxDelta = false;
        if (tradePts[j].delta < p.delta) isLocalMinDelta = false;
      }
      if (isLocalMaxDelta && p.delta > threshold) peakCandidates.push(p);
      if (isLocalMinDelta && p.delta < -threshold) troughCandidates.push(p);
    }

    // Top 3 by |delta|
    peakCandidates.sort((a, b) => b.delta - a.delta);
    troughCandidates.sort((a, b) => a.delta - b.delta);
    return {
      peaks: peakCandidates.slice(0, 3),
      troughs: troughCandidates.slice(0, 3),
    };
  }, [curve.points]);

  // Goal line position
  const goal = useMemo(() => {
    if (curve.points.length === 0) return null;
    const isExplicit = typeof targetAmount === 'number' && targetAmount > 0;
    const amount = isExplicit ? (targetAmount as number) : initialCapital * 5;
    if (amount <= 0) return null;
    const pct = Math.max(0, Math.min(100, (currentCapital / amount) * 100));
    const label = isExplicit
      ? `🎯 ${formatCurrency(amount, { compact: true })} · ${pct.toFixed(0)}% there`
      : `🎯 5× starting · ${pct.toFixed(0)}% there`;
    // Y position only valid when within visible range; otherwise clamp to top/bottom edge
    const y = curve.H - ((amount - curve.yMin) / curve.yRange) * curve.H;
    const yClamped = Math.max(0, Math.min(curve.H, y));
    const inRange = y >= 0 && y <= curve.H;
    return { amount, pct, label, y: yClamped, inRange };
  }, [targetAmount, initialCapital, currentCapital, curve.yMin, curve.yRange, curve.H, curve.points.length]);

  const toX = (i: number) =>
    curve.points.length === 1 ? curve.W / 2 : (i / (curve.points.length - 1)) * curve.W;
  const toY = (yVal: number) => curve.H - ((yVal - curve.yMin) / curve.yRange) * curve.H;

  const hasTrades = trades.length > 0;
  const hasFiltered = filteredTrades.length > 0;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <span className="text-[11px] font-medium text-space-200 tracking-tight">
          Total Capital
        </span>
        <span
          className={cn(
            'chip',
            isPositive ? 'chip-green' : 'chip-red'
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
        </span>
      </div>

      {/* Hero number */}
      <div className="px-5 pb-1">
        <div className={cn(
          'font-display text-5xl md:text-6xl font-bold tabular-nums tracking-tight leading-none',
          isPositive ? 'text-gradient-electric' : 'text-gradient-loss'
        )}>
          {formatCurrency(currentCapital)}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-space-300 tabular-nums">
          <span>Started at</span>
          <span className="text-space-200 font-medium">{formatCurrency(initialCapital)}</span>
          <span className="text-space-500">·</span>
          <span className={cn(
            'font-semibold',
            isPositive ? 'text-apple-green' : 'text-apple-red'
          )}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </span>
        </div>
      </div>

      {/* Timeframe tabs */}
      {hasTrades && (
        <div className="px-5 pt-3 pb-1">
          <div className="glass-thin inline-flex items-center gap-0.5 rounded-lg p-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors tabular-nums',
                  timeframe === tf
                    ? 'bg-electric text-white'
                    : 'text-space-300 hover:text-space-100'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sparkline area */}
      <div className="flex-1 px-5 pb-4 pt-2 flex items-end relative">
        {!hasTrades ? (
          <div className="w-full h-14 md:h-16 flex items-center justify-center text-xs text-space-400">
            No trades yet
          </div>
        ) : !hasFiltered ? (
          <div className="w-full h-14 md:h-16 flex flex-col items-center justify-center gap-2 text-xs text-space-400">
            <span>No trades in this period</span>
            <button
              type="button"
              onClick={() => setTimeframe('ALL')}
              className="text-[10px] text-electric hover:underline"
            >
              Show all
            </button>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${curve.W} ${curve.H}`}
            className="w-full h-14 md:h-16 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="capitalFillPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--apple-green))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(var(--apple-green))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="capitalFillNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--apple-red))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(var(--apple-red))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Drawdown shading (drawn first, beneath everything) */}
            {curve.drawdown && (
              <path
                d={curve.drawdown}
                fill="hsl(var(--apple-red) / 0.08)"
                stroke="none"
              />
            )}

            {/* Area + line */}
            {curve.area && (
              <path
                d={curve.area}
                fill={`url(#${isPositive ? 'capitalFillPositive' : 'capitalFillNegative'})`}
              />
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

            {/* Goal line */}
            {goal && goal.inRange && (
              <g>
                <line
                  x1={0}
                  x2={curve.W}
                  y1={goal.y}
                  y2={goal.y}
                  stroke="hsl(var(--electric))"
                  strokeWidth="0.6"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
                <text
                  x={curve.W - 1}
                  y={Math.max(4, goal.y - 1.5)}
                  textAnchor="end"
                  fontSize="3.2"
                  fill="hsl(var(--electric))"
                  opacity="0.9"
                >
                  {goal.label}
                </text>
              </g>
            )}

            {/* Peak markers (green) */}
            {markers.peaks.map(p => {
              const cx = toX(p.x);
              const cy = toY(p.y);
              const dateLabel = p.date ? formatShortDate(p.date) : '—';
              const tip = `${dateLabel}: +${formatCurrency(p.delta, { compact: true })} (Best Day)`;
              return (
                <g
                  key={`peak-${p.tradeIndex}`}
                  onMouseEnter={() => setHover({ x: cx, y: cy, label: tip, color: 'green' })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill="hsl(var(--apple-green))"
                    opacity="0.18"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="1.6"
                    fill="hsl(var(--apple-green))"
                  />
                  <title>{tip}</title>
                </g>
              );
            })}

            {/* Trough markers (red) */}
            {markers.troughs.map(p => {
              const cx = toX(p.x);
              const cy = toY(p.y);
              const dateLabel = p.date ? formatShortDate(p.date) : '—';
              const tip = `${dateLabel}: ${formatCurrency(p.delta, { compact: true })} (Worst Day)`;
              return (
                <g
                  key={`trough-${p.tradeIndex}`}
                  onMouseEnter={() => setHover({ x: cx, y: cy, label: tip, color: 'red' })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill="hsl(var(--apple-red))"
                    opacity="0.18"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="1.6"
                    fill="hsl(var(--apple-red))"
                  />
                  <title>{tip}</title>
                </g>
              );
            })}

            {/* End dot */}
            {curve.points.length > 0 && (() => {
              const last = curve.points[curve.points.length - 1];
              const x = toX(last.x);
              const y = toY(last.y);
              return (
                <g>
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="none"
                    stroke={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'}
                    strokeWidth="1"
                    opacity="0.5"
                    className="animate-pulse-subtle"
                  />
                </g>
              );
            })()}
          </svg>
        )}

        {/* Hover tooltip overlay (positioned in % so it tracks viewBox) */}
        {hover && (
          <div
            className={cn(
              'pointer-events-none absolute z-10 px-2 py-1 rounded-md text-[10px] font-medium tabular-nums whitespace-nowrap shadow-lg',
              'glass-thin border',
              hover.color === 'green'
                ? 'border-apple-green/40 text-apple-green'
                : 'border-apple-red/40 text-apple-red'
            )}
            style={{
              left: `calc(20px + ${(hover.x / curve.W) * 100}% - 50px)`,
              bottom: `calc(${100 - (hover.y / curve.H) * 100}% + 10px)`,
            }}
          >
            {hover.label}
          </div>
        )}
      </div>

      {/* Micro stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-space-500/40 px-0">
        <div className="px-5 py-3 border-r border-space-500/40">
          <div className="text-[10px] text-space-300 uppercase tracking-wider">Initial</div>
          <div className="mt-0.5 font-num text-sm font-semibold text-space-100 tabular-nums">
            {formatCurrency(initialCapital, { compact: true })}
          </div>
        </div>
        <div className="px-5 py-3 border-r border-space-500/40">
          <div className="text-[10px] text-space-300 uppercase tracking-wider">Current</div>
          <div className={cn(
            'mt-0.5 font-num text-sm font-semibold tabular-nums',
            isPositive ? 'text-space-100' : 'text-apple-red'
          )}>
            {formatCurrency(currentCapital, { compact: true })}
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] text-space-300 uppercase tracking-wider">Growth</div>
          <div className={cn(
            'mt-0.5 font-num text-sm font-semibold tabular-nums',
            isPositive ? 'text-apple-green' : 'text-apple-red'
          )}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, { compact: true })}
          </div>
        </div>
      </div>
    </div>
  );
});

TotalCapitalWidget.displayName = 'TotalCapitalWidget';
