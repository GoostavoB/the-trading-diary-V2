import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { getRiskRewardRatio } from '@/utils/insightCalculations';

interface TradingQualityMetricsProps {
  avgWin: number;
  avgLoss: number;
  winCount: number;
  lossCount: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
}

// ── Risk/Reward Visual Scale ────────────────────────────────────
function RRScale({ value }: { value: number }) {
  // visual: left bar = risk (always 1), right bar = reward (value)
  const clamp = Math.min(value, 4);
  const isGood = value >= 1.5;
  const isOk = value >= 1;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "text-xl font-black tabular-nums",
          isGood ? "text-emerald-400" : isOk ? "text-amber-400" : "text-rose-400"
        )}>
          {value.toFixed(2)}
        </span>
        <span className="text-[10px] text-muted-foreground/50">:1</span>
      </div>
      {/* Seesaw bars */}
      <div className="flex items-end gap-1 h-8">
        {/* Risk bar — fixed */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <div className="w-full rounded-t-sm bg-rose-500/30 border-t border-rose-500/40"
            style={{ height: '100%' }} />
          <span className="text-[8px] text-muted-foreground/40">RISK</span>
        </div>
        {/* Reward bar — scales with value */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className={cn(
              "w-full rounded-t-sm border-t transition-all duration-700",
              isGood ? "bg-emerald-400/30 border-emerald-400/40"
                : isOk ? "bg-amber-400/30 border-amber-400/40"
                : "bg-rose-500/20 border-rose-500/30"
            )}
            style={{ height: `${Math.min(clamp / 4, 1) * 100}%` }}
          />
          <span className="text-[8px] text-muted-foreground/40">REWARD</span>
        </div>
      </div>
    </div>
  );
}

// ── W/L Balance Bar ─────────────────────────────────────────────
function WLBalance({ winCount, lossCount }: { winCount: number; lossCount: number }) {
  const total = winCount + lossCount;
  const winPct = total > 0 ? (winCount / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-emerald-400 text-xl font-black tabular-nums">{winCount}</span>
        <span className="text-[10px] text-muted-foreground/40 font-mono">W / L</span>
        <span className="text-rose-400 text-xl font-black tabular-nums">{lossCount}</span>
      </div>
      {/* Split bar */}
      <div className="h-2 w-full rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-400/60 transition-all duration-700 rounded-l-full"
          style={{ width: `${winPct}%` }}
        />
        <div
          className="h-full bg-rose-500/50 transition-all duration-700 rounded-r-full"
          style={{ width: `${100 - winPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40">
        <span>{winPct.toFixed(0)}% wins</span>
        <span>{(100 - winPct).toFixed(0)}% losses</span>
      </div>
    </div>
  );
}

// ── Drawdown Meter ──────────────────────────────────────────────
function DrawdownMeter({ pct }: { pct: number }) {
  const isLow = pct <= 10;
  const isMed = pct <= 20;

  const color = isLow ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400';
  const barColor = isLow
    ? 'bg-emerald-400/60'
    : isMed
      ? 'bg-amber-400/60'
      : 'bg-rose-500/70';
  const label = isLow ? 'Controlled' : isMed ? 'Moderate' : 'High Risk';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-xl font-black tabular-nums", color)}>
          -{pct.toFixed(1)}%
        </span>
      </div>
      {/* Risk meter — fills from right (inverse: more = worse) */}
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${Math.min(pct / 40 * 100, 100)}%` }}
        />
      </div>
      <div className={cn("text-[9px] font-semibold tracking-wider", color)}>{label}</div>
    </div>
  );
}

// ── Avg Win / Avg Loss Cell ─────────────────────────────────────
function AvgWinLossCell({ avgWin, avgLoss }: { avgWin: number; avgLoss: number }) {
  const formatUsd = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000) return `$${(n / 1000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };
  const hasWin = avgWin > 0;
  const hasLoss = avgLoss > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] text-emerald-400/70 tracking-wider">AVG WIN</span>
        <span className={cn(
          "text-sm font-black tabular-nums",
          hasWin ? "text-emerald-400" : "text-space-400"
        )}>
          {hasWin ? `+${formatUsd(avgWin)}` : '—'}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] text-rose-400/70 tracking-wider">AVG LOSS</span>
        <span className={cn(
          "text-sm font-black tabular-nums",
          hasLoss ? "text-rose-400" : "text-space-400"
        )}>
          {hasLoss ? `−${formatUsd(avgLoss)}` : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────
function MetricCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
      <div className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2.5">
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export const TradingQualityMetrics = memo(({
  avgWin,
  avgLoss,
  winCount,
  lossCount,
  maxDrawdownPercent,
  maxDrawdownAmount,
}: TradingQualityMetricsProps) => {
  const { t } = useTranslation();

  const totalTrades = winCount + lossCount;
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
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
          Trading Quality
        </span>
        <span className="text-[9px] text-muted-foreground/30">{totalTrades} trades</span>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        <MetricCell label="Risk / Reward">
          <RRScale value={riskReward} />
        </MetricCell>

        <MetricCell label="Win / Loss">
          <WLBalance winCount={winCount} lossCount={lossCount} />
        </MetricCell>

        <MetricCell label="Max Drawdown">
          <DrawdownMeter pct={maxDrawdownPercent} />
        </MetricCell>

        <MetricCell label="Avg Win / Loss">
          <AvgWinLossCell avgWin={avgWin} avgLoss={avgLoss} />
        </MetricCell>
      </div>
    </PremiumCard>
  );
});

TradingQualityMetrics.displayName = 'TradingQualityMetrics';
