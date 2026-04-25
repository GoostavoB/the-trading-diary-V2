import { memo, useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { getRiskRewardRatio } from '@/utils/insightCalculations';
import { calculateTradePnL } from '@/utils/pnl';
import type { Trade } from '@/types/trade';

interface TradingQualityMetricsProps {
  avgWin: number;
  avgLoss: number;
  winCount: number;
  lossCount: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  trades?: Trade[];
  currentStreak?: { type: 'win' | 'loss'; count: number };
}

// ── Helpers ────────────────────────────────────────────────────
const formatUsd = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
};

const fmtShortDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── Risk/Reward Visual Scale ────────────────────────────────────
function RRScale({ value, avgWin, avgLoss }: { value: number; avgWin: number; avgLoss: number }) {
  const clamp = Math.min(value, 4);
  const isGood = value >= 1.5;
  const isOk = value >= 1;

  const tone = isGood ? 'text-emerald-400' : isOk ? 'text-amber-400' : 'text-rose-400';
  const chipClass = isGood ? 'chip-green' : isOk ? 'chip-orange' : 'chip-red';
  const status = isGood ? '✓ Strong' : isOk ? '⚠ Marginal' : '✕ Below break-even';
  const tooltip = `You risk ${formatUsd(avgLoss)} to make ${formatUsd(avgWin)} on average. Target: ≥1:1.5 for consistent edge.`;

  // Position of 1.5x target marker on a 0..4 visual scale
  const targetPct = (1.5 / 4) * 100;
  const valuePct = (clamp / 4) * 100;

  return (
    <div className="space-y-1.5" title={tooltip}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-xl font-black tabular-nums font-num text-gradient-electric')}>
          {value.toFixed(2)}
        </span>
        <span className="text-[10px] text-muted-foreground/50">: 1</span>
      </div>

      {/* Horizontal scale: risk fixed left, reward grows right, with 1.5 marker */}
      <div className="relative h-2 w-full rounded-full bg-white/5 overflow-visible">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
            isGood
              ? 'bg-emerald-400/60'
              : isOk
                ? 'bg-amber-400/60'
                : 'bg-rose-500/60',
          )}
          style={{ width: `${valuePct}%` }}
        />
        {/* 1.5 target marker */}
        <div
          className="absolute -top-0.5 h-3 w-px bg-white/40"
          style={{ left: `${targetPct}%` }}
          aria-hidden
        />
        <div
          className="absolute -bottom-3 -translate-x-1/2 text-[8px] text-muted-foreground/50 font-mono"
          style={{ left: `${targetPct}%` }}
        >
          1.5
        </div>
      </div>

      <div className="flex justify-between items-baseline pt-2 text-[9px] tabular-nums">
        <span className="text-rose-400/80 font-num">Risk {formatUsd(avgLoss)}</span>
        <span className="text-emerald-400/80 font-num">Reward {formatUsd(avgWin)}</span>
      </div>

      <div className={cn('inline-flex items-center text-[9px] font-semibold', tone)}>
        <span className={cn(chipClass, 'px-1.5 py-0.5 rounded-full')}>{status}</span>
      </div>
    </div>
  );
}

