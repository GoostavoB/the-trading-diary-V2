import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { formatPercent } from '@/utils/formatNumber';

interface InsightsQuickSummaryProps {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  avgROI: number;
  totalTrades: number;
}

// ── Profit Factor Zone Gauge ───────────────────────────────────
function ProfitFactorGauge({ value }: { value: number }) {
  // Zones: <1 = danger, 1-1.5 = caution, 1.5-2 = good, >2 = elite
  const zones = [
    { label: 'POOR',  color: 'bg-rose-500/70',   width: 22 },
    { label: 'OK',    color: 'bg-amber-400/70',   width: 22 },
    { label: 'GOOD',  color: 'bg-lime-400/70',    width: 22 },
    { label: 'ELITE', color: 'bg-emerald-400/70', width: 22 },
  ];

  // Map value to position: 0→0%, 1→22%, 1.5→44%, 2→66%, 3→88%
  const pct = Math.min(Math.max(value / 3, 0), 1) * 88;

  const getZoneLabel = (v: number) => {
    if (v >= 2) return { text: 'ELITE', color: 'text-emerald-400' };
    if (v >= 1.5) return { text: 'GOOD', color: 'text-lime-400' };
    if (v >= 1) return { text: 'OK', color: 'text-amber-400' };
    return { text: 'POOR', color: 'text-rose-400' };
  };

  const zone = getZoneLabel(value);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tabular-nums text-foreground">{value.toFixed(2)}</span>
        <span className={cn("text-[10px] font-bold tracking-widest", zone.color)}>{zone.text}</span>
      </div>
      {/* Track */}
      <div className="relative h-1.5 w-full rounded-full overflow-hidden flex gap-px">
        {zones.map((z) => (
          <div key={z.label} className={cn("h-full rounded-sm", z.color)} style={{ width: `${z.width}%` }} />
        ))}
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-background shadow-md transition-all duration-700"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40 tracking-wider">
        <span>0</span><span>1</span><span>1.5</span><span>2</span><span>3+</span>
      </div>
    </div>
  );
}

// ── Win Rate Stacked Bar ───────────────────────────────────────
function WinRateBar({ winRate, totalTrades }: { winRate: number; totalTrades: number }) {
  const wins = Math.round((winRate / 100) * totalTrades);
  const losses = totalTrades - wins;

  const getBand = (rate: number) => {
    if (rate >= 65) return { label: 'Excellent', color: 'text-emerald-400' };
    if (rate >= 55) return { label: 'Good', color: 'text-lime-400' };
    if (rate >= 45) return { label: 'Average', color: 'text-amber-400' };
    return { label: 'Below avg', color: 'text-rose-400' };
  };

  const band = getBand(winRate);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tabular-nums text-foreground">{winRate.toFixed(1)}%</span>
        <span className={cn("text-[10px] font-bold tracking-widest", band.color)}>{band.label}</span>
      </div>
      {/* Stacked bar */}
      <div className="h-2 w-full rounded-full overflow-hidden bg-rose-500/20 relative">
        <div
          className="h-full rounded-full bg-emerald-400/70 transition-all duration-700"
          style={{ width: `${winRate}%` }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
          <span className="text-muted-foreground/60">{wins} wins</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500/70" />
          <span className="text-muted-foreground/60">{losses} losses</span>
        </span>
      </div>
    </div>
  );
}

// ── Avg ROI Arc ────────────────────────────────────────────────
function AvgROIRing({ value }: { value: number }) {
  const size = 52;
  const r = 20;
  const circ = 2 * Math.PI * r;
  // Map: -10% → 0%, 0% → 50%, +10% → 100% (clamp)
  const pct = Math.min(Math.max((value + 10) / 20, 0), 1);
  const offset = circ * (1 - pct);
  const isPos = value >= 0;

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={isPos ? 'rgb(52,211,153)' : 'rgb(244,63,94)'}
            strokeOpacity={0.7}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-muted-foreground/50">ROI</span>
        </div>
      </div>
      <div>
        <div className={cn(
          "text-2xl font-black tabular-nums leading-none",
          isPos ? "text-emerald-400" : "text-rose-400"
        )}>
          {isPos ? '+' : ''}{value.toFixed(2)}%
        </div>
        <div className="text-[10px] text-muted-foreground/50 mt-1">avg per trade</div>
      </div>
    </div>
  );
}

