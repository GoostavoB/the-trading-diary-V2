import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth } from 'date-fns';
import { calculateTradePnL } from '@/utils/pnl';

export type RiskTier = 'red' | 'defense' | 'standard' | 'sniper';

const TIER_MESSAGES: Record<RiskTier, string> = {
  red: 'Porra, seu Win Rate está muito baixo. Fica alguns dias sem operar, espera o mercado fazer alguma tendência clara, porque você está tomando muito stop. Volte a focar nos sinais dos mentores.',
  defense: 'Modo Defesa. Reduza a mão e proteja o capital.',
  standard: 'Setup Técnico padrão. Mantenha a disciplina.',
  sniper: 'Modo Sniper Elite. Mão no teto máximo autorizada.',
};

const TIER_LABELS: Record<RiskTier, string> = {
  red: 'RED ALERT',
  defense: 'DEFESA',
  standard: 'PADRÃO',
  sniper: 'SNIPER ELITE',
};

export type WinRateMode = 'manual' | 'real';

export interface RiskCopilotState {
  loading: boolean;
  winRate: number;
  realWinRate: number;
  winRateMode: WinRateMode;
  canUseRealWinRate: boolean;
  manualWinRatePct: number;
  sampleSize: number;
  tier: RiskTier;
  tierLabel: string;
  tierMessage: string;
  bias: { side: 'long' | 'short'; winRate: number } | null;
  capitalBase: number;
  monthlyProfit: number;
  monthlyGoal: number;
  monthlyGoalPct: number;
  isGorduraActive: boolean;
  gorduraAmount: number;
  authorizedStopDollar: number;
  authorizedStopPct: number;
  floorPct: number;
  ceilingPct: number;
}

function getTier(winRate: number): RiskTier {
  if (winRate < 60) return 'red';
  if (winRate < 70) return 'defense';
  if (winRate < 80) return 'standard';
  return 'sniper';
}

function getTierRiskPct(tier: RiskTier, winRate: number, floorPct: number, ceilingPct: number): number {
  switch (tier) {
    case 'red':
      return 0;
    case 'defense':
      return floorPct;
    case 'sniper':
      return ceilingPct;
    case 'standard': {
      const t = Math.min(1, Math.max(0, (winRate - 70) / 10));
      return floorPct + (ceilingPct - floorPct) * t;
    }
  }
}

