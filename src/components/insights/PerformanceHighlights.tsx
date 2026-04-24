import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { TrendingUp, TrendingDown, Flame, Snowflake, Trophy, AlertTriangle } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatPercent } from '@/utils/formatNumber';
import { useTranslation } from '@/hooks/useTranslation';
import { findBestWorstDays } from '@/utils/insightCalculations';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { calculateTradePnL } from '@/utils/pnl';
import { cn } from '@/lib/utils';

interface PerformanceHighlightsProps {
  trades: Trade[];
  bestTrade?: Trade;
  worstTrade?: Trade;
  currentStreak: { type: 'win' | 'loss'; count: number };
}

// ── Streak Indicator ────────────────────────────────────────────
function StreakDisplay({ streak }: { streak: { type: 'win' | 'loss'; count: number } }) {
  const isWin = streak.type === 'win';
  const dots = Math.min(streak.count, 12);

  return (
    <div className={cn(
      "relative rounded-xl p-3.5 overflow-hidden border",
      isWin
        ? "border-amber-500/20 bg-amber-950/20"
        : "border-slate-500/20 bg-slate-950/20"
    )}>
      {/* Glow */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        isWin
          ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(38_92%_50%/0.15),transparent)]"
          : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(220_10%_50%/0.08),transparent)]"
      )} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[9px] font-bold tracking-widest text-muted-foreground/50 uppercase mb-1">
            {isWin ? 'Win Streak 🔥' : 'Loss Streak'}
          </div>
          <div className={cn(
            "text-3xl font-black tabular-nums leading-none",
            isWin ? "text-amber-400" : "text-slate-400"
          )}>
            {streak.count}
          </div>
          <div className="text-[10px] text-muted-foreground/40 mt-1">
            {streak.count === 1 ? 'trade in a row' : 'trades in a row'}
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-xl",
          isWin ? "bg-amber-500/15" : "bg-slate-500/10"
        )}>
          {isWin
            ? <Flame className="h-5 w-5 text-amber-400" />
            : <Snowflake className="h-5 w-5 text-slate-400" />
          }
        </div>
      </div>

      {/* Streak dots */}
      {streak.count > 0 && (
        <div className="flex gap-1 mt-3">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                isWin ? "bg-amber-400/60" : "bg-slate-500/50",
                i === dots - 1 && "animate-pulse"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trade Highlight Card ────────────────────────────────────────
function TradeCard({
  type,
  trade,
  pnl,
}: {
  type: 'best' | 'worst';
  trade: Trade;
  pnl: number;
}) {
  const isBest = type === 'best';
  const roi = trade.roi || 0;
  const symbol = trade.symbol || trade.symbol_temp || '—';
  const date = trade.trade_date
    ? new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className={cn(
      "relative rounded-xl p-3 overflow-hidden border transition-all duration-300",
      "hover:scale-[1.01]",
      isBest
        ? "border-emerald-500/15 bg-emerald-950/15 hover:border-emerald-500/25"
        : "border-rose-500/15 bg-rose-950/15 hover:border-rose-500/25"
    )}>
      {/* Top label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isBest
            ? <Trophy className="h-3 w-3 text-emerald-400/80" />
            : <AlertTriangle className="h-3 w-3 text-rose-400/80" />
          }
          <span className={cn(
            "text-[9px] font-bold tracking-widest uppercase",
            isBest ? "text-emerald-400/80" : "text-rose-400/80"
          )}>
            {isBest ? 'Best Trade' : 'Worst Trade'}
          </span>
        </div>
        {date && (
          <span className="text-[9px] text-muted-foreground/40 font-mono">{date}</span>
        )}
      </div>

      {/* Symbol badge */}
      <div className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide mb-2 border",
        isBest
          ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
          : "bg-rose-400/10 border-rose-400/20 text-rose-300"
      )}>
        {symbol}
      </div>

      {/* PnL */}
      <div className={cn(
        "text-lg font-black tabular-nums leading-none",
        isBest ? "text-emerald-300" : "text-rose-300"
      )}>
        <BlurredCurrency amount={pnl} className="inline" />
      </div>

      {/* ROI */}
      <div className={cn(
        "flex items-center gap-1 mt-1 text-[10px] font-semibold",
        isBest ? "text-emerald-400/70" : "text-rose-400/70"
      )}>
        {isBest
          ? <TrendingUp className="h-3 w-3" />
          : <TrendingDown className="h-3 w-3" />
        }
        {isBest ? '+' : ''}{formatPercent(roi)}
      </div>

      {/* Side accent line */}
      <div className={cn(
        "absolute top-3 bottom-3 left-0 w-0.5 rounded-full",
        isBest ? "bg-emerald-400/50" : "bg-rose-400/50"
      )} />
    </div>
  );
}

// ── Day Highlight Card ──────────────────────────────────────────
function DayCard({ type, date, pnl }: { type: 'best' | 'worst'; date: string; pnl: number }) {
  const isBest = type === 'best';
  const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className={cn(
      "relative rounded-xl p-3 border overflow-hidden",
      isBest
        ? "border-teal-500/15 bg-teal-950/15"
        : "border-orange-500/15 bg-orange-950/15"
    )}>
      <div className={cn(
        "text-[9px] font-bold tracking-widest uppercase mb-2",
        isBest ? "text-teal-400/70" : "text-orange-400/70"
      )}>
        {isBest ? 'Best Day' : 'Worst Day'}
      </div>
      <div className={cn(
        "text-base font-black tabular-nums",
        isBest ? "text-teal-300" : "text-orange-300"
      )}>
        <BlurredCurrency amount={pnl} className="inline" />
      </div>
      <div className="text-[9px] text-muted-foreground/40 mt-1 font-mono">{dateStr}</div>

      <div className={cn(
        "absolute top-3 bottom-3 left-0 w-0.5 rounded-full",
        isBest ? "bg-teal-400/40" : "bg-orange-400/40"
      )} />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export const PerformanceHighlights = memo(({
  trades,
  bestTrade,
  worstTrade,
  currentStreak,
}: PerformanceHighlightsProps) => {
  const { t } = useTranslation();

  if (!trades || trades.length === 0 || !bestTrade || !worstTrade) return null;

  const { best: bestDay, worst: worstDay } = findBestWorstDays(trades);
  const bestTradePnL = calculateTradePnL(bestTrade, { includeFees: true });
  const worstTradePnL = calculateTradePnL(worstTrade, { includeFees: true });
  const isSameDay = bestDay && worstDay && bestDay.date === worstDay.date;

  return (
    <PremiumCard className="h-full flex flex-col" contentClassName="flex-1 p-3 overflow-y-auto">
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase mb-3">
        Performance Highlights
      </div>

      <div className="space-y-2">
        {/* Streak */}
        <StreakDisplay streak={currentStreak} />

        {/* Best / Worst Trade */}
        <div className="grid grid-cols-2 gap-2">
          <TradeCard type="best" trade={bestTrade} pnl={bestTradePnL} />
          <TradeCard type="worst" trade={worstTrade} pnl={worstTradePnL} />
        </div>

        {/* Best / Worst Day */}
        {bestDay && (
          <div className="grid grid-cols-2 gap-2">
            <DayCard type="best" date={bestDay.date} pnl={bestDay.totalPnL} />
            {worstDay && !isSameDay
              ? <DayCard type="worst" date={worstDay.date} pnl={worstDay.totalPnL} />
              : (
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.02] flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/30 text-center">
                    Only one<br />trading day
                  </span>
                </div>
              )
            }
          </div>
        )}
      </div>
    </PremiumCard>
  );
});

PerformanceHighlights.displayName = 'PerformanceHighlights';
