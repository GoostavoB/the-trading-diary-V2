import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { TrendingUp, TrendingDown, Flame, Snowflake, Trophy, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatPercent } from '@/utils/formatNumber';
import { useTranslation } from '@/hooks/useTranslation';
import { findBestWorstDays, formatHoldingTime } from '@/utils/insightCalculations';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { calculateTradePnL } from '@/utils/pnl';
import { cn } from '@/lib/utils';

interface PerformanceHighlightsProps {
  trades: Trade[];
  bestTrade?: Trade;
  worstTrade?: Trade;
  currentStreak: { type: 'win' | 'loss'; count: number };
}

// ── Helpers ─────────────────────────────────────────────────────
function getTradeTimestamp(t: Trade): number {
  const raw = t.closed_at || t.trade_date || t.opened_at;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function formatShortDate(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTinyDate(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getHoldingMinutes(t: Trade): number | null {
  if (typeof t.duration_minutes === 'number' && t.duration_minutes > 0) return t.duration_minutes;
  if (typeof t.duration_hours === 'number' && t.duration_hours > 0) return t.duration_hours * 60;
  if (t.opened_at && t.closed_at) {
    const a = new Date(t.opened_at).getTime();
    const b = new Date(t.closed_at).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) return (b - a) / 60000;
  }
  return null;
}

function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (abs >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

// ── Streak Indicator ────────────────────────────────────────────
function StreakDisplay({
  streak,
  recentStreakTrades,
}: {
  streak: { type: 'win' | 'loss'; count: number };
  recentStreakTrades: Trade[];
}) {
  const isWin = streak.type === 'win';

  // Take last up-to-7 trades that participate in the streak (most recent on the right)
  const dotTrades = recentStreakTrades.slice(-7);

  // Date range across the dots (oldest → newest)
  const rangeStart = dotTrades.length > 0 ? formatTinyDate(dotTrades[0].closed_at || dotTrades[0].trade_date) : '';
  const rangeEnd =
    dotTrades.length > 1
      ? formatTinyDate(dotTrades[dotTrades.length - 1].closed_at || dotTrades[dotTrades.length - 1].trade_date)
      : '';
  const rangeLabel = rangeStart && rangeEnd && rangeStart !== rangeEnd
    ? `${rangeStart} – ${rangeEnd}`
    : rangeStart;

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
          ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(38_92%_50%/0.12),transparent)]"
          : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(220_10%_50%/0.08),transparent)]"
      )} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold text-space-400 mb-1 flex items-center gap-1.5">
            {isWin ? 'Win Streak' : 'Loss Streak'}
            {isWin && streak.count > 0 && (
              <Flame className="h-3 w-3 text-amber-400/70" />
            )}
          </div>
          <div className={cn(
            "text-3xl font-black tabular-nums leading-none font-num",
            isWin ? "text-gradient-electric" : "text-slate-300"
          )}>
            {streak.count}
          </div>
          <div className="text-[10px] text-space-400 mt-1">
            {streak.count === 1 ? 'trade in a row' : 'trades in a row'}
            {rangeLabel && <span className="text-space-400/70"> · {rangeLabel}</span>}
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

      {/* Mini-timeline of streak trades */}
      {dotTrades.length > 0 && (
        <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto">
          {dotTrades.map((t, i) => {
            const pnl = calculateTradePnL(t, { includeFees: true });
            const sym = t.symbol || t.symbol_temp || '—';
            const sign = pnl >= 0 ? '+' : '−';
            const tip = `${sym} · ${sign}$${Math.abs(pnl).toFixed(0)}`;
            const isLast = i === dotTrades.length - 1;
            return (
              <div
                key={t.id || i}
                title={tip}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-bold tabular-nums border whitespace-nowrap transition-all",
                  pnl >= 0
                    ? "bg-emerald-500/12 border-emerald-400/25 text-emerald-300"
                    : "bg-rose-500/12 border-rose-400/25 text-rose-300",
                  isLast && "ring-1 ring-amber-400/40"
                )}
              >
                {sym.replace(/USDT$|USD$|PERP$/i, '').slice(0, 4)}
              </div>
            );
          })}
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
  isHistoricalRecord,
  isOversized,
  avgLossAbs,
}: {
  type: 'best' | 'worst';
  trade: Trade;
  pnl: number;
  isHistoricalRecord?: boolean;
  isOversized?: boolean;
  avgLossAbs?: number;
}) {
  const isBest = type === 'best';
  const roi = trade.roi || 0;
  const symbol = trade.symbol || trade.symbol_temp || '—';
  const dateRaw = trade.closed_at || trade.trade_date;
  const dateLong = formatShortDate(dateRaw);
  const holdMin = getHoldingMinutes(trade);
  const holdLabel = holdMin != null ? formatHoldingTime(holdMin) : null;
  const setup = (trade.setup || '').trim();
  const lesson = (trade.notes || trade.error_description || '').trim();
  const hasPrices = trade.entry_price != null && trade.exit_price != null;

  // Multiplier for "Xx bigger than average loss"
  const multiplier =
    !isBest && avgLossAbs && avgLossAbs > 0 ? Math.abs(pnl) / avgLossAbs : 0;
  const showOversize = !isBest && isOversized && multiplier >= 2;

  const accentClasses = isBest
    ? "border-emerald-500/15 bg-emerald-950/15 hover:border-emerald-500/30"
    : "border-rose-500/15 bg-rose-950/15 hover:border-rose-500/30";

  const content = (
    <>
      {/* Top label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isBest
            ? <Trophy className="h-3 w-3 text-emerald-400/80" />
            : <AlertTriangle className="h-3 w-3 text-rose-400/80" />
          }
          <span className={cn(
            "text-[10px] font-semibold",
            isBest ? "text-emerald-400/90" : "text-rose-400/90"
          )}>
            {isBest ? 'Best Trade' : 'Worst Trade'}
          </span>
          {isBest && isHistoricalRecord && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-amber-500/15 border border-amber-400/30 text-amber-300">
              Record
            </span>
          )}
        </div>
        {dateLong && (
          <span className="text-[9.5px] text-space-400 font-mono tabular-nums">{dateLong}</span>
        )}
      </div>

      {/* Symbol + setup row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border",
          isBest
            ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
            : "bg-rose-400/10 border-rose-400/20 text-rose-300"
        )}>
          {symbol}
        </span>
        {setup && (
          <span className="chip chip-electric !py-0.5 !px-1.5 !text-[9.5px]">
            {setup}
          </span>
        )}
      </div>

      {/* PnL */}
      <div className={cn(
        "text-lg font-black tabular-nums leading-none font-num",
        isBest ? "text-gradient-electric" : "text-rose-300"
      )}>
        <BlurredCurrency amount={pnl} className="inline" />
      </div>

      {/* ROI + holding time */}
      <div className={cn(
        "flex items-center gap-2 mt-1.5 text-[10px] font-semibold",
        isBest ? "text-emerald-400/80" : "text-rose-400/80"
      )}>
        <span className="inline-flex items-center gap-1">
          {isBest
            ? <TrendingUp className="h-3 w-3" />
            : <TrendingDown className="h-3 w-3" />
          }
          <span className="tabular-nums">{isBest ? '+' : ''}{formatPercent(roi)}</span>
        </span>
        {holdLabel && (
          <span className="text-space-400 font-normal">· {holdLabel}</span>
        )}
      </div>

      {/* Entry → exit prices */}
      {hasPrices && (
        <div className="mt-1.5 text-[10px] text-space-300 font-mono tabular-nums truncate">
          {formatPrice(trade.entry_price)} <ArrowRight className="inline h-2.5 w-2.5 mx-0.5 -mt-0.5 text-space-400" /> {formatPrice(trade.exit_price)}
        </div>
      )}

      {/* Worst-trade extras: oversize hint + lesson */}
      {!isBest && showOversize && (
        <div className="mt-1.5 text-[9.5px] text-orange-300/90 font-semibold tabular-nums">
          {multiplier.toFixed(1)}x bigger than average loss
        </div>
      )}
      {!isBest && lesson && (
        <div className="mt-2 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5">
          <div className="text-[9px] font-semibold text-space-400 mb-0.5">Lesson</div>
          <div className="text-[10px] text-space-300 leading-snug line-clamp-2">{lesson}</div>
        </div>
      )}
      {!isBest && !lesson && (
        <Link
          to="/journal"
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300/80 hover:text-rose-200 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3" />
          Add note
        </Link>
      )}

      {/* Side accent line */}
      <div className={cn(
        "absolute top-3 bottom-3 left-0 w-0.5 rounded-full",
        isBest ? "bg-emerald-400/50" : "bg-rose-400/50"
      )} />
    </>
  );

  return (
    <Link
      to="/journal"
      className={cn(
        "relative rounded-xl p-3 overflow-hidden border block transition-all duration-300 hover-lift",
        accentClasses
      )}
    >
      {content}
    </Link>
  );
}