export function useRiskCopilot() {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const queryClient = useQueryClient();
  const subAccountId = activeSubAccount?.id;

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['risk-copilot-settings', subAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('monthly_goal_target, risk_kelly_floor_pct, risk_kelly_ceiling_pct, gordura_locked_base, gordura_lock_month, risk_copilot_last_month_closed, initial_investment, risk_win_rate_source, risk_manual_win_rate')
        .eq('sub_account_id', subAccountId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!subAccountId,
  });

  const { data: capitalLog = [], isLoading: capitalLoading } = useQuery({
    queryKey: ['risk-copilot-capital-log', subAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_log')
        .select('amount_added')
        .eq('sub_account_id', subAccountId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!subAccountId,
  });

  const { data: last20Trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['risk-copilot-last20', user?.id, subAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, side, closed_at, trade_date')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .is('deleted_at', null)
        .order('closed_at', { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!subAccountId,
  });

  const { data: monthTrades = [], isLoading: monthLoading } = useQuery({
    queryKey: ['risk-copilot-month-trades', user?.id, subAccountId],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee, closed_at, trade_date')
        .eq('user_id', user!.id)
        .eq('sub_account_id', subAccountId!)
        .is('deleted_at', null)
        .or(`trade_date.gte.${monthStart},and(trade_date.is.null,closed_at.gte.${monthStart})`)
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!subAccountId,
  });

  const capitalBase = useMemo(() => {
    const totalAdded = capitalLog.reduce((sum, e) => sum + (e.amount_added || 0), 0);
    if (totalAdded > 0) return totalAdded;
    return settings?.initial_investment || 0;
  }, [capitalLog, settings]);

  const monthlyProfit = useMemo(
    () => monthTrades.reduce((sum, t) => sum + calculateTradePnL(t, { includeFees: true }), 0),
    [monthTrades]
  );

  const state: RiskCopilotState = useMemo(() => {
    const wins = last20Trades.filter((t) => calculateTradePnL(t, { includeFees: true }) > 0);
    const sampleSize = last20Trades.length;
    const realWinRate = sampleSize > 0 ? (wins.length / sampleSize) * 100 : 0;
    const canUseRealWinRate = sampleSize >= 4;
    const manualWinRatePct = settings?.risk_manual_win_rate ?? 70;
    const winRateMode: WinRateMode =
      settings?.risk_win_rate_source === 'real' && canUseRealWinRate ? 'real' : 'manual';
    const winRate = winRateMode === 'real' ? realWinRate : manualWinRatePct;

    const floorPct = Math.min(12, settings?.risk_kelly_floor_pct ?? 5);
    const ceilingPct = Math.min(12, settings?.risk_kelly_ceiling_pct ?? 10);
    const tier = getTier(winRate);
    const riskPct = getTierRiskPct(tier, winRate, floorPct, ceilingPct);

    const bySide = { long: [] as typeof last20Trades, short: [] as typeof last20Trades };
    last20Trades.forEach((t) => {
      const s = (t.side || '').toLowerCase();
      if (s === 'long' || s === 'short') bySide[s].push(t);
    });

    let bias: RiskCopilotState['bias'] = null;
    if (bySide.long.length >= 3 && bySide.short.length >= 3) {
      const longWR = (bySide.long.filter((t) => calculateTradePnL(t, { includeFees: true }) > 0).length / bySide.long.length) * 100;
      const shortWR = (bySide.short.filter((t) => calculateTradePnL(t, { includeFees: true }) > 0).length / bySide.short.length) * 100;
      if (Math.abs(longWR - shortWR) >= 15) {
        bias = longWR > shortWR ? { side: 'long', winRate: longWR } : { side: 'short', winRate: shortWR };
      }
    }

    const monthlyGoal = settings?.monthly_goal_target || 0;
    const monthlyGoalPct = monthlyGoal > 0 ? Math.min(100, (monthlyProfit / monthlyGoal) * 100) : 0;
    const isGorduraActive = monthlyGoal > 0 && monthlyProfit >= monthlyGoal;
    const gorduraAmount = isGorduraActive ? monthlyProfit - monthlyGoal : 0;
    const stopBase = isGorduraActive ? gorduraAmount : capitalBase;
    const authorizedStopDollar = Math.max(0, stopBase * (riskPct / 100));

    return {
      loading: false,
      winRate,
      realWinRate,
      winRateMode,
      canUseRealWinRate,
      manualWinRatePct,
      sampleSize,
      tier,
      tierLabel: TIER_LABELS[tier],
      tierMessage: TIER_MESSAGES[tier],
      bias,
      capitalBase,
      monthlyProfit,
      monthlyGoal,
      monthlyGoalPct,
      isGorduraActive,
      gorduraAmount,
      authorizedStopDollar,
      authorizedStopPct: riskPct,
      floorPct,
      ceilingPct,
    };
  }, [last20Trades, settings, capitalBase, monthlyProfit]);

  const loading = settingsLoading || capitalLoading || tradesLoading || monthLoading;

  const addCapital = async (amount: number, notes?: string) => {
    if (!user || !subAccountId || amount === 0) return;
    const totalAfter = capitalBase + amount;
    const { error } = await supabase.from('capital_log').insert({
      user_id: user.id,
      sub_account_id: subAccountId,
      amount_added: amount,
      total_after: totalAfter,
      notes: notes || (amount > 0 ? 'Adicionado via Risk Copilot' : 'Removido via Risk Copilot'),
      log_date: new Date().toISOString().split('T')[0],
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['risk-copilot-capital-log', subAccountId] });
  };

  const updateKellyRange = async (floor: number, ceiling: number) => {
    if (!user || !subAccountId) return;
    const clampedFloor = Math.max(0, Math.min(12, floor));
    const clampedCeiling = Math.max(clampedFloor, Math.min(12, ceiling));
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, sub_account_id: subAccountId, risk_kelly_floor_pct: clampedFloor, risk_kelly_ceiling_pct: clampedCeiling },
        { onConflict: 'sub_account_id' }
      );
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['risk-copilot-settings', subAccountId] });
  };

  const updateMonthlyGoal = async (goal: number) => {
    if (!user || !subAccountId) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, sub_account_id: subAccountId, monthly_goal_target: Math.max(0, goal) },
        { onConflict: 'sub_account_id' }
      );
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['risk-copilot-settings', subAccountId] });
  };

  const updateWinRateMode = async (mode: WinRateMode, manualPct?: number) => {
    if (!user || !subAccountId) return;
    const updates: { user_id: string; sub_account_id: string; risk_win_rate_source: WinRateMode; risk_manual_win_rate?: number } = {
      user_id: user.id,
      sub_account_id: subAccountId,
      risk_win_rate_source: mode,
    };
    if (manualPct !== undefined) {
      updates.risk_manual_win_rate = Math.max(0, Math.min(100, manualPct));
    }
    const { error } = await supabase
      .from('user_settings')
      .upsert(updates, { onConflict: 'sub_account_id' });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['risk-copilot-settings', subAccountId] });
  };

  return {
    ...state,
    loading,
    addCapital,
    updateKellyRange,
    updateMonthlyGoal,
    updateWinRateMode,
  };
}