// ── W/L Balance Bar ─────────────────────────────────────────────
function WLBalance({
  winCount,
  lossCount,
  monthDelta,
  currentStreak,
}: {
  winCount: number;
  lossCount: number;
  monthDelta: number | null;
  currentStreak?: { type: 'win' | 'loss'; count: number };
}) {
  const total = winCount + lossCount;
  const winPct = total > 0 ? (winCount / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-emerald-400 text-xl font-black tabular-nums font-num">{winCount}</span>
        <span className="text-[10px] text-muted-foreground/40 font-mono">W / L</span>
        <span className="text-rose-400 text-xl font-black tabular-nums font-num">{lossCount}</span>
      </div>

      {/* Split bar with absolute counts */}
      <div className="relative h-3 w-full rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-400/60 transition-all duration-700 rounded-l-full flex items-center justify-center"
          style={{ width: `${winPct}%` }}
        >
          {winPct >= 18 && (
            <span className="text-[8px] font-black text-emerald-950 tabular-nums">{winCount}</span>
          )}
        </div>
        <div
          className="h-full bg-rose-500/50 transition-all duration-700 rounded-r-full flex items-center justify-center"
          style={{ width: `${100 - winPct}%` }}
        >
          {100 - winPct >= 18 && (
            <span className="text-[8px] font-black text-rose-950 tabular-nums">{lossCount}</span>
          )}
        </div>
      </div>

      <div className="flex justify-between text-[9px] text-muted-foreground/40 font-num">
        <span>{winPct.toFixed(0)}% wins</span>
        <span>{(100 - winPct).toFixed(0)}% losses</span>
      </div>

      {monthDelta !== null && (
        <div
          className={cn(
            'text-[9px] font-semibold',
            monthDelta > 0 ? 'text-emerald-400' : monthDelta < 0 ? 'text-rose-400' : 'text-muted-foreground/50',
          )}
        >
          {monthDelta > 0 ? '📈' : monthDelta < 0 ? '📉' : '•'} {monthDelta > 0 ? '+' : ''}
          {monthDelta.toFixed(0)}% vs last month
        </div>
      )}

      {currentStreak && currentStreak.count > 0 && (
        <span
          className={cn(
            'inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
            currentStreak.type === 'win' ? 'chip-green' : 'chip-red',
          )}
        >
          Current: {currentStreak.count}
          {currentStreak.type === 'win' ? 'W' : 'L'} streak
        </span>
      )}
    </div>
  );
}