// ── Day Highlight Card ──────────────────────────────────────────
function DayCard({
  type,
  date,
  pnl,
  tradeCount,
  wins,
  losses,
  topHourLabel,
}: {
  type: 'best' | 'worst';
  date: string | null;
  pnl: number | null;
  tradeCount?: number;
  wins?: number;
  losses?: number;
  topHourLabel?: string | null;
}) {
  const isBest = type === 'best';
  const hasData = date != null && pnl != null && Number.isFinite(pnl);
  const dt = hasData ? new Date(date as string) : null;
  const weekday = dt ? dt.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const monthDay = dt ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div className={cn(
      "relative rounded-xl p-3 border overflow-hidden",
      isBest
        ? "border-teal-500/15 bg-teal-950/15"
        : "border-orange-500/15 bg-orange-950/15"
    )}>
      <div className={cn(
        "text-[10px] font-semibold mb-1.5",
        isBest ? "text-teal-400/80" : "text-orange-400/80"
      )}>
        {isBest ? 'Best Day' : 'Worst Day'}
      </div>

      <div className={cn(
        "text-base font-black tabular-nums font-num",
        !hasData
          ? "text-space-400"
          : (isBest ? "text-gradient-electric" : "text-orange-300")
      )}>
        {hasData
          ? <BlurredCurrency amount={pnl as number} className="inline" />
          : '—'}
      </div>

      {hasData && (
        <div className="mt-1 text-[10px] text-space-300 font-mono tabular-nums">
          {weekday}<span className="text-space-400"> · {monthDay}</span>
        </div>
      )}

      {hasData && tradeCount != null && tradeCount > 0 && (
        <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[9.5px]">
          <span className={cn(
            "px-1.5 py-0.5 rounded-md font-bold tabular-nums border",
            isBest
              ? "bg-teal-400/10 border-teal-400/20 text-teal-300"
              : "bg-orange-400/10 border-orange-400/20 text-orange-300"
          )}>
            {tradeCount} {tradeCount === 1 ? 'trade' : 'trades'}
          </span>
          {(wins != null && losses != null) && (
            <span className="text-space-400 tabular-nums">
              <span className="text-emerald-400/80">{wins}W</span>
              <span className="text-space-400"> / </span>
              <span className="text-rose-400/80">{losses}L</span>
            </span>
          )}
        </div>
      )}

      {hasData && topHourLabel && (
        <div className="mt-1 text-[9px] text-space-400 truncate">
          Most active: <span className="text-space-300 tabular-nums">{topHourLabel}</span>
        </div>
      )}

      <div className={cn(
        "absolute top-3 bottom-3 left-0 w-0.5 rounded-full",
        isBest ? "bg-teal-400/40" : "bg-orange-400/40"
      )} />
    </div>
  );
}

