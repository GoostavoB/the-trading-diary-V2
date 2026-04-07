import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfDay } from 'date-fns';
import { calculateTradePnL } from '@/utils/pnl';

export type DRETier = 'protection' | 'aggressive' | 'moderate' | 'conservative' | 'institutional';

export interface DREState {
  currentBalance: number;
  dailyGoal: number;
  dailyGoalPercent: number;
  todayPnL: number;
  surplus: number;
  tier: DRETier;
  tierLabel: string;
  allowedRisk: number;
  todayTrades: Array<{
    id: string;
    symbol: string;
    profit_loss: number;
    timestamp: string;
    respectedDRE: boolean;
    allowedRiskAtTime: number;
  }>;
}

const TIER_CONFIG: Record<DRETier, { label: string; color: string; riskPct: number }> = {
  protection: { label: 'PROTEÇÃO', color: 'red', riskPct: 0 },
  aggressive: { label: 'AGRESSIVO', color: 'blue', riskPct: 0.5 },
  moderate: { label: 'MODERADO', color: 'purple', riskPct: 0.3 },
  conservative: { label: 'CONSERVADOR', color: 'amber', riskPct: 0.15 },
  institutional: { label: 'INSTITUCIONAL', color: 'emerald', riskPct: 0.05 },
};

function getTier(surplus: number): DRETier {
  if (surplus < 10) return 'protection';
  if (surplus < 50) return 'aggressive';
  if (surplus < 150) return 'moderate';
  if (surplus < 500) return 'conservative';
  return 'institutional';
}

function getAllowedRisk(surplus: number): number {
  const tier = getTier(surplus);
  return Math.max(0, surplus * TIER_CONFIG[tier].riskPct);
}

export const useDynamicRiskEngine = () => {
  const { user } = useAuth();

  // Fetch capital log total
  const { data: capitalLogTotal } = useQuery({
    queryKey: ['capital-log-dre', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_log')
        .select('amount_added')
        .eq('user_id', user!.id);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
    },
    enabled: !!user?.id,
  });

  // Fetch user settings (initial_investment + daily_goal_percent)
  const { data: userSettings } = useQuery({
    queryKey: ['user-settings-dre', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('initial_investment, daily_goal_percent')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch ALL trades for equity calculation (same as useRiskCalculator)
  const { data: allTrades = [] } = useQuery({
    queryKey: ['all-trades-dre', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee')
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch today's trades for DRE compliance
  const { data: todayTrades = [] } = useQuery({
    queryKey: ['trades-today-dre', user?.id],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const { data, error } = await supabase
        .from('trades')
        .select('id, symbol, symbol_temp, profit_loss, trade_date, created_at')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .gte('trade_date', todayStart)
        .order('trade_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Current balance = base capital + total PnL (current equity)
  const baseCapital = capitalLogTotal ?? userSettings?.initial_investment ?? 500;
  const totalPnL = allTrades.reduce((sum, t) => {
    return sum + calculateTradePnL(t, { includeFees: true });
  }, 0);
  const currentBalance = baseCapital + totalPnL;

  // Daily goal % from DB (default 5)
  const dailyGoalPercent = (userSettings as any)?.daily_goal_percent ?? 5;
  const dailyGoal = currentBalance * (dailyGoalPercent / 100);

  const updateDailyGoalPercent = async (pct: number) => {
    if (!user) return;
    const clamped = Math.max(0.5, Math.min(50, pct));
    await supabase
      .from('user_settings')
      .update({ daily_goal_percent: clamped } as any)
      .eq('user_id', user.id);
  };

  const dreState: DREState = useMemo(() => {
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const surplus = todayPnL - dailyGoal;
    const tier = getTier(surplus);
    const allowedRisk = getAllowedRisk(surplus);

    let runningPnL = 0;
    const tradesWithCompliance = todayTrades.map((t) => {
      const pnlBefore = runningPnL;
      const surplusBefore = pnlBefore - dailyGoal;
      const allowedAtTime = getAllowedRisk(surplusBefore);
      runningPnL += t.profit_loss || 0;

      const loss = (t.profit_loss || 0) < 0 ? Math.abs(t.profit_loss || 0) : 0;
      const respectedDRE = loss <= allowedAtTime || loss === 0;

      return {
        id: t.id,
        symbol: t.symbol || t.symbol_temp || 'Unknown',
        profit_loss: t.profit_loss || 0,
        timestamp: t.trade_date || t.created_at,
        respectedDRE,
        allowedRiskAtTime: allowedAtTime,
      };
    });

    return {
      currentBalance,
      dailyGoal,
      dailyGoalPercent,
      todayPnL,
      surplus,
      tier,
      tierLabel: TIER_CONFIG[tier].label,
      allowedRisk,
      todayTrades: tradesWithCompliance,
    };
  }, [todayTrades, currentBalance, dailyGoal, dailyGoalPercent]);

  const simulate = (hypotheticalPnL: number) => {
    const newPnL = dreState.todayPnL + hypotheticalPnL;
    const newSurplus = newPnL - dailyGoal;
    const newTier = getTier(newSurplus);
    const newAllowedRisk = getAllowedRisk(newSurplus);
    return {
      newPnL,
      newSurplus,
      newTier,
      newTierLabel: TIER_CONFIG[newTier].label,
      newAllowedRisk,
    };
  };

  return {
    ...dreState,
    updateDailyGoalPercent,
    simulate,
    TIER_CONFIG,
  };
};
