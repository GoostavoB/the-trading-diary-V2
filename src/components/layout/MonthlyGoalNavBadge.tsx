import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { useMonthlyGoal, type GoalTier } from '@/hooks/useMonthlyGoal';

const TIER_BG: Record<Exclude<GoalTier, null>, string> = {
    bronze: 'bg-apple-orange',
    silver: 'bg-muted-foreground',
    gold: 'bg-primary',
};

/** Compact monthly-goal indicator for the header. Hidden when no goal is set. */
export function MonthlyGoalNavBadge() {
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const { hasGoal, loading, progress, tier } = useMonthlyGoal();

    if (loading || !hasGoal) return null;

    const monthLabel = new Date().toLocaleDateString(language || 'en', { month: 'long' });
    const pct = `${(progress * 100).toFixed(0)}%`;
    const tierLabel = tier ? t(`monthlyGoal.tiers.${tier}`) : t('monthlyGoal.noTier');

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        aria-label={t('monthlyGoal.title')}
                        className="relative h-7 w-7 rounded-full border border-border/40 bg-white/5 flex items-center justify-center transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <span className={cn('h-3 w-3 rounded-full', tier ? TIER_BG[tier] : 'bg-white/20')} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <span className="text-xs font-num capitalize">
                        {monthLabel}: {pct} {t('monthlyGoal.ofGoal')} — {tierLabel}
                    </span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
