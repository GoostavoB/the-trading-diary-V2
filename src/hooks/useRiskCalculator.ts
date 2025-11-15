import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { tradeStationEvents } from '@/utils/tradeStationEvents';
import { calculateTradePnL } from '@/utils/pnl';

export interface RiskCalculation {
  riskPerTrade: number;
  dailyLossLimit: number;
  positionSize?: number;
  exposure?: number;
  estimatedLeverage?: number;
  colorState: 'green' | 'amber' | 'red';
}

export const useRiskCalculator = () => {
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();
  const [initialCapital, setInitialCapital] = useState(0);
  const [currentEquity, setCurrentEquity] = useState(0);
  const [profitOnly, setProfitOnly] = useState(0);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [dailyLossPercent, setDailyLossPercent] = useState(2.0);
  const [base, setBase] = useState<'initial' | 'equity' | 'profit'>('equity');
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Fetch initial investment
      const { data: settings } = await supabase
        .from('user_settings')
        .select('initial_investment, risk_percent, daily_loss_percent, risk_base')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setInitialCapital(settings.initial_investment || 0);
        setRiskPercent(settings.risk_percent || 1.0);
        setDailyLossPercent(settings.daily_loss_percent || 2.0);
        setBase((settings.risk_base || 'equity') as 'initial' | 'equity' | 'profit');
      }

      // Fetch capital log for total invested capital
      const { data: capitalLog } = await supabase
        .from('capital_log')
        .select('amount_added')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      const totalCapitalAdditions = capitalLog?.reduce((sum, entry) => sum + (entry.amount_added || 0), 0) || 0;
      const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : (settings?.initial_investment || 0);

      // Fetch all trades for equity calculation
      const { data: trades } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (trades) {
        const totalPnL = trades.reduce((sum, t) => {
          return sum + calculateTradePnL(t, { includeFees: true });
        }, 0);

        setInitialCapital(baseCapital);
        setCurrentEquity(baseCapital + totalPnL);
        setProfitOnly(Math.max(0, totalPnL));
      }
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculation: RiskCalculation = useMemo(() => {
    let baseValue = 0;
    if (base === 'initial') baseValue = initialCapital;
    else if (base === 'equity') baseValue = currentEquity;
    else if (base === 'profit') baseValue = profitOnly;

    const riskPerTrade = (baseValue * riskPercent) / 100;
    const dailyLossLimit = (baseValue * dailyLossPercent) / 100;

    let positionSize: number | undefined;
    let exposure: number | undefined;
    let estimatedLeverage: number | undefined;

    if (entryPrice && stopPrice && entryPrice !== stopPrice) {
      const stopDistance = Math.abs(entryPrice - stopPrice);
      positionSize = riskPerTrade / stopDistance;
      exposure = positionSize * entryPrice;
      estimatedLeverage = currentEquity > 0 ? exposure / currentEquity : 0;
    }

    // Color state based on risk ceiling
    // Simple formula: ceiling gets tighter as equity grows
    const ceiling = Math.max(0.5, 2.0 - (currentEquity / 10000) * 0.5);
    let colorState: 'green' | 'amber' | 'red' = 'green';
    if (riskPercent >= ceiling * 0.8) colorState = 'amber';
    if (riskPercent >= ceiling) colorState = 'red';

    return {
      riskPerTrade,
      dailyLossLimit,
      positionSize,
      exposure,
      estimatedLeverage,
      colorState,
    };
  }, [base, initialCapital, currentEquity, profitOnly, riskPercent, dailyLossPercent, entryPrice, stopPrice]);

  const updateRiskPercent = async (value: number) => {
    const clamped = Math.max(0, Math.min(20, value));
    setRiskPercent(clamped);

    if (user) {
      await supabase
        .from('user_settings')
        .update({ risk_percent: clamped })
        .eq('user_id', user.id);
    }

    tradeStationEvents.emit({
      type: 'risk:updated',
      payload: { riskValue: calculation.riskPerTrade, currency: currency.code },
    });
  };

  const updateBase = async (newBase: 'initial' | 'equity' | 'profit') => {
    setBase(newBase);

    if (user) {
      await supabase
        .from('user_settings')
        .update({ risk_base: newBase })
        .eq('user_id', user.id);
    }
  };

  const updateDailyLossPercent = async (value: number) => {
    const clamped = Math.max(0, Math.min(10, value));
    setDailyLossPercent(clamped);

    if (user) {
      await supabase
        .from('user_settings')
        .update({ daily_loss_percent: clamped })
        .eq('user_id', user.id);
    }
  };

  return {
    calculation,
    riskPercent,
    dailyLossPercent,
    base,
    entryPrice,
    stopPrice,
    loading,
    initialCapital,
    currentEquity,
    updateRiskPercent,
    updateBase,
    setEntryPrice,
    setStopPrice,
    updateDailyLossPercent,
    reload: loadData,
  };
};
