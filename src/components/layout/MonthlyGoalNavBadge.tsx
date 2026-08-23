import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMonthlyGoal, type GoalTier } from '@/hooks/useMonthlyGoal';

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

/**
 * Compact tier-colored indicator for the header, so the goal's status is
 * visible at a glance without opening the dashboard. Hidden entirely when no
 * goal is set — nothing to show yet.
 */
export function MonthlyGoalNavBadge() {
  const { hasGoal, loading, progress, tier, currentMonth } = useMonthlyGoal();
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading || !hasGoal) return null;

  const pct = Math.round(Math.max(0, progress) * 100);
  const monthLabel = currentMonth
    ? currentMonth.date.toLocaleDateString('en-US', { month: 'long' })
    : '';
  const color = tier ? TIER_COLOR[tier] : 'hsl(var(--space-400))';
  const label = tier ? TIER_LABEL[tier] : 'Not yet bronze';

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <NavLink
        to="/dashboard"
        className="glass-thin flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-white/5"
        aria-label={`Monthly goal: ${pct}% — ${label}`}
      >
        <Trophy className="w-3.5 h-3.5" style={{ color }} />
        <span className="font-num text-[11px] font-semibold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </NavLink>

      {showTooltip && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium shadow-lg',
            'glass-thin border border-space-500/40 text-space-100',
          )}
        >
          {monthLabel}: {pct}% of goal — {label}
        </div>
      )}
    </div>
  );
}