// ── Helpers for Day stats / streak trades ───────────────────────
function buildDayStats(trades: Trade[], dateISO: string | null) {
  if (!dateISO) return null;
  let wins = 0;
  let losses = 0;
  const hourBuckets: Record<string, number> = {};
  for (const t of trades) {
    const raw = t.trade_date || t.closed_at || t.opened_at;
    if (!raw) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) continue;
    if (parsed.toISOString().split('T')[0] !== dateISO) continue;

    const tradePnL = calculateTradePnL(t, { includeFees: true });
    if (tradePnL > 0) wins++;
    else losses++;

    const hourSrc = t.opened_at || t.closed_at;
    if (hourSrc) {
      const h = new Date(hourSrc).getHours();
      if (!Number.isNaN(h)) {
        const bucket = `${String(h).padStart(2, '0')}:00`;
        hourBuckets[bucket] = (hourBuckets[bucket] || 0) + 1;
      }
    }
  }

  let topHourLabel: string | null = null;
  const entries = Object.entries(hourBuckets);
  if (entries.length > 0) {
    entries.sort((a, b) => b[1] - a[1]);
    const [topBucket, topCount] = entries[0];
    if (topCount >= 2) {
      const startH = parseInt(topBucket.split(':')[0], 10);
      const endH = (startH + 2) % 24;
      topHourLabel = `${String(startH).padStart(2, '0')}:00–${String(endH).padStart(2, '0')}:00`;
    }
  }

  return { wins, losses, topHourLabel };
}

