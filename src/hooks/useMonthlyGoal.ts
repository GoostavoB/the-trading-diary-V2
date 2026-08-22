import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { calculateTradePnL } from '@/utils/pnl';

export type GoalTier = 'bronze' | 'silver' | 'gold' | null;

/** Tier thresholds, expressed as a fraction of the monthly goal. */
export const TIER_THRESHOLDS = { bronze: 0.5, silver: 0.75, gold: 1 } as const;

/** How many trailing months (including the current one) the trophy-case strip shows. */
const HISTORY_MONTHS = 12;

export interface MonthlyGoalHistoryEntry {
  /** First day of the month, local time. */
  date: Date;
  /** `YYYY-MM` key. */
  key: string;
  pnl: number;
  tier: GoalTier;
  /** 0..n fraction of the (current) goal. Applied retroactively — see note below. */
  progress: number;
}

interface MonthTradeRow {
  profit_loss: number | null;
  funding_fee: number | null;
  trading_fee: number | null;
  closed_at: string | null;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Which tier a given progress fraction lands in. `hasGoal` gates the whole thing —
 * with no goal set there's nothing to grade against, so every month is tier-less.
 */
export function tierForProgress(progress: number, hasGoal: boolean): GoalTier {
  if (!hasGoal) return null;
  if (progress >= TIER_THRESHOLDS.gold) return 'gold';
  if (progress >= TIER_THRESHOLDS.silver) return 'silver';
  if (progress >= TIER_THRESHOLDS.bronze) return 'bronze';
  return null;
}

/**
 * Monthly Goal — a simpler, auto-renewing sibling to the deadline-based
 * `trading_goals` table / `GoalWidget`. Every calendar month resets progress
 * against the same target (until the user changes it). Intentionally does not
 * touch `trading_goals`.
 *
 * Note on history: because only one `monthly_goal_target` is stored (not a
 * value per historical month), the trophy-case tiers for past months are
 * computed against *today's* goal amount, not whatever the goal may have been
 * at the time. This matches the "look back and see how you did against where
 * you are now" mental model requested, and keeps the data model to a single
 * nullable column.
 */
export function useMonthlyGoal() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();

  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [history, setHistory] = useState<MonthlyGoalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let target: number | null = null;

      if (activeSubAccount) {
        const { data: settingsRow, error: settingsError } = await supabase
          .from('user_settings')
          .select('monthly_goal_target')
          .eq('sub_account_id', activeSubAccount.id)
          .maybeSingle();

        if (settingsError) throw settingsError;
        target = settingsRow?.monthly_goal_target ?? null;
      }
      setGoalTarget(target);

      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - (HISTORY_MONTHS - 1), 1);

      let query = supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, closed_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('closed_at', 'is', null)
        .gte('closed_at', rangeStart.toISOString());

      if (activeSubAccount) {
        query = query.eq('sub_account_id', activeSubAccount.id);
      }

      const { data: tradeRows, error: tradesError } = await query;
      if (tradesError) throw tradesError;

      const byMonth = new Map<string, number>();
      ((tradeRows as MonthTradeRow[] | null) || []).forEach((t) => {
        if (!t.closed_at) return;
        const key = monthKey(new Date(t.closed_at));
        const pnl = calculateTradePnL(t, { includeFees: true });
        byMonth.set(key, (byMonth.get(key) || 0) + pnl);
      });

      const hasGoal = typeof target === 'number' && target > 0;
      const entries: MonthlyGoalHistoryEntry[] = [];
      for (let i = 0; i < HISTORY_MONTHS; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthKey(d);
        const pnl = byMonth.get(key) || 0;
        const progress = hasGoal ? pnl / (target as number) : 0;
        entries.push({ date: d, key, pnl, progress, tier: tierForProgress(progress, hasGoal) });
      }
      entries.reverse(); // oldest -> newest, for the trophy-case strip
      setHistory(entries);
    } catch (error) {
      console.error('Error loading monthly goal:', error);
    } finally {
      setLoading(false);
    }
  }, [user, activeSubAccount]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateGoal = useCallback(
    async (amount: number | null) => {
      if (!user || !activeSubAccount) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from('user_settings')
          .update({ monthly_goal_target: amount })
          .eq('sub_account_id', activeSubAccount.id);
        if (error) throw error;
        setGoalTarget(amount);
        await fetchAll();
      } catch (error) {
        console.error('Error updating monthly goal:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user, activeSubAccount, fetchAll],
  );

  const hasGoal = typeof goalTarget === 'number' && goalTarget > 0;
  const currentMonth = history.length > 0 ? history[history.length - 1] : null;
  const lastMonth = history.length > 1 ? history[history.length - 2] : null;

  const monthsWithActivity = useMemo(() => history.filter((h) => h.pnl !== 0), [history]);
  const runningAverage = useMemo(() => {
    if (monthsWithActivity.length === 0) return 0;
    return monthsWithActivity.reduce((sum, h) => sum + h.pnl, 0) / monthsWithActivity.length;
  }, [monthsWithActivity]);

  const progress = currentMonth && hasGoal ? Math.max(0, currentMonth.progress) : 0;
  const tier: GoalTier = currentMonth ? currentMonth.tier : null;
  const vsLastMonth = currentMonth && lastMonth ? currentMonth.pnl - lastMonth.pnl : null;

  return {
    loading,
    saving,
    hasGoal,
    goalTarget,
    updateGoal,
    currentMonth,
    lastMonth,
    vsLastMonth,
    history,
    monthsTracked: monthsWithActivity.length,
    runningAverage,
    progress,
    tier,
    reload: fetchAll,
  };
}