// ── Trades Dot Grid ────────────────────────────────────────────
function TradesDotGrid({ totalTrades, winRate }: { totalTrades: number; winRate: number }) {
  const wins = Math.round((winRate / 100) * totalTrades);
  // Show max 35 dots
  const maxDots = Math.min(totalTrades, 35);
  const scaledWins = Math.round((wins / totalTrades) * maxDots);
  const dots = Array.from({ length: maxDots }, (_, i) => i < scaledWins ? 'w' : 'l');

  return (
    <div className="space-y-2">
      <div className="text-2xl font-black tabular-nums text-foreground leading-none">{totalTrades}</div>
      <div className="text-[10px] text-muted-foreground/50">total trades</div>
      {totalTrades > 0 && (
        <div className="flex flex-wrap gap-[3px] mt-1">
          {dots.map((type, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-[2px] transition-opacity",
                type === 'w' ? 'bg-emerald-400/60' : 'bg-rose-500/50'
              )}
            />
          ))}
          {totalTrades > 35 && (
            <span className="text-[9px] text-muted-foreground/40 self-center ml-1">+{totalTrades - 35}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── P&L Card ───────────────────────────────────────────────────
function PnLCard({ totalPnL, totalTrades }: { totalPnL: number; totalTrades: number }) {
  const isPos = totalPnL >= 0;

  return (
    <div className={cn(
      "relative rounded-xl p-4 overflow-hidden border transition-all duration-500",
      isPos
        ? "border-emerald-500/20 bg-emerald-950/20"
        : "border-rose-500/20 bg-rose-950/20"
    )}>
      {/* Aura */}
      <div className={cn(
        "absolute inset-0 opacity-30 pointer-events-none",
        isPos
          ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(142_70%_40%/0.3),transparent)]"
          : "bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(0_84%_40%/0.3),transparent)]"
      )} />

      <div className="relative space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          Total P&L
        </div>
        <div className={cn(
          "text-3xl font-black tabular-nums leading-none",
          isPos ? "text-emerald-300" : "text-rose-300"
        )}>
          <BlurredCurrency amount={totalPnL} className="inline" />
        </div>
        <div className="text-[10px] text-muted-foreground/40">
          across {totalTrades} trades
        </div>
        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-px",
          isPos ? "bg-emerald-400/30" : "bg-rose-400/30"
        )} />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export const InsightsQuickSummary = memo(({
  totalPnL,
  winRate,
  profitFactor,
  avgROI,
  totalTrades,
}: InsightsQuickSummaryProps) => {
  const { t } = useTranslation();

  const cardBase = "rounded-xl p-4 border border-white/8 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-white/14 hover:bg-card/80";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

      {/* 1 — P&L (spans 2 on mobile, 1 on md+) */}
      <div className="col-span-2 md:col-span-1">
        <PnLCard totalPnL={totalPnL} totalTrades={totalTrades} />
      </div>

      {/* 2 — Win Rate */}
      <div className={cardBase}>
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
          {t('dashboard.winRate')}
        </div>
        <WinRateBar winRate={winRate} totalTrades={totalTrades} />
      </div>

      {/* 3 — Profit Factor */}
      <div className={cardBase}>
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
          {t('dashboard.profitFactor')}
        </div>
        <ProfitFactorGauge value={profitFactor} />
      </div>

      {/* 4 — Avg ROI */}
      <div className={cardBase}>
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
          {t('dashboard.avgROI')}
        </div>
        <AvgROIRing value={avgROI} />
      </div>

      {/* 5 — Total Trades */}
      <div className={cardBase}>
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
          {t('dashboard.totalTrades')}
        </div>
        <TradesDotGrid totalTrades={totalTrades} winRate={winRate} />
      </div>

    </div>
  );
});

InsightsQuickSummary.displayName = 'InsightsQuickSummary';