// Returns the trades that compose the current streak, oldest→newest
function getStreakTrades(trades: Trade[], streak: { type: 'win' | 'loss'; count: number }): Trade[] {
  if (!trades || trades.length === 0 || streak.count === 0) return [];
  const sorted = [...trades].sort((a, b) => getTradeTimestamp(a) - getTradeTimestamp(b));
  const tail = sorted.slice(-streak.count);
  // Sanity check: filter only trades that match the streak type
  return tail.filter((t) => {
    const pnl = calculateTradePnL(t, { includeFees: true });
    return streak.type === 'win' ? pnl > 0 : pnl <= 0;
  });
}

// ── Main Component ──────────────────────────────────────────────
export const PerformanceHighlights = memo(({
  trades,
  bestTrade,
  worstTrade,
  currentStreak,
}: PerformanceHighlightsProps) => {
  // Translation hook kept for parity / future i18n keys
  useTranslation();

  if (!trades || trades.length === 0 || !bestTrade || !worstTrade) return null;

  const { best: bestDay, worst: worstDay } = findBestWorstDays(trades);
  const bestTradePnL = calculateTradePnL(bestTrade, { includeFees: true });
  const worstTradePnL = calculateTradePnL(worstTrade, { includeFees: true });
  const isSameDay = bestDay && worstDay && bestDay.date === worstDay.date;

  // Streak trades + record check + average-loss for worst-trade context
  const streakTrades = useMemo(
    () => getStreakTrades(trades, currentStreak),
    [trades, currentStreak]
  );

  const { isBestRecord, avgLossAbs } = useMemo(() => {
    let maxPnL = -Infinity;
    let lossSum = 0;
    let lossCount = 0;
    for (const t of trades) {
      const p = calculateTradePnL(t, { includeFees: true });
      if (p > maxPnL) maxPnL = p;
      if (p < 0) {
        lossSum += Math.abs(p);
        lossCount++;
      }
    }
    return {
      isBestRecord: maxPnL <= bestTradePnL + 0.0001,
      avgLossAbs: lossCount > 0 ? lossSum / lossCount : 0,
    };
  }, [trades, bestTradePnL]);

  const bestDayStats = useMemo(
    () => (bestDay ? buildDayStats(trades, bestDay.date) : null),
    [trades, bestDay]
  );
  const worstDayStats = useMemo(
    () => (worstDay ? buildDayStats(trades, worstDay.date) : null),
    [trades, worstDay]
  );

  return (
    <PremiumCard className="h-full flex flex-col" contentClassName="flex-1 p-3 overflow-y-auto">
      <div className="text-xs font-semibold text-space-100 mb-3">
        Performance Highlights
      </div>

      <div className="space-y-2">
        {/* Streak */}
        <StreakDisplay streak={currentStreak} recentStreakTrades={streakTrades} />

        {/* Best / Worst Trade */}
        <div className="grid grid-cols-2 gap-2">
          <TradeCard
            type="best"
            trade={bestTrade}
            pnl={bestTradePnL}
            isHistoricalRecord={isBestRecord}
          />
          <TradeCard
            type="worst"
            trade={worstTrade}
            pnl={worstTradePnL}
            isOversized={Math.abs(worstTradePnL) > 2 * avgLossAbs && avgLossAbs > 0}
            avgLossAbs={avgLossAbs}
          />
        </div>

        {/* Best / Worst Day */}
        <div className="grid grid-cols-2 gap-2">
          {bestDay
            ? (
              <DayCard
                type="best"
                date={bestDay.date}
                pnl={bestDay.totalPnL}
                tradeCount={bestDay.tradeCount}
                wins={bestDayStats?.wins}
                losses={bestDayStats?.losses}
                topHourLabel={bestDayStats?.topHourLabel ?? null}
              />
            )
            : <DayCard type="best" date={null} pnl={null} />}
          {bestDay && worstDay && !isSameDay
            ? (
              <DayCard
                type="worst"
                date={worstDay.date}
                pnl={worstDay.totalPnL}
                tradeCount={worstDay.tradeCount}
                wins={worstDayStats?.wins}
                losses={worstDayStats?.losses}
                topHourLabel={worstDayStats?.topHourLabel ?? null}
              />
            )
            : bestDay
              ? (
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.02] flex items-center justify-center">
                  <span className="text-[10px] text-space-400 text-center">
                    Only one<br />trading day
                  </span>
                </div>
              )
              : <DayCard type="worst" date={null} pnl={null} />}
        </div>
      </div>
    </PremiumCard>
  );
});

PerformanceHighlights.displayName = 'PerformanceHighlights';
