import { memo, useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Clock, DollarSign, Activity, Calendar, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatNumber';
import { formatHoldingTime, analyzeDayPerformance } from '@/utils/insightCalculations';
import { calculateTradePnL } from '@/utils/pnl';
import type { Trade } from '@/types/trade';
import { useTranslation } from '@/hooks/useTranslation';

interface BehaviorAnalyticsProps {
  trades: Trade[];
  currentEquity?: number;
  currentStreak?: { type: 'win' | 'loss'; count: number };
}

// ── helpers (defensive) ──────────────────────────────────────────────────────
const getTradeDurationMin = (t: Trade): number | null => {
  if (typeof t.duration_minutes === 'number' && t.duration_minutes > 0) return t.duration_minutes;
  if (typeof t.duration_hours === 'number' && t.duration_hours > 0) return t.duration_hours * 60;
  const o = t.opened_at ? new Date(t.opened_at).getTime() : NaN;
  const c = t.closed_at ? new Date(t.closed_at).getTime() : NaN;
  if (!Number.isNaN(o) && !Number.isNaN(c) && c > o) return (c - o) / 60000;
  return null;
};

const getTradeSize = (t: Trade): number => {
  if (typeof t.position_size === 'number' && t.position_size > 0) return t.position_size;
  const m = t.margin || 0;
  const l = t.leverage || 1;
  return m * l;
};

// ISO week key like "2026-W17"
const getISOWeekKey = (d: Date): string => {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const BehaviorAnalytics = memo(({ trades, currentEquity, currentStreak }: BehaviorAnalyticsProps) => {
  const { t } = useTranslation();

  // ── Holding time block ────────────────────────────────────────────────────
  const holdingStats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { avgMin: null as number | null, minMin: null as number | null, maxMin: null as number | null, buckets: { scalp: 0, day: 0, swing: 0 }, sweetSpot: null as { label: string; wr: number } | null };
    }
    const mins: number[] = [];
    const byBucket: Record<'scalp' | 'day' | 'swing', { wins: number; total: number }> = {
      scalp: { wins: 0, total: 0 },
      day: { wins: 0, total: 0 },
      swing: { wins: 0, total: 0 },
    };
    for (const tr of trades) {
      const m = getTradeDurationMin(tr);
      if (m == null || !Number.isFinite(m) || m <= 0) continue;
      mins.push(m);
      const bucket: 'scalp' | 'day' | 'swing' = m < 60 ? 'scalp' : m < 8 * 60 ? 'day' : 'swing';
      byBucket[bucket].total += 1;
      const pnl = calculateTradePnL(tr, { includeFees: true });
      if (pnl > 0) byBucket[bucket].wins += 1;
    }
    if (mins.length === 0) {
      return { avgMin: null, minMin: null, maxMin: null, buckets: { scalp: 0, day: 0, swing: 0 }, sweetSpot: null };
    }
    const total = mins.length;
    const buckets = {
      scalp: (byBucket.scalp.total / total) * 100,
      day: (byBucket.day.total / total) * 100,
      swing: (byBucket.swing.total / total) * 100,
    };
    // sweet spot — bucket with highest WR (min 2 trades to count)
    const labels: Record<'scalp' | 'day' | 'swing', string> = { scalp: '<1h', day: '1-8h', swing: '>8h' };
    let sweetSpot: { label: string; wr: number } | null = null;
    (['scalp', 'day', 'swing'] as const).forEach((k) => {
      const b = byBucket[k];
      if (b.total < 2) return;
      const wr = (b.wins / b.total) * 100;
      if (!sweetSpot || wr > sweetSpot.wr) sweetSpot = { label: labels[k], wr };
    });
    return {
      avgMin: mins.reduce((a, b) => a + b, 0) / mins.length,
      minMin: Math.min(...mins),
      maxMin: Math.max(...mins),
      buckets,
      sweetSpot,
    };
  }, [trades]);

  // ── Position size block ───────────────────────────────────────────────────
  const sizeStats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { avg: 0, min: 0, max: 0, riskPct: null as number | null, trendPct: null as number | null };
    }
    const sizes = trades.map(getTradeSize).filter((s) => Number.isFinite(s) && s > 0);
    if (sizes.length === 0) {
      return { avg: 0, min: 0, max: 0, riskPct: null, trendPct: null };
    }
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    const riskPct = currentEquity && currentEquity > 0 ? (avg / currentEquity) * 100 : null;

    // Trend: most recent 5 vs older avg
    let trendPct: number | null = null;
    if (trades.length >= 8) {
      const sorted = [...trades].sort((a, b) => {
        const da = new Date(a.trade_date || a.closed_at || a.opened_at || 0).getTime();
        const db = new Date(b.trade_date || b.closed_at || b.opened_at || 0).getTime();
        return db - da;
      });
      const recent = sorted.slice(0, 5).map(getTradeSize).filter((s) => s > 0);
      const older = sorted.slice(5).map(getTradeSize).filter((s) => s > 0);
      if (recent.length >= 3 && older.length >= 3) {
        const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const oAvg = older.reduce((a, b) => a + b, 0) / older.length;
        if (oAvg > 0) trendPct = ((rAvg - oAvg) / oAvg) * 100;
      }
    }
    return { avg, min, max, riskPct, trendPct };
  }, [trades, currentEquity]);

  // ── Leverage block ────────────────────────────────────────────────────────
  const leverageStats = useMemo(() => {
    if (!trades || trades.length === 0) return { avg: 0, highPct: 0, total: 0 };
    const total = trades.length;
    const sum = trades.reduce((s, tr) => s + (tr.leverage || 1), 0);
    const high = trades.filter((tr) => (tr.leverage || 0) > 10).length;
    return { avg: sum / total, highPct: (high / total) * 100, total };
  }, [trades]);

  const leverageTier: 'safe' | 'amber' | 'red' | 'extreme' = useMemo(() => {
    const v = leverageStats.avg;
    if (v <= 5) return 'safe';
    if (v <= 10) return 'amber';
    if (v <= 20) return 'red';
    return 'extreme';
  }, [leverageStats.avg]);

  const leverageColor =
    leverageTier === 'safe' ? 'text-apple-green'
    : leverageTier === 'amber' ? 'text-apple-orange'
    : leverageTier === 'red' ? 'text-apple-red'
    : 'text-apple-red';

  // ── Best / Worst day with weekly fallback ─────────────────────────────────
  const dayPerf = useMemo(() => analyzeDayPerformance(trades || []), [trades]);

  const bestWorstByDay = useMemo(() => {
    if (!dayPerf || dayPerf.length === 0) return null;
    const sorted = [...dayPerf].sort((a, b) => b.totalPnL - a.totalPnL);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  }, [dayPerf]);

  const bestWorstByWeek = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    const weekly: Record<string, { pnl: number; trades: number; wins: number }> = {};
    for (const tr of trades) {
      const raw = tr.trade_date || tr.closed_at || tr.opened_at;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = getISOWeekKey(d);
      if (!weekly[key]) weekly[key] = { pnl: 0, trades: 0, wins: 0 };
      const pnl = calculateTradePnL(tr, { includeFees: true });
      weekly[key].pnl += pnl;
      weekly[key].trades += 1;
      if (pnl > 0) weekly[key].wins += 1;
    }
    const arr = Object.entries(weekly).map(([key, v]) => ({ key, ...v }));
    if (arr.length < 2) return null;
    arr.sort((a, b) => b.pnl - a.pnl);
    return { best: arr[0], worst: arr[arr.length - 1] };
  }, [trades]);

  // Empty state ----------------------------------------------------------------
  if (!trades || trades.length === 0) {
    return (
      <PremiumCard className="h-full bg-card border-border">
        <div className="p-3 text-center py-4">
          <p className="text-xs text-muted-foreground">{t('insights.noDataAvailable') || 'No data available'}</p>
        </div>
      </PremiumCard>
    );
  }

  // Render helpers
  const renderDash = () => <span className="text-space-400">—</span>;

  // Streak chip
  const streakChip = currentStreak && currentStreak.count > 0 ? (
    currentStreak.type === 'win' ? (
      <span className="chip-green text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <span>{currentStreak.count}W streak</span>
      </span>
    ) : (
      <span className="chip-red text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <span>Cold {currentStreak.count}L</span>
      </span>
    )
  ) : null;

  // Position size markers (linear scale between min and max)
  const sizeRange = sizeStats.max - sizeStats.min;
  const avgPct = sizeRange > 0 ? ((sizeStats.avg - sizeStats.min) / sizeRange) * 100 : 50;

  // Leverage marker on safety bar (1x - 25x clamp)
  const leverageMarkerPct = Math.min(100, Math.max(0, ((leverageStats.avg - 1) / 24) * 100));

  return (
    <PremiumCard className="h-full bg-card border-border flex flex-col overflow-hidden">
      <div className="p-3 flex flex-col h-full overflow-hidden gap-2">
        {/* 2x3 grid */}
        <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0">

          {/* ── Holding Time ── */}
          <div className="card-premium p-2.5 flex flex-col items-center text-center min-h-0 gap-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] text-muted-foreground">Holding time</span>
            </div>
            <span className={`text-sm font-bold font-num tabular-nums ${holdingStats.avgMin == null ? 'text-space-400' : ''}`}>
              {formatHoldingTime(holdingStats.avgMin)}
            </span>
            {holdingStats.avgMin != null ? (
              <>
                {/* Distribution mini-bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-muted/40">
                  {holdingStats.buckets.scalp > 0 && (
                    <div className="h-full bg-apple-green/70" style={{ width: `${holdingStats.buckets.scalp}%`, backgroundColor: 'hsl(var(--apple-green))' }} title={`Scalp <1h: ${holdingStats.buckets.scalp.toFixed(0)}%`} />
                  )}
                  {holdingStats.buckets.day > 0 && (
                    <div className="h-full" style={{ width: `${holdingStats.buckets.day}%`, backgroundColor: 'hsl(var(--electric-blue))' }} title={`Day 1-8h: ${holdingStats.buckets.day.toFixed(0)}%`} />
                  )}
                  {holdingStats.buckets.swing > 0 && (
                    <div className="h-full" style={{ width: `${holdingStats.buckets.swing}%`, backgroundColor: 'hsl(var(--apple-purple))' }} title={`Swing >8h: ${holdingStats.buckets.swing.toFixed(0)}%`} />
                  )}
                </div>
                <div className="flex items-center justify-between w-full text-[8px] text-space-300 font-num tabular-nums">
                  <span>Fastest: {holdingStats.minMin != null ? formatHoldingTime(holdingStats.minMin) : '—'}</span>
                  <span>Longest: {holdingStats.maxMin != null ? formatHoldingTime(holdingStats.maxMin) : '—'}</span>
                </div>
                {holdingStats.sweetSpot && (
                  <span className="text-[8px] text-electric truncate w-full">
                    Sweet spot: {holdingStats.sweetSpot.label} ({holdingStats.sweetSpot.wr.toFixed(0)}% WR)
                  </span>
                )}
              </>
            ) : (
              <span className="text-[8px] text-space-400">Add timestamps to trades</span>
            )}
          </div>

          {/* ── Avg Position Size ── */}
          <div className="card-premium p-2.5 flex flex-col items-center text-center min-h-0 gap-1">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] text-muted-foreground">Position size</span>
            </div>
            <span className="text-sm font-bold font-num tabular-nums">
              {sizeStats.avg > 0 ? formatCurrency(sizeStats.avg) : renderDash()}
            </span>
            {sizeStats.avg > 0 ? (
              <>
                {/* Range bar with min-avg-max markers */}
                <div className="relative w-full h-1.5 rounded-full bg-muted/40">
                  <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(to right, hsl(var(--apple-green) / 0.3), hsl(var(--apple-orange) / 0.3))' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-apple-green border border-background" style={{ left: '0%' }} title={`Min ${formatCurrency(sizeStats.min)}`} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-electric border border-background" style={{ left: `calc(${avgPct}% - 4px)` }} title={`Avg ${formatCurrency(sizeStats.avg)}`} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-apple-orange border border-background" style={{ left: 'calc(100% - 6px)' }} title={`Max ${formatCurrency(sizeStats.max)}`} />
                </div>
                <div className="flex items-center justify-between w-full text-[8px] text-space-300 font-num tabular-nums">
                  <span>{formatCurrency(sizeStats.min)}</span>
                  <span>{formatCurrency(sizeStats.max)}</span>
                </div>
                <div className="text-[8px] text-space-300 font-num tabular-nums w-full text-center">
                  {sizeStats.riskPct != null ? `Risk/trade: ${sizeStats.riskPct.toFixed(1)}%` : 'Risk/trade: —'}
                </div>
                {sizeStats.trendPct != null && Math.abs(sizeStats.trendPct) >= 5 && (
                  <span className={`text-[8px] truncate w-full ${sizeStats.trendPct > 0 ? 'text-apple-orange' : 'text-apple-green'}`}>
                    {sizeStats.trendPct > 0 ? `Sizing up ↗ +${sizeStats.trendPct.toFixed(0)}%` : `Sizing down ↘ ${sizeStats.trendPct.toFixed(0)}%`}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[8px] text-space-400">Need position data</span>
            )}
          </div>

          {/* ── Avg Leverage ── */}
          <div className="card-premium p-2.5 flex flex-col items-center text-center min-h-0 gap-1">
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] text-muted-foreground">Avg leverage</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold font-num tabular-nums ${leverageColor}`}>
                {leverageStats.avg > 0 ? `${leverageStats.avg.toFixed(1)}x` : '—'}
              </span>
              {leverageStats.avg > 10 && (
                <span className="chip-red text-[8px] px-1 py-0.5 rounded-full inline-flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>HIGH</span>
                </span>
              )}
            </div>
            {leverageStats.avg > 0 && (
              <>
                {/* Safety scale bar */}
                <div className="relative w-full h-1.5 rounded-full overflow-hidden flex bg-muted/40">
                  <div style={{ width: '20%', backgroundColor: 'hsl(var(--apple-green) / 0.6)' }} />
                  <div style={{ width: '40%', backgroundColor: 'hsl(var(--apple-orange) / 0.5)' }} />
                  <div style={{ width: '40%', backgroundColor: 'hsl(var(--apple-red) / 0.6)' }} />
                  {/* Marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-background"
                    style={{ left: `calc(${leverageMarkerPct}% - 4px)`, backgroundColor: 'hsl(var(--foreground))' }}
                    title={`${leverageStats.avg.toFixed(1)}x`}
                  />
                </div>
                <div className="flex items-center justify-between w-full text-[8px] text-space-300 font-num tabular-nums">
                  <span>1x</span>
                  <span>5x</span>
                  <span>20x+</span>
                </div>
                <span className="text-[8px] text-space-300 font-num tabular-nums w-full text-center">
                  Used 10x+: {leverageStats.highPct.toFixed(0)}%
                </span>
                <span className="text-[8px] text-space-300 w-full text-center">Recommended: under 10x</span>
              </>
            )}
          </div>

          {/* ── Best Day / Best Week ── */}
          {bestWorstByDay ? (
            <div className="p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col items-center justify-center text-center min-h-0">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-profit" />
                <span className="text-[9px] text-muted-foreground">Best day</span>
              </div>
              <span className="text-xs font-bold text-profit truncate w-full">{bestWorstByDay.best.day}</span>
              <span className="text-[10px] font-num tabular-nums text-apple-green">{formatCurrency(bestWorstByDay.best.totalPnL)}</span>
              <span className="text-[8px] text-space-300 font-num tabular-nums">
                {bestWorstByDay.best.tradeCount}t · {bestWorstByDay.best.wins}W/{bestWorstByDay.best.losses}L
              </span>
            </div>
          ) : bestWorstByWeek ? (
            <div className="p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col items-center justify-center text-center min-h-0">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-profit" />
                <span className="text-[9px] text-muted-foreground">Best week</span>
              </div>
              <span className="text-xs font-bold text-profit truncate w-full">{bestWorstByWeek.best.key}</span>
              <span className="text-[10px] font-num tabular-nums text-apple-green">{formatCurrency(bestWorstByWeek.best.pnl)}</span>
              <span className="text-[8px] text-space-300 font-num tabular-nums">{bestWorstByWeek.best.trades}t · {bestWorstByWeek.best.wins}W</span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
              <TrendingUp className="w-3.5 h-3.5 text-space-400 mb-0.5" />
              <span className="text-[9px] text-space-400 leading-tight">No daily breakdown yet — add trades on different days</span>
            </div>
          )}

          {/* ── Worst Day / Worst Week ── */}
          {bestWorstByDay ? (
            <div className="p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col items-center justify-center text-center min-h-0">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-loss" />
                <span className="text-[9px] text-muted-foreground">Worst day</span>
              </div>
              <span className="text-xs font-bold text-loss truncate w-full">{bestWorstByDay.worst.day}</span>
              <span className="text-[10px] font-num tabular-nums text-apple-red">{formatCurrency(bestWorstByDay.worst.totalPnL)}</span>
              <span className="text-[8px] text-space-300 font-num tabular-nums">
                {bestWorstByDay.worst.tradeCount}t · {bestWorstByDay.worst.wins}W/{bestWorstByDay.worst.losses}L
              </span>
            </div>
          ) : bestWorstByWeek ? (
            <div className="p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col items-center justify-center text-center min-h-0">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-loss" />
                <span className="text-[9px] text-muted-foreground">Worst week</span>
              </div>
              <span className="text-xs font-bold text-loss truncate w-full">{bestWorstByWeek.worst.key}</span>
              <span className="text-[10px] font-num tabular-nums text-apple-red">{formatCurrency(bestWorstByWeek.worst.pnl)}</span>
              <span className="text-[8px] text-space-300 font-num tabular-nums">{bestWorstByWeek.worst.trades}t · {bestWorstByWeek.worst.wins}W</span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
              <TrendingDown className="w-3.5 h-3.5 text-space-400 mb-0.5" />
              <span className="text-[9px] text-space-400 leading-tight">Add at least 2 trades on different days</span>
            </div>
          )}

          {/* ── Trades + streak ── */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0 gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-bold font-num tabular-nums">{trades.length}</span>
            <span className="text-[9px] text-muted-foreground">Trades</span>
            {streakChip}
          </div>
        </div>

        {/* ── Urgent leverage warning panel ── */}
        {leverageStats.avg > 20 && (
          <div className="glow-box-danger p-2 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-apple-red flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-apple-red uppercase tracking-wide">Liquidation risk extreme</span>
              <span className="text-[9px] text-space-300 leading-snug">
                At {leverageStats.avg.toFixed(1)}x avg leverage, a 5% adverse move wipes you out. Consider scaling down to under 10x.
              </span>
            </div>
          </div>
        )}
      </div>
    </PremiumCard>
  );
});

BehaviorAnalytics.displayName = 'BehaviorAnalytics';