// ── Drawdown Meter ──────────────────────────────────────────────
function DrawdownMeter({
  pct,
  peakDate,
  troughDate,
  recoveredInDays,
  inDrawdown,
}: {
  pct: number;
  peakDate: Date | null;
  troughDate: Date | null;
  recoveredInDays: number | null;
  inDrawdown: boolean;
}) {
  const isLow = pct < 5;
  const isMed = pct < 10;

  const color = isLow ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400';
  const barColor = isLow
    ? 'bg-emerald-400/60'
    : isMed
      ? 'bg-amber-400/60'
      : 'bg-rose-500/70';
  const label = isLow ? 'Controlled' : isMed ? 'Moderate' : 'High Risk';

  const dateSpan =
    peakDate && troughDate ? `${fmtShortDate(peakDate)}–${fmtShortDate(troughDate)}` : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-xl font-black tabular-nums font-num', color)}>
          -{pct.toFixed(1)}%
        </span>
      </div>

      {dateSpan && (
        <div className="text-[9px] text-muted-foreground/60 font-mono">{dateSpan}</div>
      )}

      {/* Risk meter — colored by severity */}
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${Math.min((pct / 40) * 100, 100)}%` }}
        />
      </div>

      <div className={cn('text-[9px] font-semibold tracking-wider', color)}>{label}</div>

      {recoveredInDays !== null ? (
        <div className="text-[9px] text-emerald-400/80">Recovered in: {recoveredInDays}d</div>
      ) : inDrawdown ? (
        <div className="text-[9px] text-amber-400/80">🔵 Currently in drawdown</div>
      ) : null}

      <div className="text-[9px] text-muted-foreground/40">Target: keep under 10%</div>
    </div>
  );
}

// ── Avg Win / Avg Loss Cell ─────────────────────────────────────
function AvgWinLossCell({
  avgWin,
  avgLoss,
  winCount,
  lossCount,
}: {
  avgWin: number;
  avgLoss: number;
  winCount: number;
  lossCount: number;
}) {
  const hasWin = avgWin > 0;
  const hasLoss = avgLoss > 0;
  const total = winCount + lossCount;
  const winRate = total > 0 ? winCount / total : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  const positive = expectancy >= 0;

  const maxAbs = Math.max(avgWin, avgLoss, 1);
  const winBarPct = (avgWin / maxAbs) * 100;
  const lossBarPct = (avgLoss / maxAbs) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] text-emerald-400/70 tracking-wider">AVG WIN</span>
        <span
          className={cn(
            'text-sm font-black tabular-nums font-num',
            hasWin ? 'text-emerald-400' : 'text-space-400',
          )}
        >
          {hasWin ? `+${formatUsd(avgWin)}` : '—'}
        </span>
      </div>
      {/* Win bar */}
      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-emerald-400/60 rounded-full transition-all duration-700"
          style={{ width: `${winBarPct}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-[9px] text-rose-400/70 tracking-wider">AVG LOSS</span>
        <span
          className={cn(
            'text-sm font-black tabular-nums font-num',
            hasLoss ? 'text-rose-400' : 'text-space-400',
          )}
        >
          {hasLoss ? `−${formatUsd(avgLoss)}` : '—'}
        </span>
      </div>
      {/* Loss bar */}
      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-rose-500/60 rounded-full transition-all duration-700"
          style={{ width: `${lossBarPct}%` }}
        />
      </div>

      {/* Expectancy */}
      <div className="pt-1.5 border-t border-white/5">
        <div
          className={cn(
            'text-[10px] font-bold tabular-nums font-num',
            positive ? 'text-emerald-400' : 'text-rose-400',
          )}
        >
          Expectancy: {positive ? '+' : '−'}
          {formatUsd(Math.abs(expectancy))} / trade
        </div>
        <div
          className={cn(
            'text-[8px] mt-0.5',
            positive ? 'text-emerald-400/70' : 'text-rose-400/70',
          )}
        >
          {positive ? 'Profitable system' : 'Negative expectancy — review setups'}
        </div>
      </div>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────
function MetricCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
      <div className="text-[9px] font-bold tracking-widest text-space-300 uppercase mb-2.5">
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Drawdown analytics from trades ──────────────────────────────
function computeDrawdownAnalytics(trades: Trade[] | undefined): {
  peakDate: Date | null;
  troughDate: Date | null;
  recoveredInDays: number | null;
  inDrawdown: boolean;
} {
  if (!trades || trades.length === 0) {
    return { peakDate: null, troughDate: null, recoveredInDays: null, inDrawdown: false };
  }

  const chronological = [...trades]
    .map((t) => ({
      date: new Date(t.trade_date || (t as any).closed_at || (t as any).opened_at || 0),
      pnl: calculateTradePnL(t, { includeFees: true }),
    }))
    .filter((t) => !Number.isNaN(t.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (chronological.length === 0) {
    return { peakDate: null, troughDate: null, recoveredInDays: null, inDrawdown: false };
  }

  let cumulative = 0;
  let peak = 0;
  let peakDate: Date | null = null;
  let maxAmount = 0;
  let troughDate: Date | null = null;
  let peakDateAtMaxDD: Date | null = null;
  let peakAtMaxDD = 0;

  for (const t of chronological) {
    cumulative += t.pnl;
    if (cumulative > peak) {
      peak = cumulative;
      peakDate = t.date;
    }
    const drawdown = peak - cumulative;
    if (drawdown > maxAmount) {
      maxAmount = drawdown;
      troughDate = t.date;
      peakDateAtMaxDD = peakDate;
      peakAtMaxDD = peak;
    }
  }

  // Recovery: walk after trough; first time cumulative >= peakAtMaxDD => recovered
  let recoveredInDays: number | null = null;
  let inDrawdown = false;
  if (troughDate && peakDateAtMaxDD && maxAmount > 0) {
    let cum = 0;
    let recoveryDate: Date | null = null;
    for (const t of chronological) {
      cum += t.pnl;
      if (t.date.getTime() > troughDate.getTime() && cum >= peakAtMaxDD) {
        recoveryDate = t.date;
        break;
      }
    }
    if (recoveryDate) {
      const ms = recoveryDate.getTime() - peakDateAtMaxDD.getTime();
      recoveredInDays = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
    } else {
      inDrawdown = true;
    }
  }

  return {
    peakDate: peakDateAtMaxDD,
    troughDate,
    recoveredInDays,
    inDrawdown,
  };
}

// ── Month-over-month win-rate delta ─────────────────────────────
function computeMonthDelta(trades: Trade[] | undefined): number | null {
  if (!trades || trades.length === 0) return null;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastYear = lastMonthDate.getFullYear();

  let wThis = 0,
    lThis = 0,
    wLast = 0,
    lLast = 0;

  for (const t of trades) {
    const d = new Date(t.trade_date || (t as any).closed_at || (t as any).opened_at || 0);
    if (Number.isNaN(d.getTime())) continue;
    const m = d.getMonth();
    const y = d.getFullYear();
    const isWin = (t.profit_loss || 0) > 0;
    if (m === thisMonth && y === thisYear) {
      isWin ? wThis++ : lThis++;
    } else if (m === lastMonth && y === lastYear) {
      isWin ? wLast++ : lLast++;
    }
  }

  const totalThis = wThis + lThis;
  const totalLast = wLast + lLast;
  if (totalThis === 0 || totalLast === 0) return null;
  const wrThis = (wThis / totalThis) * 100;
  const wrLast = (wLast / totalLast) * 100;
  return wrThis - wrLast;
}

// ── Main Component ──────────────────────────────────────────────
export const TradingQualityMetrics = memo(
  ({
    avgWin,
    avgLoss,
    winCount,
    lossCount,
    maxDrawdownPercent,
    maxDrawdownAmount: _maxDrawdownAmount,
    trades,
    currentStreak,
  }: TradingQualityMetricsProps) => {
    const { t: _t } = useTranslation();

    const totalTrades = winCount + lossCount;

    const drawdownInfo = useMemo(() => computeDrawdownAnalytics(trades), [trades]);
    const monthDelta = useMemo(() => computeMonthDelta(trades), [trades]);

    if (totalTrades === 0) {
      return (
        <PremiumCard className="h-full">
          <div className="p-4 text-center py-6">
            <p className="text-xs text-muted-foreground/50">No trades yet</p>
          </div>
        </PremiumCard>
      );
    }

    const riskReward = getRiskRewardRatio(avgWin, avgLoss);

    return (
      <PremiumCard className="h-full flex flex-col" contentClassName="flex-1 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-space-300 uppercase">
            Trading Quality
          </span>
          <span className="text-[9px] text-muted-foreground/30">{totalTrades} trades</span>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1">
          <MetricCell label="Risk / Reward">
            <RRScale value={riskReward} avgWin={avgWin} avgLoss={avgLoss} />
          </MetricCell>

          <MetricCell label="Win / Loss">
            <WLBalance
              winCount={winCount}
              lossCount={lossCount}
              monthDelta={monthDelta}
              currentStreak={currentStreak}
            />
          </MetricCell>

          <MetricCell label="Max Drawdown">
            <DrawdownMeter
              pct={maxDrawdownPercent}
              peakDate={drawdownInfo.peakDate}
              troughDate={drawdownInfo.troughDate}
              recoveredInDays={drawdownInfo.recoveredInDays}
              inDrawdown={drawdownInfo.inDrawdown}
            />
          </MetricCell>

          <MetricCell label="Avg Win / Loss">
            <AvgWinLossCell
              avgWin={avgWin}
              avgLoss={avgLoss}
              winCount={winCount}
              lossCount={lossCount}
            />
          </MetricCell>
        </div>
      </PremiumCard>
    );
  },
);

TradingQualityMetrics.displayName = 'TradingQualityMetrics';
