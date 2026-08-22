import { memo, useEffect, useState } from 'react';
import { Check, Pencil, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useMonthlyGoal, type GoalTier } from '@/hooks/useMonthlyGoal';

const TIER_TEXT: Record<Exclude<GoalTier, null>, string> = {
    bronze: 'text-apple-orange',
    silver: 'text-muted-foreground',
    gold: 'text-primary',
};

const TIER_DOT: Record<Exclude<GoalTier, null>, string> = {
    bronze: 'bg-apple-orange',
    silver: 'bg-muted-foreground',
    gold: 'bg-primary',
};

function formatUsd(value: number) {
    return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export const MonthlyGoalWidget = memo(function MonthlyGoalWidget() {
    const { t, language } = useTranslation();
    const {
        goalTarget,
        updateGoalTarget,
        loading,
        hasGoal,
        currentPnL,
        lastMonthPnL,
        progress,
        tier,
        history,
        averageMonthlyPnL,
    } = useMonthlyGoal();

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(goalTarget != null ? String(goalTarget) : '');
    }, [goalTarget]);

    const monthLabel = new Date().toLocaleDateString(language || 'en', { month: 'long' });
    const clamped = Math.max(0, Math.min(progress, 1));
    const pctLabel = hasGoal ? `${(progress * 100).toFixed(0)}%` : '—';
    const delta = lastMonthPnL != null ? currentPnL - lastMonthPnL : null;

    const save = async () => {
        const parsed = Number(draft.replace(',', '.'));
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        setSaving(true);
        try {
            await updateGoalTarget(parsed);
            setEditing(false);
        } catch {
            /* surfaced by hook logging */
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="card-premium h-40 animate-pulse" aria-busy="true" />;
    }

    return (
        <section className="card-premium p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Target className="h-4 w-4 text-primary shrink-0" />
                    <h2 className="text-sm font-semibold text-foreground truncate">
                        {t('monthlyGoal.title')}
                    </h2>
                    <span className="text-xs text-muted-foreground capitalize truncate">{monthLabel}</span>
                </div>

                {editing ? (
                    <div className="flex items-center gap-1.5">
                        <Input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            inputMode="decimal"
                            className="h-8 w-28 font-num"
                            aria-label={t('monthlyGoal.targetLabel')}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={save} disabled={saving} aria-label={t('monthlyGoal.save')}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)} aria-label={t('monthlyGoal.cancel')}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setEditing(true)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        {hasGoal ? t('monthlyGoal.editGoal') : t('monthlyGoal.setGoal')}
                    </Button>
                )}
            </div>

            {!hasGoal ? (
                <p className="text-sm text-muted-foreground">
                    {t('monthlyGoal.emptyState')} <span className="font-num">—</span>
                </p>
            ) : (
                <>
                    {/* Amount vs goal */}
                    <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <div className={cn('text-2xl font-num font-semibold tabular-nums', currentPnL >= 0 ? 'text-profit' : 'text-loss')}>
                                {formatUsd(currentPnL)}
                            </div>
                            <div className="text-xs text-muted-foreground font-num">
                                {t('monthlyGoal.of')} {formatUsd(goalTarget as number)} · {pctLabel}
                            </div>
                        </div>
                        <span
                            className={cn(
                                'chip-electric text-xs whitespace-nowrap',
                                tier ? TIER_TEXT[tier] : 'text-muted-foreground',
                            )}
                        >
                            {tier ? t(`monthlyGoal.tiers.${tier}`) : t('monthlyGoal.noTier')}
                        </span>
                    </div>

                    {/* Progress bar with tier markers */}
                    <div className="relative h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all duration-500', currentPnL >= 0 ? 'bg-primary' : 'bg-loss')}
                            style={{ width: `${clamped * 100}%` }}
                        />
                        {[0.5, 0.75, 1].map((mark) => (
                            <span
                                key={mark}
                                className="absolute top-0 h-full w-px bg-foreground/25"
                                style={{ left: `${mark * 100}%` }}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-num">
                        <span>{t('monthlyGoal.tiers.bronze')} 50%</span>
                        <span>{t('monthlyGoal.tiers.silver')} 75%</span>
                        <span>{t('monthlyGoal.tiers.gold')} 100%</span>
                    </div>

                    {/* Comparisons */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <div className="text-[11px] text-muted-foreground">{t('monthlyGoal.vsLastMonth')}</div>
                            <div className={cn('text-sm font-num tabular-nums', delta == null ? 'text-muted-foreground' : delta >= 0 ? 'text-profit' : 'text-loss')}>
                                {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${formatUsd(delta)}`}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground">{t('monthlyGoal.average')}</div>
                            <div className="text-sm font-num tabular-nums text-foreground">
                                {averageMonthlyPnL == null ? '—' : formatUsd(averageMonthlyPnL)}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Trophy case */}
            {history.length > 0 && (
                <div className="pt-1">
                    <div className="text-[11px] text-muted-foreground mb-1.5">{t('monthlyGoal.trophyCase')}</div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {history.map((m) => (
                            <div key={m.key} className="flex flex-col items-center gap-1 shrink-0 w-9">
                                <span
                                    className={cn(
                                        'h-3 w-3 rounded-full',
                                        m.tier ? TIER_DOT[m.tier] : 'bg-white/10',
                                    )}
                                    title={`${formatUsd(m.pnl)}`}
                                />
                                <span className="text-[10px] text-muted-foreground capitalize">
                                    {m.date.toLocaleDateString(language || 'en', { month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
});
