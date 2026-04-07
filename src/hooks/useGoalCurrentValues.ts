import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GoalInput {
  id: string;
  goal_type: string;
  calculation_mode?: string | null;
  baseline_date?: string | null;
  baseline_value?: number | null;
  period_type?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  deadline: string;
  current_value: number;
  capital_target_type?: string | null;
}

interface TradeRow {
  trade_date: string | null;
  closed_at?: string | null;
  opened_at?: string | null;
  pnl?: number | null;
  profit_loss?: number | null;
  funding_fee?: number | null;
  trading_fee?: number | null;
}

export function computeGoalDateRange(goal: GoalInput) {
  let startDate: string | null = null;
  let endDate: string | null = null;

  if (goal.calculation_mode === 'start_from_scratch' && goal.baseline_date) {
    startDate = new Date(goal.baseline_date).toISOString();
    endDate = goal.period_type === 'custom_range' && goal.period_end
      ? new Date(goal.period_end).toISOString()
      : new Date(goal.deadline).toISOString();
  } else if (goal.calculation_mode === 'current_performance') {
    if (goal.period_type === 'custom_range') {
      startDate = goal.period_start ? new Date(goal.period_start).toISOString() : null;
      endDate = goal.period_end ? new Date(goal.period_end).toISOString() : null;
    } else {
      startDate = null;
      endDate = new Date(goal.deadline).toISOString();
    }
  }

  return { startDate, endDate };
}

export function computeCurrentValue(
  goal: GoalInput,
  trades: TradeRow[],
  includeFeesInPnL: boolean
): number {
  const { startDate, endDate } = computeGoalDateRange(goal);

  const filtered = trades.filter(trade => {
    const d = new Date(trade.trade_date || (trade as any).closed_at || trade.opened_at);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  });

  const totalPnl = filtered.reduce((sum, t) => {
    const pnl = t.profit_loss || t.pnl || 0;
    if (includeFeesInPnL) {
      return sum + (pnl - Math.abs(t.funding_fee || 0) - Math.abs(t.trading_fee || 0));
    }
    return sum + pnl;
  }, 0);

  const totalTrades = filtered.length;

  switch (goal.goal_type) {
    case 'profit':
      return totalPnl;
    case 'trades':
      return totalTrades;
    case 'win_rate': {
      const wins = filtered.filter(t => {
        const pnl = t.profit_loss || t.pnl || 0;
        if (includeFeesInPnL) {
          return (pnl - Math.abs(t.funding_fee || 0) - Math.abs(t.trading_fee || 0)) > 0;
        }
        return pnl > 0;
      }).length;
      return totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    }
    case 'roi': {
      const baseline = goal.baseline_value ?? 1;
      return baseline > 0 ? (totalPnl / baseline) * 100 : 0;
    }
    case 'capital': {
      if (goal.capital_target_type === 'absolute') {
        return (goal.baseline_value ?? 0) + totalPnl;
      }
      const base = goal.baseline_value ?? 1;
      return base > 0 ? (totalPnl / base) * 100 : 0;
    }
    default:
      return goal.current_value ?? 0;
  }
}

export function useGoalCurrentValues(
  goals: GoalInput[],
  userId: string | undefined,
  includeFeesInPnL = true
) {
  const { data: trades = [] } = useQuery({
    queryKey: ['trades-for-goals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('trade_date, opened_at, closed_at, pnl, profit_loss, funding_fee, trading_fee')
        .eq('user_id', userId!)
        .is('deleted_at', null)
        .order('closed_at', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const valuesMap = new Map<string, number>();
  if (trades.length > 0) {
    for (const goal of goals) {
      valuesMap.set(goal.id, computeCurrentValue(goal, trades, includeFeesInPnL));
    }
  }

  return { valuesMap, trades };
}
