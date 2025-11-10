import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DailyLossLockSettings {
  daily_loss_lock_enabled: boolean;
  daily_loss_lock_last_override?: string;
}

export interface DailyLossEvent {
  id: string;
  user_id: string;
  event_date: string;
  loss_value: number;
  limit_value: number;
  action: 'triggered' | 'overridden' | 'disabled';
  created_at: string;
  override_expires_at?: string;
}

export const useDailyLossLock = (
  currentDailyPnL: number,
  dailyLossLimit: number
) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DailyLossLockSettings>({
    daily_loss_lock_enabled: false,
  });
  const [isLocked, setIsLocked] = useState(false);
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [overrideExpiresAt, setOverrideExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('daily_loss_lock_enabled, daily_loss_lock_last_override')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching daily loss lock settings:', error);
      return;
    }

    if (data) {
      setSettings({
        daily_loss_lock_enabled: data.daily_loss_lock_enabled ?? false,
        daily_loss_lock_last_override: data.daily_loss_lock_last_override,
      });

      // Check if override is still active
      if (data.daily_loss_lock_last_override) {
        const lastOverride = new Date(data.daily_loss_lock_last_override);
        const expiresAt = new Date(lastOverride.getTime() + 60 * 60 * 1000); // 60 minutes
        const now = new Date();

        if (now < expiresAt) {
          setIsOverrideActive(true);
          setOverrideExpiresAt(expiresAt);
        }
      }
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check if daily loss limit is hit
  useEffect(() => {
    if (!settings.daily_loss_lock_enabled) {
      setIsLocked(false);
      return;
    }

    if (isOverrideActive) {
      setIsLocked(false);
      return;
    }

    const limitHit = currentDailyPnL <= -Math.abs(dailyLossLimit);
    setIsLocked(limitHit);

    if (limitHit) {
      triggerLock();
    }
  }, [currentDailyPnL, dailyLossLimit, settings.daily_loss_lock_enabled, isOverrideActive]);

  const triggerLock = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('daily_loss_events')
      .insert({
        user_id: user.id,
        loss_value: Math.abs(currentDailyPnL),
        limit_value: dailyLossLimit,
        action: 'triggered',
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging daily loss event:', error);
      return;
    }

    window.dispatchEvent(new CustomEvent('dailyLock:triggered', { 
      detail: { 
        lossValue: Math.abs(currentDailyPnL),
        limitValue: dailyLossLimit,
      } 
    }));

    toast.error('Daily loss limit reached. Trading is locked.', {
      duration: 10000,
    });
  }, [user?.id, currentDailyPnL, dailyLossLimit]);

  const overrideLock = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes

    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({ daily_loss_lock_last_override: now.toISOString() })
      .eq('user_id', user.id);

    if (settingsError) {
      console.error('Error updating override:', settingsError);
      toast.error('Failed to override lock');
      return;
    }

    const { error: eventError } = await supabase
      .from('daily_loss_events')
      .insert({
        user_id: user.id,
        loss_value: Math.abs(currentDailyPnL),
        limit_value: dailyLossLimit,
        action: 'overridden',
        override_expires_at: expiresAt.toISOString(),
      });

    if (eventError) {
      console.error('Error logging override event:', eventError);
    }

    setIsOverrideActive(true);
    setOverrideExpiresAt(expiresAt);
    setIsLocked(false);
    setSettings(prev => ({ ...prev, daily_loss_lock_last_override: now.toISOString() }));

    window.dispatchEvent(new CustomEvent('dailyLock:overridden', { 
      detail: { durationMinutes: 60 } 
    }));

    toast.success('Lock overridden for 60 minutes');
  }, [user?.id, currentDailyPnL, dailyLossLimit]);

  const updateSettings = useCallback(async (enabled: boolean) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_settings')
      .update({ daily_loss_lock_enabled: enabled })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating daily loss lock settings:', error);
      toast.error('Failed to update settings');
      return;
    }

    setSettings(prev => ({ ...prev, daily_loss_lock_enabled: enabled }));
    
    window.dispatchEvent(new CustomEvent('dailyLock:toggled', { 
      detail: { enabled } 
    }));

    toast.success(enabled ? 'Daily loss lock enabled' : 'Daily loss lock disabled');
  }, [user?.id]);

  const getRemainingOverrideTime = useCallback(() => {
    if (!isOverrideActive || !overrideExpiresAt) return 0;
    
    const now = new Date();
    const remaining = overrideExpiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 60000)); // minutes
  }, [isOverrideActive, overrideExpiresAt]);

  return {
    settings,
    loading,
    isLocked,
    isOverrideActive,
    overrideExpiresAt,
    overrideLock,
    updateSettings,
    getRemainingOverrideTime,
    refresh: fetchSettings,
  };
};
