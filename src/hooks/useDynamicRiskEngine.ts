import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, isToday, parseISO } from 'date-fns';

export type DRETier = 'protection' | 'aggressive' | 'moderate' | 'conservative' | 'institutional';

export interface DREState {
  initialBalance: number;
  dailyGoal: number;
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

export const useDynamicRiskEngine = (initialBalanceOverride?: number) => {
  const { user } = useAuth();
  const [manualBalance, setManualBalance] = useState<number | null>(initialBalanceOverride ?? null);

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings-dre', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('initial_investment')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

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

  const initialBalance = manualBalance ?? userSettings?.initial_investment ?? 500;
  const dailyGoal = initialBalance * 0.05;

  const dreState: DREState = useMemo(() => {
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const surplus = todayPnL - dailyGoal;
    const tier = getTier(surplus);
    const allowedRisk = getAllowedRisk(surplus);

    // Build trade history with DRE compliance check
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
      initialBalance,
      dailyGoal,
      todayPnL,
      surplus,
      tier,
      tierLabel: TIER_CONFIG[tier].label,
      allowedRisk,
      todayTrades: tradesWithCompliance,
    };
  }, [todayTrades, initialBalance, dailyGoal]);

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
    setManualBalance: setManualBalance,
    simulate,
    TIER_CONFIG,
  };
};
