import { memo, useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface OneYearProjectionWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  currentBalance: number;
  totalPnL: number;
  tradingDays: number;
  totalTrades: number;
  winRate: number;               // 0-100
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
}

type ProjectionRow = {
  label: string;
  months: number;
  trades: number;
  pnl: number;
  balance: number;
  growthPct: number;
};

/**
 * 1-Year Projection Widget — Apple Premium
 *
 * Projects forward using the trader's current behavior as baseline:
 *   - trades/day = totalTrades / tradingDays
 *   - expected value per trade = (winRate × avgWin) − ((1 − winRate) × avgLoss)
 *   - periods: 1m / 3m / 6m / 12m (21 trading days/month)
 *
 * Displays an animated sparkline + 4 rows with projected balance, % growth,
 * and trade count per horizon.
 */
export const OneYearProjectionWidget = memo(({
  currentBalance,
  totalPnL,
  tradingDays,
  totalTrades,
  winRate,
  avgWin,
  avgLoss,
}: OneYearProjectionWidgetProps) => {
  const { t } = useTranslation();

  const TRADING_DAYS_PER_MONTH = 21;
  const HORIZONS = [
    { label: '1 Month',  months: 1 },
    { label: '3 Months', months: 3 },
    { label: '6 Months', months: 6 },
    { label: '1 Year',   months: 12 },
  ];

  const projection = useMemo(() => {
    const tradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
    const wrFraction = Math.max(0, Math.min(1, winRate / 100));
    // Expected value per trade using current avgWin and avgLoss
    const evPerTrade = (wrFraction * avgWin) - ((1 - wrFraction) * avgLoss);

    const rows: ProjectionRow[] = HORIZONS.map(({ label, months }) => {
      const projectedTrades = tradesPerDay * TRADING_DAYS_PER_MONTH * months;
      const projectedPnL = evPerTrade * projectedTrades;
      const projectedBalance = currentBalance + projectedPnL;
      const growthPct = currentBalance > 0 ? (projectedPnL / currentBalance) * 100 : 0;
      return {
        label,
        months,
        trades: Math.round(projectedTrades),
        pnl: projectedPnL,
        balance: projectedBalance,
        growthPct,
      };
    });

    return { rows, tradesPerDay, evPerTrade };
  }, [currentBalance, tradingDays, totalTrades, winRate, avgWin, avgLoss]);

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000)     return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  };

  // Sparkline path — daily interpolation across 12 months
  const sparkline = useMemo(() => {
    const tradesPerDay = projection.tradesPerDay;
    const ev = projection.evPerTrade;
    const DAYS = 252; // 1 year trading days
    const points: { x: number; y: number }[] = [];
    for (let d = 0; d <= DAYS; d++) {
      const bal = currentBalance + (ev * tradesPerDay * d);
      points.push({ x: d, y: bal });
    }
    const ys = points.map(p => p.y);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const yRange = yMax - yMin || 1;
    const W = 100;
    const H = 36;
    const path = points
      .map((p, i) => {
        const x = (p.x / DAYS) * W;
        const y = H - ((p.y - yMin) / yRange) * H;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
    return { path, W, H };
  }, [projection, currentBalance]);

  const isPositive = projection.evPerTrade > 0;
  const hasNoData = totalTrades === 0 || tradingDays === 0;

  if (hasNoData) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-space-200 tracking-tight uppercase">
            1-Year Projection
          </span>
          <span className="chip">No data yet</span>
        </div>
        <p className="text-sm text-space-300 leading-snug">
          Log at least one trading day to unlock a forward projection based on your actual consistency.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-medium text-space-200 tracking-tight uppercase">
            1-Year Projection
          </span>
          <span className="text-[10px] text-space-400 tabular-nums">
            · if you keep this pace
          </span>
        </div>
        <span
          className={cn(
            'chip',
            isPositive ? 'chip-green' : 'chip-red'
          )}
        >
          {isPositive ? 'Compounding up' : 'Compounding down'}
        </span>
      </div>

      {/* Sparkline */}
      <div className="px-4 pb-2">
        <svg
          viewBox={`0 0 ${sparkline.W} ${sparkline.H}`}
          className="w-full h-9"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'} stopOpacity="0.35" />
              <stop offset="100%" stopColor={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${sparkline.path} L${sparkline.W} ${sparkline.H} L0 ${sparkline.H} Z`}
            fill="url(#projGradient)"
            opacity="0.9"
          />
          <path
            d={sparkline.path}
            fill="none"
            stroke={isPositive ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Milestones row */}
      <div className="flex-1 px-4 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {projection.rows.map((row, idx) => (
            <div
              key={row.label}
              className={cn(
                'relative flex flex-col gap-1 rounded-ios px-2.5 py-2 border transition-all',
                'animate-fade-in',
                isPositive
                  ? 'bg-apple-green/8 border-apple-green/20 hover:border-apple-green/40'
                  : 'bg-apple-red/8 border-apple-red/20 hover:border-apple-red/40',
                idx === 3 && 'ring-1 ring-electric/30' // highlight 1-year
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="text-[9px] text-space-300 uppercase tracking-wider">{row.label}</span>
              <span className={cn(
                'text-sm font-semibold tabular-nums leading-tight',
                isPositive ? 'text-apple-green' : 'text-apple-red'
              )}>
                {formatCurrency(row.balance)}
              </span>
              <div className="flex items-center gap-1">
                <ArrowUpRight className={cn(
                  'w-2.5 h-2.5',
                  isPositive ? 'text-apple-green' : 'text-apple-red rotate-90'
                )} />
                <span className={cn(
                  'text-[10px] tabular-nums font-medium',
                  isPositive ? 'text-apple-green' : 'text-apple-red'
                )}>
                  {row.growthPct >= 0 ? '+' : ''}{row.growthPct.toFixed(1)}%
                </span>
              </div>
              <span className="text-[9px] text-space-400 tabular-nums">
                {row.trades.toLocaleString()} trades
              </span>
            </div>
          ))}
        </div>

        {/* Footer assumptions */}
        <div className="pt-3 mt-2.5 border-t border-space-500/40 flex items-center justify-between text-[10px] text-space-400 tabular-nums">
          <span>
            EV / trade:{' '}
            <span className={cn('font-semibold',
              isPositive ? 'text-apple-green' : 'text-apple-red'
            )}>
              {projection.evPerTrade >= 0 ? '+' : ''}${projection.evPerTrade.toFixed(2)}
            </span>
          </span>
          <span>
            Pace: <span className="text-space-200 font-semibold">
              {projection.tradesPerDay.toFixed(1)}
            </span> trades/day
          </span>
          <span className="hidden md:inline">
            21 days/mo · compounding off
          </span>
        </div>
      </div>
    </div>
  );
});

OneYearProjectionWidget.displayName = 'OneYearProjectionWidget';
