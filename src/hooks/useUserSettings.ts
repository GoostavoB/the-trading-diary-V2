import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TradeStationSettings {
  // Risk Calculator
  risk_strategy: 'scalp' | 'day' | 'swing' | 'position';
  risk_base: 'initial' | 'equity' | 'profit';
  risk_percent: number;
  daily_loss_percent: number;
  
  // Error Reflection
  error_daily_reminder: boolean;
  error_reminder_paused_until: string | null;
  error_clean_sheet_enabled: boolean;
  error_pnl_prompt_enabled: boolean;
  error_pnl_threshold_value: number;
  error_pnl_threshold_type: 'value' | 'percent';
  
  // Pre-flight
  preflight_required: boolean;
  preflight_calendar_url: string | null;
  
  // Daily Loss Lock
  daily_loss_lock_enabled: boolean;
  
  // Rolling Target Tracker
  rolling_target_percent: number;
  rolling_target_mode: 'per-day' | 'rolling';
  rolling_target_carryover_cap: number;
  rolling_target_suggestion_method: 'median' | 'risk-aware';
  rolling_target_suggestions_enabled: boolean;
  rolling_target_rollover_weekends: boolean;
  rolling_target_last_suggestion_date: string | null;
  rolling_target_dismissed_suggestion: boolean;
  
  // Duplicate Detection
  duplicate_review_enabled: boolean;
  duplicate_review_last_shown: string | null;
  duplicate_review_seen: boolean;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TradeStationSettings>({
    risk_strategy: 'day',
    risk_base: 'equity',
    risk_percent: 1.0,
    daily_loss_percent: 2.0,
    error_daily_reminder: false,
    error_reminder_paused_until: null,
    error_clean_sheet_enabled: false,
    error_pnl_prompt_enabled: false,
    error_pnl_threshold_value: 100,
    error_pnl_threshold_type: 'value',
    preflight_required: false,
    preflight_calendar_url: null,
    daily_loss_lock_enabled: false,
    rolling_target_percent: 1.0,
    rolling_target_mode: 'per-day',
    rolling_target_carryover_cap: 2.0,
    rolling_target_suggestion_method: 'median',
    rolling_target_suggestions_enabled: true,
    rolling_target_rollover_weekends: true,
    rolling_target_last_suggestion_date: null,
    rolling_target_dismissed_suggestion: false,
    duplicate_review_enabled: true,
    duplicate_review_last_shown: null,
    duplicate_review_seen: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          risk_strategy: (data.risk_strategy || 'day') as 'scalp' | 'day' | 'swing' | 'position',
          risk_base: (data.risk_base || 'equity') as 'initial' | 'equity' | 'profit',
          risk_percent: data.risk_percent || 1.0,
          daily_loss_percent: data.daily_loss_percent || 2.0,
          error_daily_reminder: data.error_daily_reminder || false,
          error_reminder_paused_until: data.error_reminder_paused_until,
          error_clean_sheet_enabled: data.error_clean_sheet_enabled || false,
          error_pnl_prompt_enabled: data.error_pnl_prompt_enabled || false,
          error_pnl_threshold_value: data.error_pnl_threshold_value || 100,
          error_pnl_threshold_type: (data.error_pnl_threshold_type || 'value') as 'value' | 'percent',
          preflight_required: data.preflight_required || false,
          preflight_calendar_url: data.preflight_calendar_url,
          daily_loss_lock_enabled: data.daily_loss_lock_enabled || false,
          rolling_target_percent: data.rolling_target_percent || 1.0,
          rolling_target_mode: (data.rolling_target_mode || 'per-day') as 'per-day' | 'rolling',
          rolling_target_carryover_cap: data.rolling_target_carryover_cap || 2.0,
          rolling_target_suggestion_method: (data.rolling_target_suggestion_method || 'median') as 'median' | 'risk-aware',
          rolling_target_suggestions_enabled: data.rolling_target_suggestions_enabled ?? true,
          rolling_target_rollover_weekends: data.rolling_target_rollover_weekends ?? true,
          rolling_target_last_suggestion_date: data.rolling_target_last_suggestion_date,
          rolling_target_dismissed_suggestion: data.rolling_target_dismissed_suggestion || false,
          duplicate_review_enabled: data.duplicate_review_enabled ?? true,
          duplicate_review_last_shown: data.duplicate_review_last_shown,
          duplicate_review_seen: data.duplicate_review_seen || false,
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof TradeStationSettings>(
    key: K,
    value: TradeStationSettings[K]
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  return {
    settings,
    loading,
    updateSetting,
    reload: loadSettings,
  };
};
