import { memo, useMemo } from 'react';
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
}

/**
 * Total Capital — hero widget.
 * Shows the story of the account: where it started, where it is, how much grew.
 *
 * Layout:
 *   [ INITIAL ]  →  [ CURRENT (big) ]  →  [ GROWTH + % ]
 *   [  sparkline of cumulative capital across all trades  ]
 */
export const TotalCapitalWidget = memo(({
  initialCapital,
  currentCapital,
  totalPnL,
  trades,
}: TotalCapitalWidgetProps) => {
  const isPositive = totalPnL >= 0;
  const growthPct = initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0;

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

  // Build cumulative capital curve across trades
  const curve = useMemo(() => {
    if (trades.length === 0) return { path: '', area: '', W: 100, H: 48, points: [] as { x: number; y: number }[] };

    const sorted = [...trades].sort((a, b) => {
      const da = new Date(a.trade_date || a.created_at || 0).getTime();
      const db = new Date(b.trade_date || b.created_at || 0).getTime();
      return da - db;
    });

    let running = initialCapital;
    const pts: { x: number; y: number }[] = [{ x: 0, y: initialCapital }];
    sorted.forEach((t, i) => {
      running += t.profit_loss || 0;
      pts.push({ x: i + 1, y: running });
    });

    const ys = pts.map(p => p.y);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const yRange = (yMax - yMin) || 1;
    const W = 100;
    const H = 48;
    const path = pts.map((p, i) => {
      const x = pts.length === 1 ? W / 2 : (p.x / (pts.length - 1)) * W;
      const y = H - ((p.y - yMin) / yRange) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    const area = `${path} L${W} ${H} L0 ${H} Z`;
    return { path, area, W, H, points: pts };
  }, [trades, initialCapital]);

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

      {/* Sparkline */}
      <div className="flex-1 px-5 pb-4 pt-2 flex items-end">
        <svg
          viewBox={`0 0 ${curve.W} ${curve.H}`}
          className="w-full h-14 md:h-16"
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
          {/* End dot */}
          {curve.points.length > 0 && (() => {
            const last = curve.points[curve.points.length - 1];
            const ys = curve.points.map(p => p.y);
            const yMin = Math.min(...ys);
            const yRange = (Math.max(...ys) - yMin) || 1;
            const x = curve.points.length === 1 ? curve.W / 2 : (last.x / (curve.points.length - 1)) * curve.W;
            const y = curve.H - ((last.y - yMin) / yRange) * curve.H;
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
