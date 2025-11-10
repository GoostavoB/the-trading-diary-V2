import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PreFlightCheck {
  spx: boolean;
  lsr: boolean;
  errors: boolean;
  calendar: boolean;
}

export interface PreFlightSettings {
  preflight_required: boolean;
  preflight_calendar_url?: string;
}

export interface TradingSession {
  id: string;
  user_id: string;
  session_date: string;
  preflight_completed: boolean;
  preflight_bypassed: boolean;
  spx_trend?: string;
  lsr_value?: number;
  started_at: string;
  pnl_day: number;
  trades_count: number;
}

export const usePreFlight = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<PreFlightCheck>({
    spx: false,
    lsr: false,
    errors: false,
    calendar: false,
  });
  const [settings, setSettings] = useState<PreFlightSettings>({
    preflight_required: false,
  });
  const [session, setSession] = useState<TradingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [lsrValue, setLsrValue] = useState<number | null>(null);
  const [spxTrend, setSpxTrend] = useState<string>('');

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('preflight_required, preflight_calendar_url')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preflight settings:', error);
      return;
    }

    if (data) {
      setSettings({
        preflight_required: data.preflight_required ?? false,
        preflight_calendar_url: data.preflight_calendar_url,
      });
    }
  }, [user?.id]);

  const fetchTodaySession = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session:', error);
      return;
    }

    setSession(data || null);

    if (data?.preflight_completed || data?.preflight_bypassed) {
      setChecks({
        spx: true,
        lsr: true,
        errors: true,
        calendar: true,
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchTodaySession()]);
      setLoading(false);
    };

    loadData();
  }, [fetchSettings, fetchTodaySession]);

  const toggleCheck = useCallback((checkName: keyof PreFlightCheck) => {
    setChecks(prev => ({ ...prev, [checkName]: !prev[checkName] }));
  }, []);

  const isComplete = useCallback(() => {
    return checks.spx && checks.lsr && checks.errors && checks.calendar;
  }, [checks]);

  const canStart = useCallback(() => {
    if (!settings.preflight_required) return true;
    return isComplete();
  }, [settings.preflight_required, isComplete]);

  const completePreFlight = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trading_sessions')
      .upsert({
        user_id: user.id,
        session_date: today,
        preflight_completed: true,
        spx_trend: spxTrend || null,
        lsr_value: lsrValue,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,session_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error completing preflight:', error);
      toast.error('Failed to complete pre-flight');
      return;
    }

    setSession(data);
    toast.success('Pre-flight completed! Ready to trade.');
    
    window.dispatchEvent(new CustomEvent('preflight:completed', { 
      detail: { 
        spxTrend, 
        lsrValue,
        timestamp: new Date().toISOString(),
      } 
    }));
  }, [user?.id, spxTrend, lsrValue]);

  const bypassPreFlight = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trading_sessions')
      .upsert({
        user_id: user.id,
        session_date: today,
        preflight_bypassed: true,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,session_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error bypassing preflight:', error);
      toast.error('Failed to bypass pre-flight');
      return;
    }

    setSession(data);
    setChecks({
      spx: true,
      lsr: true,
      errors: true,
      calendar: true,
    });
    toast.info('Pre-flight bypassed for today');
    
    window.dispatchEvent(new CustomEvent('preflight:bypassed', { 
      detail: { 
        date: today,
        reason: 'user_bypass',
      } 
    }));
  }, [user?.id]);

  const updateSettings = useCallback(async (newSettings: Partial<PreFlightSettings>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating preflight settings:', error);
      toast.error('Failed to update settings');
      return;
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
    
    if ('preflight_required' in newSettings) {
      window.dispatchEvent(new CustomEvent('preflight:strictToggled', { 
        detail: { enabled: newSettings.preflight_required } 
      }));
    }
  }, [user?.id]);

  const getLsrBias = useCallback((lsr: number) => {
    if (lsr > 2) return { text: 'Avoid long positions', color: 'text-red-500' };
    if (lsr < 1) return { text: 'Avoid short positions', color: 'text-red-500' };
    return { text: 'Neutral bias', color: 'text-muted-foreground' };
  }, []);

  return {
    checks,
    settings,
    session,
    loading,
    lsrValue,
    spxTrend,
    setLsrValue,
    setSpxTrend,
    toggleCheck,
    isComplete,
    canStart,
    completePreFlight,
    bypassPreFlight,
    updateSettings,
    getLsrBias,
    refresh: fetchTodaySession,
  };
};
