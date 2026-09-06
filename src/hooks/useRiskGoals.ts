import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { calculateTradePnL } from '@/utils/pnl';

export type GoalPeriodType = 'daily' | 'monthly' | 'yearly' | 'custom';

export interface RiskGoal {
  id: string;
  name: string;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  target_amount: number;
}

export interface RiskGoalProgress extends RiskGoal {
  profit: number;
  pct: number;
  /** Medal tiers in absolute currency: 60% / 80% / 100% of target */
  thresholds: { bronze: number; silver: number; gold: number };
  achieved: 'bronze' | 'silver' | 'gold' | null;
  periodLabel: string;
}

export function defaultRangeFor(type: GoalPeriodType, base = new Date()) {
  switch (type) {
    case 'daily':
      return { start: startOfDay(base), end: endOfDay(base) };
    case 'yearly':
      return { start: startOfYear(base), end: endOfYear(base) };
    case 'monthly':
    case 'custom':
    default:
      return { start: startOfMonth(base), end: endOfMonth(base) };
  }
}

export function defaultNameFor(type: GoalPeriodType, base = new Date()) {
  switch (type) {
    case 'daily':
      return `Daily — ${format(base, 'dd/MM/yyyy')}`;
    case 'yearly':
      return `Year ${format(base, 'yyyy')}`;
    case 'monthly':
      return format(base, 'MMMM/yy');
    default:
      return 'Custom goal';
  }
}

export function periodLabelFor(goal: Pick<RiskGoal, 'period_type' | 'period_start' | 'period_end'>) {
  const start = new Date(`${goal.period_start}T00:00:00`);
  const end = new Date(`${goal.period_end}T00:00:00`);
  if (goal.period_type === 'daily') return format(start, 'dd/MM/yyyy');
  if (goal.period_type === 'monthly') return format(start, 'MMMM/yyyy');
  if (goal.period_type === 'yearly') return format(start, 'yyyy');
  return `${format(start, 'dd/MM/yy')} → ${format(end, 'dd/MM/yy')}`;
}

export function medalFor(pct: number): 'bronze' | 'silver' | 'gold' | null {
  if (pct >= 100) return 'gold';
  if (pct >= 80) return 'silver';
  if (pct >= 60) return 'bronze';
  return null;
}

export function useRiskGoals() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const queryClient = useQueryClient();
  const subAccountId = activeSubAccount?.id;

  const goalsKey = ['risk-goals', user?.id, subAccountId];

  const { data: goals = [], isLoading } = useQuery({
    queryKey: goalsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_goals')
        .select('id, name, period_type, period_start, period_end, target_amount')
        .eq('user_id', user!.id)
        .order('period_start', { ascending: true });
      if (error) throw error;
      return (data || []) as RiskGoal[];
    },
    enabled: !!user?.id,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['risk-goals-trades', user?.id, subAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, trade_date, closed_at, opened_at')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .is('deleted_at', null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!subAccountId,
  });

  const withProgress: RiskGoalProgress[] = useMemo(() => {
    return goals.map((g) => {
      const start = new Date(`${g.period_start}T00:00:00`);
      const end = new Date(`${g.period_end}T23:59:59`);
      const profit = trades.reduce((sum, t: any) => {
        const raw = t.trade_date || t.closed_at || t.opened_at;
        if (!raw) return sum;
        const d = new Date(raw);
        if (isNaN(d.getTime()) || d < start || d > end) return sum;
        return sum + calculateTradePnL(t, { includeFees: true });
      }, 0);
      const target = g.target_amount || 0;
      const pct = target > 0 ? (profit / target) * 100 : 0;
      return {
        ...g,
        profit,
        pct,
        thresholds: { bronze: target * 0.6, silver: target * 0.8, gold: target },
        achieved: target > 0 ? medalFor(pct) : null,
        periodLabel: periodLabelFor(g),
      };
    });
  }, [goals, trades]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: goalsKey });

  const createGoal = async (input: {
    name: string;
    period_type: GoalPeriodType;
    period_start: string;
    period_end: string;
    target_amount: number;
  }) => {
    if (!user) return;
    const { error } = await supabase.from('risk_goals').insert({
      user_id: user.id,
      sub_account_id: subAccountId ?? null,
      ...input,
    });
    if (error) throw error;
    invalidate();
  };

  const updateGoal = async (id: string, patch: Partial<RiskGoal>) => {
    const { error } = await supabase.from('risk_goals').update(patch).eq('id', id);
    if (error) throw error;
    invalidate();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('risk_goals').delete().eq('id', id);
    if (error) throw error;
    invalidate();
  };

  return { goals: withProgress, isLoading, createGoal, updateGoal, deleteGoal };
}
