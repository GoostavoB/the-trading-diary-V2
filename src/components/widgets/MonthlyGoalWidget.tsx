import { useState } from 'react';
import { Trophy, Pencil, Check, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMonthlyGoal, TIER_THRESHOLDS, type GoalTier } from '@/hooks/useMonthlyGoal';

const TIER_COLOR: Record<Exclude<GoalTier, null>, string> = {
  bronze: 'hsl(30 45% 55%)',
  silver: 'hsl(210 10% 70%)',
  gold: 'hsl(var(--apple-orange))',
};

const TIER_LABEL: Record<Exclude<GoalTier, null>, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

function formatCurrency(n: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 10_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

const MONTH_LABEL = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const MONTH_SHORT = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });

export function MonthlyGoalWidget() {
  const {
    loading,
    saving,
    hasGoal,
    goalTarget,
    updateGoal,
    currentMonth,
    vsLastMonth,
    history,
    monthsTracked,
    runningAverage,
    progress,
    tier,
  } = useMonthlyGoal();

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');

  const startEdit = () => {
    setDraftValue(goalTarget ? String(goalTarget) : '');
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    const parsed = parseFloat(draftValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    await updateGoal(parsed);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="card-premium p-5">
        <div className="h-24 animate-pulse rounded-lg bg-space-700/40" />
      </div>
    );
  }

  const pnl = currentMonth?.pnl ?? 0;
  const pnlPositive = pnl >= 0;
  const progressPct = Math.max(0, Math.min(100, progress * 100));
  const onTrackToGold = hasGoal && tier === 'gold';

  return (
    <div className="card-premium p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-apple-orange" />
          <span className="text-[11px] font-medium text-space-200 tracking-tight">
            Monthly goal
          </span>
          <span className="text-[11px] text-space-400">
            · {currentMonth ? MONTH_LABEL(currentMonth.date) : '—'}
          </span>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1 text-[11px] text-space-300 hover:text-electric transition-colors"
          >
            <Pencil className="w-3 h-3" />
            {hasGoal ? 'Edit' : 'Set goal'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="px-5 pb-5 pt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-space-300 text-sm">$</span>
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              placeholder="e.g. 500"
              className="w-full glass-thin rounded-lg pl-6 pr-3 py-2 text-sm font-num tabular-nums text-space-100 outline-none focus:ring-1 focus:ring-electric"
            />
          </div>
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving}
            className="btn-primary h-9 w-9 flex items-center justify-center rounded-lg disabled:opacity-50"
            aria-label="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="glass-thin h-9 w-9 flex items-center justify-center rounded-lg text-space-300 hover:text-space-100"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : !hasGoal ? (
        <div className="px-5 pb-5 pt-2">
          <div className="text-2xl font-display font-bold text-space-400">—</div>
          <p className="mt-1.5 text-xs text-space-400">
            Set a monthly target — e.g. cover a fixed expense like rent — and this tracks your progress every month automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Hero row: this month's P&L vs goal */}
          <div className="px-5 pb-3 pt-1 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div
                className={cn(
                  'font-display text-4xl md:text-5xl font-bold tabular-nums tracking-tight leading-none',
                  pnlPositive ? 'text-gradient-electric' : 'text-gradient-loss',
                )}
              >
                {pnl >= 0 ? '+' : ''}
                {formatCurrency(pnl)}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-space-300 tabular-nums flex-wrap">
                <span>of {formatCurrency(goalTarget as number, { compact: true })} goal</span>
                <span className="text-space-500">·</span>
                <span className="font-semibold text-space-100">{progressPct.toFixed(0)}%</span>
                {vsLastMonth !== null && (
                  <>
                    <span className="text-space-500">·</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 font-medium',
                        vsLastMonth >= 0 ? 'text-apple-green' : 'text-apple-red',
                      )}
                    >
                      {vsLastMonth >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {formatCurrency(Math.abs(vsLastMonth), { compact: true })} vs last month
                    </span>
                  </>
                )}
              </div>
            </div>

            <span
              className="chip flex items-center gap-1.5 shrink-0"
              style={
                tier
                  ? { color: TIER_COLOR[tier], borderColor: `${TIER_COLOR[tier]}55`, background: `${TIER_COLOR[tier]}14` }
                  : undefined
              }
            >
              <Trophy className="w-3 h-3" />
              {tier ? TIER_LABEL[tier] : 'Not yet bronze'}
            </span>
          </div>

          {onTrackToGold && (
            <div className="mx-5 mb-3 px-3 py-2 rounded-lg glass-thin border border-apple-green/30 text-[11px] text-apple-green font-medium">
              Goal hit for {currentMonth ? MONTH_SHORT(currentMonth.date) : 'this month'} — no need to keep pushing size to chase more.
            </div>
          )}

          {/* Progress bar with tier markers */}
          <div className="px-5 pb-4">
            <div className="relative h-2.5 rounded-full bg-space-700/50 overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  pnlPositive ? 'bg-gradient-to-r from-electric to-apple-cyan' : 'bg-apple-red',
                )}
                style={{ width: `${progressPct}%` }}
              />
              {(['bronze', 'silver', 'gold'] as const).map((t) => (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 w-px bg-space-900/60"
                  style={{ left: `${TIER_THRESHOLDS[t] * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] text-space-400 uppercase tracking-wider tabular-nums">
              <span>0</span>
              <span style={{ marginLeft: `${TIER_THRESHOLDS.bronze * 100 - 8}%` }}>Bronze 50%</span>
              <span style={{ marginLeft: `${(TIER_THRESHOLDS.silver - TIER_THRESHOLDS.bronze) * 100 - 8}%` }}>Silver 75%</span>
              <span>Gold 100%</span>
            </div>
          </div>

          {/* Running average */}
          <div className="grid grid-cols-2 gap-0 border-t border-space-500/40">
            <div className="px-5 py-3 border-r border-space-500/40">
              <div className="text-[10px] text-space-300 uppercase tracking-wider">Avg / month</div>
              <div className="mt-0.5 font-num text-sm font-semibold text-space-100 tabular-nums">
                {monthsTracked > 0 ? formatCurrency(runningAverage, { compact: true }) : '—'}
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-[10px] text-space-300 uppercase tracking-wider">Months tracked</div>
              <div className="mt-0.5 font-num text-sm font-semibold text-space-100 tabular-nums">
                {monthsTracked || '—'}
              </div>
            </div>
          </div>

          {/* Trophy case: past months strip */}
          <div className="px-5 py-4 border-t border-space-500/40">
            <div className="text-[10px] text-space-300 uppercase tracking-wider mb-2">Trophy case</div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {history.map((entry) => (
                <div
                  key={entry.key}
                  className="flex flex-col items-center gap-1 shrink-0"
                  title={`${MONTH_LABEL(entry.date)}: ${formatCurrency(entry.pnl, { compact: true })} (${(entry.progress * 100).toFixed(0)}%)`}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center border',
                      entry.tier ? '' : 'border-space-600/60 bg-space-700/30',
                    )}
                    style={
                      entry.tier
                        ? { borderColor: `${TIER_COLOR[entry.tier]}66`, background: `${TIER_COLOR[entry.tier]}1f` }
                        : undefined
                    }
                  >
                    {entry.tier ? (
                      <Trophy className="w-3.5 h-3.5" style={{ color: TIER_COLOR[entry.tier] }} />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-space-500" />
                    )}
                  </div>
                  <span className="text-[9px] text-space-400 tabular-nums">{MONTH_SHORT(entry.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
