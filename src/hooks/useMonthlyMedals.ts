import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format } from 'date-fns';
import { calculateTradePnL } from '@/utils/pnl';

export type Medal = 'bronze' | 'silver' | 'gold';

export interface MonthlyMedal {
  id: string;
  month: string;
  monthLabel: string;
  medal: Medal;
  goal_target: number;
  actual_profit: number;
  pct_achieved: number;
}

function medalFor(pct: number): Medal | null {
  if (pct >= 100) return 'gold';
  if (pct >= 90) return 'silver';
  if (pct >= 70) return 'bronze';
  return null;
}

export function useMonthlyMedals() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const queryClient = useQueryClient();

  const subAccountId = activeSubAccount?.id;
  const medalsKey = ['monthly-medals', user?.id, subAccountId];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: medalsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_medals')
        .select('id, month, medal, goal_target, actual_profit, pct_achieved')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!subAccountId,
  });

  const medals: MonthlyMedal[] = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        medal: r.medal as Medal,
        monthLabel: format(new Date(r.month), 'MMM/yy'),
      })),
    [rows]
  );

  const { data: settings } = useQuery({
    queryKey: ['month-close-settings', subAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('risk_copilot_last_month_closed, monthly_goal_target')
        .eq('sub_account_id', subAccountId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!subAccountId,
  });

  const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const lastClosed = settings?.risk_copilot_last_month_closed
    ? format(startOfMonth(new Date(settings.risk_copilot_last_month_closed)), 'yyyy-MM-dd')
    : null;

  const previousMonthStart = startOfMonth(subMonths(new Date(), 1));
  const pendingCloseMonth =
    (settings?.monthly_goal_target ?? 0) > 0 && lastClosed !== currentMonthKey ? previousMonthStart : null;

  const { data: previousMonthTrades } = useQuery({
    queryKey: ['previous-month-trades', user?.id, subAccountId, pendingCloseMonth?.toISOString()],
    queryFn: async () => {
      const start = pendingCloseMonth!.toISOString();
      const end = startOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, trade_date, closed_at')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .is('deleted_at', null)
        .or(`trade_date.gte.${start},and(trade_date.is.null,closed_at.gte.${start})`)
        .lt('trade_date', end);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!subAccountId && !!pendingCloseMonth,
  });

  const pendingClose = useMemo(() => {
    if (!pendingCloseMonth || !previousMonthTrades || !settings?.monthly_goal_target) return null;
    const profit = previousMonthTrades.reduce((sum, t) => sum + calculateTradePnL(t, { includeFees: true }), 0);
    const goal = settings.monthly_goal_target;
    const pct = goal > 0 ? (profit / goal) * 100 : 0;
    const medal = medalFor(pct);
    return { month: pendingCloseMonth, profit, goal, pct, medal };
  }, [pendingCloseMonth, previousMonthTrades, settings]);

  const closeMonth = async (reinvestPct: number) => {
    if (!user || !subAccountId || !pendingClose) return;
    const monthStr = format(pendingClose.month, 'yyyy-MM-dd');

    if (pendingClose.medal) {
      await supabase.from('monthly_medals').upsert(
        {
          user_id: user.id,
          sub_account_id: subAccountId,
          month: monthStr,
          medal: pendingClose.medal,
          goal_target: pendingClose.goal,
          actual_profit: pendingClose.profit,
          pct_achieved: pendingClose.pct,
          allocation_reinvest_pct: reinvestPct,
        },
        { onConflict: 'user_id,sub_account_id,month' }
      );
    }

    if (pendingClose.profit > 0) {
      const reinvestAmount = pendingClose.profit * (reinvestPct / 100);
      if (reinvestAmount > 0) {
        const { data: capLog } = await supabase
          .from('capital_log')
          .select('amount_added')
          .eq('sub_account_id', subAccountId);
        const currentTotal = (capLog || []).reduce((s, e) => s + (e.amount_added || 0), 0);
        await supabase.from('capital_log').insert({
          user_id: user.id,
          sub_account_id: subAccountId,
          amount_added: reinvestAmount,
          total_after: currentTotal + reinvestAmount,
          notes: `Reinvestment from ${format(pendingClose.month, 'MMM/yy')} close`,
          log_date: new Date().toISOString().split('T')[0],
        });
      }
    }

    await supabase
      .from('user_settings')
      .update({ risk_copilot_last_month_closed: new Date().toISOString().split('T')[0] })
      .eq('sub_account_id', subAccountId);

    queryClient.invalidateQueries({ queryKey: medalsKey });
    queryClient.invalidateQueries({ queryKey: ['month-close-settings', subAccountId] });
    queryClient.invalidateQueries({ queryKey: ['risk-copilot-capital-log', subAccountId] });
  };

  return {
    medals,
    isLoading,
    pendingClose,
    closeMonth,
  };
}
