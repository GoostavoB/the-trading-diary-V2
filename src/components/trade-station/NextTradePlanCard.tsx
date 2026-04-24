import { useMemo } from 'react';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Target, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Small complementary card for the Trade Station tab.
 * Surfaces a quick plan for the user's next trade based on current
 * equity, their chosen risk-per-trade % and remaining daily loss budget.
 */
export function NextTradePlanCard() {
  const {
    calculation,
    riskPercent,
    base,
    entryPrice,
    stopPrice,
    currentEquity,
    initialCapital,
    loading,
  } = useRiskCalculator();

  const { todaysPnL, remaining: remainingDailyBudget, isLocked } = useDailyLossLock(
    calculation.dailyLossLimit,
  );
  const { formatAmount } = useCurrency();

  const baseValue = useMemo(() => {
    if (base === 'initial') return initialCapital;
    if (base === 'profit') return Math.max(0, currentEquity - initialCapital);
    return currentEquity;
  }, [base, currentEquity, initialCapital]);

  // Suggested max stop distance (%) if user risks `riskPercent`% of their base
  // on the smallest reasonable position. Falls back to "—" if no entry/stop set.
  const stopDistancePct = useMemo(() => {
    if (!entryPrice || !stopPrice || entryPrice === stopPrice) return null;
    return (Math.abs(entryPrice - stopPrice) / entryPrice) * 100;
  }, [entryPrice, stopPrice]);

  // Next-trade stop max = min(risk per trade, remaining daily budget)
  const nextTradeStopMax = useMemo(() => {
    if (isLocked) return 0;
    return Math.min(calculation.riskPerTrade, remainingDailyBudget);
  }, [calculation.riskPerTrade, remainingDailyBudget, isLocked]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/8 bg-card/70 backdrop-blur-xl p-3">
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const hasEquity = baseValue > 0;

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden relative',
        'border border-white/8 bg-card/70 backdrop-blur-xl',
        'hover:border-white/14 transition-colors duration-300',
        'p-3',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-primary/80" />
          <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            Plan for next entry
          </span>
        </div>
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
            Lock on
          </span>
        ) : todaysPnL < 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
            Recovering
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            Clear
          </span>
        )}
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Current equity"
          value={hasEquity ? formatAmount(currentEquity) : '—'}
          icon={<TrendingUp className="h-3 w-3" />}
        />
        <Metric
          label={`Risk / trade (${riskPercent.toFixed(1)}%)`}
          value={hasEquity ? formatAmount(calculation.riskPerTrade) : '—'}
        />
        <Metric
          label="Daily budget left"
          value={hasEquity ? formatAmount(remainingDailyBudget) : '—'}
          tone={isLocked ? 'red' : remainingDailyBudget <= 0 ? 'red' : 'default'}
        />
        <Metric
          label="Next-trade stop max"
          value={hasEquity ? formatAmount(nextTradeStopMax) : '—'}
          tone={nextTradeStopMax > 0 ? 'green' : 'red'}
          icon={<Activity className="h-3 w-3" />}
        />
        <Metric
          label="Stop distance"
          value={stopDistancePct != null ? `${stopDistancePct.toFixed(2)}%` : '—'}
        />
        <Metric
          label="Est. position size"
          value={
            calculation.positionSize != null
              ? calculation.positionSize.toFixed(4)
              : '—'
          }
        />
      </div>

      {!hasEquity && (
        <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
          Add your starting capital in Settings to unlock the plan.
        </p>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'green' | 'red' | 'amber';
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-400'
      : tone === 'red'
      ? 'text-red-400'
      : tone === 'amber'
      ? 'text-amber-400'
      : 'text-foreground';

  return (
    <div className="rounded-lg bg-white/3 border border-white/5 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn('mt-1 text-sm font-bold tabular-nums', toneClass)}>
        {value}
      </div>
    </div>
  );
}
