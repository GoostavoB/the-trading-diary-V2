import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type RiskProfile = 'low' | 'medium' | 'high';
export type Strategy = 'scalp' | 'day' | 'swing' | 'position';
export type BaseType = 'initial' | 'current' | 'profit';

export interface RiskSettings {
  risk_profile: RiskProfile;
  risk_scalp_pct: number;
  risk_day_pct: number;
  risk_swing_pct: number;
  risk_position_pct: number;
  risk_daily_loss_pct: number;
  risk_currency: string;
  risk_max_drawdown: number;
  risk_worst_streak: number;
}

export interface RiskCalculation {
  riskPerTrade: number;
  dailyLossLimit: number;
  color: 'green' | 'yellow' | 'red';
  recommendedCeiling: number;
  percentOfCeiling: number;
  positionSize?: number;
  exposure?: number;
  estimatedLeverage?: number;
}

export const useRiskCalculator = (
  currentEquity: number = 10000,
  initialCapital: number = 10000,
  accumulatedProfit: number = 0
) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RiskSettings>({
    risk_profile: 'medium',
    risk_scalp_pct: 0.5,
    risk_day_pct: 1.0,
    risk_swing_pct: 1.0,
    risk_position_pct: 1.5,
    risk_daily_loss_pct: 1.0,
    risk_currency: 'USD',
    risk_max_drawdown: 20,
    risk_worst_streak: 5,
  });
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<Strategy>('day');
  const [baseType, setBaseType] = useState<BaseType>('current');
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('risk_profile, risk_scalp_pct, risk_day_pct, risk_swing_pct, risk_position_pct, risk_daily_loss_pct, risk_currency, risk_max_drawdown, risk_worst_streak')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching risk settings:', error);
      return;
    }

    if (data) {
      setSettings({
        risk_profile: data.risk_profile as RiskProfile || 'medium',
        risk_scalp_pct: data.risk_scalp_pct ?? 0.5,
        risk_day_pct: data.risk_day_pct ?? 1.0,
        risk_swing_pct: data.risk_swing_pct ?? 1.0,
        risk_position_pct: data.risk_position_pct ?? 1.5,
        risk_daily_loss_pct: data.risk_daily_loss_pct ?? 1.0,
        risk_currency: data.risk_currency || 'USD',
        risk_max_drawdown: data.risk_max_drawdown ?? 20,
        risk_worst_streak: data.risk_worst_streak ?? 5,
      });
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getBaseValue = useCallback(() => {
    switch (baseType) {
      case 'initial':
        return initialCapital;
      case 'profit':
        return accumulatedProfit;
      case 'current':
      default:
        return currentEquity;
    }
  }, [baseType, initialCapital, accumulatedProfit, currentEquity]);

  const getRiskPercent = useCallback(() => {
    switch (strategy) {
      case 'scalp':
        return settings.risk_scalp_pct;
      case 'day':
        return settings.risk_day_pct;
      case 'swing':
        return settings.risk_swing_pct;
      case 'position':
        return settings.risk_position_pct;
      default:
        return settings.risk_day_pct;
    }
  }, [strategy, settings]);

  const calculation = useMemo((): RiskCalculation => {
    const base = getBaseValue();
    const riskPct = getRiskPercent();
    const riskPerTrade = base * (riskPct / 100);
    const dailyLossLimit = currentEquity * (settings.risk_daily_loss_pct / 100);

    // Calculate recommended ceiling
    const accountScale = Math.pow(currentEquity, -0.6);
    const profileFactor = settings.risk_profile === 'low' ? 0.7 : 
                          settings.risk_profile === 'high' ? 1.3 : 1.0;
    const ddFactor = Math.min(1, settings.risk_max_drawdown / settings.risk_worst_streak);
    const recommendedCeiling = accountScale * profileFactor * ddFactor * currentEquity * 0.02;

    // Calculate color state
    const percentOfCeiling = (riskPerTrade / recommendedCeiling) * 100;
    let color: 'green' | 'yellow' | 'red';
    if (percentOfCeiling <= 50) color = 'green';
    else if (percentOfCeiling <= 100) color = 'yellow';
    else color = 'red';

    // Position sizing if entry and stop are provided
    let positionSize: number | undefined;
    let exposure: number | undefined;
    let estimatedLeverage: number | undefined;

    if (entryPrice && stopPrice && entryPrice !== stopPrice) {
      const priceDistance = Math.abs(entryPrice - stopPrice);
      positionSize = riskPerTrade / priceDistance;
      exposure = positionSize * entryPrice;
      estimatedLeverage = exposure / currentEquity;
    }

    return {
      riskPerTrade,
      dailyLossLimit,
      color,
      recommendedCeiling,
      percentOfCeiling,
      positionSize,
      exposure,
      estimatedLeverage,
    };
  }, [getBaseValue, getRiskPercent, currentEquity, settings, entryPrice, stopPrice]);

  const applyRecommendations = useCallback(() => {
    let newSettings: Partial<RiskSettings> = {};

    if (currentEquity < 2000) {
      newSettings = {
        risk_scalp_pct: 0.75,
        risk_day_pct: 1.0,
        risk_swing_pct: 1.5,
        risk_position_pct: 2.0,
        risk_daily_loss_pct: 1.0,
      };
    } else if (currentEquity <= 10000) {
      newSettings = {
        risk_scalp_pct: 0.5,
        risk_day_pct: 1.0,
        risk_swing_pct: 1.0,
        risk_position_pct: 1.5,
        risk_daily_loss_pct: 1.0,
      };
    } else {
      newSettings = {
        risk_scalp_pct: 0.25,
        risk_day_pct: 0.5,
        risk_swing_pct: 0.75,
        risk_position_pct: 1.0,
        risk_daily_loss_pct: 1.0,
      };
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Recommendations applied based on equity');
  }, [currentEquity]);

  const updateSettings = useCallback(async (newSettings: Partial<RiskSettings>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating risk settings:', error);
      toast.error('Failed to update settings');
      return;
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
    
    window.dispatchEvent(new CustomEvent('risk:updated', { 
      detail: { 
        strategy,
        base: getBaseValue(),
        riskPct: getRiskPercent(),
        riskValue: calculation.riskPerTrade,
        dailyLoss: calculation.dailyLossLimit,
        currency: settings.risk_currency,
        profile: settings.risk_profile,
        ...calculation,
      } 
    }));
  }, [user?.id, strategy, getBaseValue, getRiskPercent, calculation, settings]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.risk_currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [settings.risk_currency]);

  return {
    settings,
    loading,
    strategy,
    baseType,
    entryPrice,
    stopPrice,
    calculation,
    setStrategy,
    setBaseType,
    setEntryPrice,
    setStopPrice,
    applyRecommendations,
    updateSettings,
    formatCurrency,
    refresh: fetchSettings,
  };
};
