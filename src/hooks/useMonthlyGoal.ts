import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { calculateTradePnL } from '@/utils/pnl';

export type GoalTier = 'bronze' | 'silver' | 'gold' | null;

/** Tier thresholds, expressed as a fraction of the monthly goal. */
export const TIER_THRESHOLDS = { bronze: 0.5, silver: 0.75, gold: 1 } as const;

export interface MonthlyGoalHistoryEntry {
  /** First day of the month, local time. */
  date: Date;
  /** `YYYY-MM` key. */
  key: string;
  pnl: number;
  tier: GoalTier;
  progress: number; // 0..n fraction of goal
}

interface MonthTradeRow {
  profit_loss: number | null;
  funding_fee: number | null;
  trading_fee: number | null;
  closed_at: string | null;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function tierForProgress(progress: number, hasGoal: boolean): GoalTier {
  if (!hasGoal) return null;
  if (progress >= TIER_THRESHOLDS.gold) return 'gold';
  if (progress >= TIER_THRESHOLDS.silver) return 'silver';
  if (progress >= TIER_THRESHOLDS.bronze) return 'bronze';
  return null;
}

/**
 * Monthly goal tracking.
 *
 * Reads/writes `user_settings.monthly_goal_target` (USD) for the active sub-account
 * and derives this month's realized net P&L, the previous month's P&L, a trailing
 * 12-month history for the trophy-case strip and a running monthly average.
 *
 * NOTE: only a single, current goal target is stored. Historical months are scored
 * against that same target (the current goal is assumed to apply retroactively) —
 * this keeps the schema simple until per-month targets are needed.
 */
export function useMonthlyGoal() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [trades, setTrades] = useState<MonthTradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ── Goal target (per sub-account settings row) ──
      if (activeSubAccount) {
        const { data, error: settingsError } = await supabase
          .from('user_settings')
          .select('monthly_goal_target')
          .eq('sub_account_id', activeSubAccount.id)
          .maybeSingle();

        if (settingsError) throw settingsError;
        setGoalTarget(data?.monthly_goal_target ?? null);
      }

      // ── Closed trades of the trailing 12 calendar months ──
      const now = new Date();
      const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      let query = supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, closed_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('closed_at', 'is', null)
        .gte('closed_at', windowStart.toISOString());

      if (activeSubAccount) {
        query = query.eq('sub_account_id', activeSubAccount.id);
      }

      const { data: tradeRows, error: tradesError } = await query;
      if (tradesError) throw tradesError;

      setTrades((tradeRows as MonthTradeRow[]) || []);
    } catch (e) {
      console.error('Error loading monthly goal data:', e);
      setError(e instanceof Error ? e.message : 'Failed to load monthly goal');
    } finally {
      setLoading(false);
    }
  }, [user, activeSubAccount]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const updateGoalTarget = useCallback(
    async (value: number | null) => {
      if (!user || !activeSubAccount) return;
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ monthly_goal_target: value })
        .eq('sub_account_id', activeSubAccount.id);

      if (updateError) throw updateError;
      setGoalTarget(value);
    },
    [user, activeSubAccount],
  );

  const derived = useMemo(() => {
    const now = new Date();
    const hasGoal = typeof goalTarget === 'number' && goalTarget > 0;

    // Aggregate net P&L per calendar month.
    const byMonth = new Map<string, number>();
    for (const t of trades) {
      if (!t.closed_at) continue;
      const closed = new Date(t.closed_at);
      if (Number.isNaN(closed.getTime())) continue;
      const key = monthKey(closed);
      byMonth.set(key, (byMonth.get(key) || 0) + calculateTradePnL(t, { includeFees: true }));
    }

    const currentKey = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentPnL = byMonth.get(currentKey) || 0;
    const lastMonthPnL = byMonth.get(monthKey(lastMonthDate)) ?? null;

    const progress = hasGoal ? currentPnL / (goalTarget as number) : 0;
    const tier = tierForProgress(progress, hasGoal);

    // Trailing history — only months that actually contain closed trades.
    const history: MonthlyGoalHistoryEntry[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      if (!byMonth.has(key)) continue;
      const pnl = byMonth.get(key) as number;
      const monthProgress = hasGoal ? pnl / (goalTarget as number) : 0;
      history.push({ date: d, key, pnl, tier: tierForProgress(monthProgress, hasGoal), progress: monthProgress });
    }

    const activeMonths = history.length;
    const averageMonthlyPnL =
      activeMonths > 0 ? history.reduce((sum, m) => sum + m.pnl, 0) / activeMonths : null;

    return {
      hasGoal,
      currentPnL,
      lastMonthPnL,
      progress,
      tier,
      history,
      averageMonthlyPnL,
      monthsTracked: activeMonths,
    };
  }, [trades, goalTarget]);

  return {
    goalTarget,
    updateGoalTarget,
    loading,
    error,
    reload: load,
    ...derived,
  };
}
