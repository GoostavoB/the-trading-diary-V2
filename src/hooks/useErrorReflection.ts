import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserError {
  id: string;
  user_id: string;
  error_text: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'archived' | 'expired';
  trade_id?: string;
}

export interface ErrorReflectionSettings {
  error_daily_reminder: boolean;
  error_pnl_prompt_enabled: boolean;
  error_pnl_threshold: number;
  error_pnl_threshold_unit: 'abs' | 'pct';
  error_clean_sheet: boolean;
  error_reminder_paused_until?: string;
}

export const useErrorReflection = () => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<UserError[]>([]);
  const [settings, setSettings] = useState<ErrorReflectionSettings>({
    error_daily_reminder: false,
    error_pnl_prompt_enabled: false,
    error_pnl_threshold: 50,
    error_pnl_threshold_unit: 'abs',
    error_clean_sheet: false,
  });
  const [loading, setLoading] = useState(true);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [showCleanSheet, setShowCleanSheet] = useState(false);

  const fetchErrors = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_errors')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching errors:', error);
      return;
    }

    setErrors((data || []) as UserError[]);
  }, [user?.id]);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('error_daily_reminder, error_pnl_prompt_enabled, error_pnl_threshold, error_pnl_threshold_unit, error_clean_sheet, error_reminder_paused_until')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings({
        error_daily_reminder: data.error_daily_reminder ?? false,
        error_pnl_prompt_enabled: data.error_pnl_prompt_enabled ?? false,
        error_pnl_threshold: data.error_pnl_threshold ?? 50,
        error_pnl_threshold_unit: (data.error_pnl_threshold_unit as 'abs' | 'pct') ?? 'abs',
        error_clean_sheet: data.error_clean_sheet ?? false,
        error_reminder_paused_until: data.error_reminder_paused_until,
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchErrors(), fetchSettings()]);
      setLoading(false);
    };

    loadData();
  }, [fetchErrors, fetchSettings]);

  const addError = useCallback(async (errorText: string, daysToExpire: number = 7, tradeId?: string) => {
    if (!user?.id) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToExpire);

    const { data, error } = await supabase
      .from('user_errors')
      .insert({
        user_id: user.id,
        error_text: errorText,
        expires_at: expiresAt.toISOString(),
        trade_id: tradeId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding error:', error);
      toast.error('Failed to add error');
      return;
    }

    setErrors(prev => [data as UserError, ...prev]);
    toast.success('Error logged successfully');
    
    window.dispatchEvent(new CustomEvent('error:added', { detail: data }));
  }, [user?.id]);

  const archiveError = useCallback(async (errorId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_errors')
      .update({ status: 'archived' })
      .eq('id', errorId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error archiving error:', error);
      toast.error('Failed to archive error');
      return;
    }

    setErrors(prev => prev.filter(e => e.id !== errorId));
    toast.success('Error archived');
  }, [user?.id]);

  const deleteError = useCallback(async (errorId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_errors')
      .delete()
      .eq('id', errorId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting error:', error);
      toast.error('Failed to delete error');
      return;
    }

    setErrors(prev => prev.filter(e => e.id !== errorId));
    toast.success('Error deleted');
  }, [user?.id]);

  const updateSettings = useCallback(async (newSettings: Partial<ErrorReflectionSettings>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      return;
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
    
    if ('error_daily_reminder' in newSettings) {
      window.dispatchEvent(new CustomEvent('errorReminder:toggled', { 
        detail: { enabled: newSettings.error_daily_reminder } 
      }));
    }
    
    if ('error_pnl_prompt_enabled' in newSettings) {
      window.dispatchEvent(new CustomEvent('pnlPrompt:toggled', { 
        detail: { enabled: newSettings.error_pnl_prompt_enabled } 
      }));
    }
  }, [user?.id]);

  const pauseReminder = useCallback(async (days: number = 7) => {
    const pausedUntil = new Date();
    pausedUntil.setDate(pausedUntil.getDate() + days);
    await updateSettings({ error_reminder_paused_until: pausedUntil.toISOString() });
    toast.success(`Reminders paused for ${days} days`);
  }, [updateSettings]);

  const recordTradeResult = useCallback(async (pnl: number, hadStop: boolean) => {
    if (!settings.error_pnl_prompt_enabled) return;

    const threshold = settings.error_pnl_threshold_unit === 'pct' 
      ? (pnl / 100) 
      : pnl;

    const isPastThreshold = settings.error_pnl_threshold_unit === 'pct'
      ? pnl < -Math.abs(settings.error_pnl_threshold)
      : pnl < -Math.abs(threshold);

    if (isPastThreshold) {
      window.dispatchEvent(new CustomEvent('error:promptShown', { 
        detail: { pnl, threshold: settings.error_pnl_threshold } 
      }));
    }
  }, [settings]);

  return {
    errors,
    settings,
    loading,
    showDailyReminder,
    showCleanSheet,
    addError,
    archiveError,
    deleteError,
    updateSettings,
    pauseReminder,
    recordTradeResult,
    refresh: fetchErrors,
  };
};
