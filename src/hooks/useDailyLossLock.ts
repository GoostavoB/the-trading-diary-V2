import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { tradeStationEvents } from '@/utils/tradeStationEvents';

export const useDailyLossLock = (dailyLossLimit: number) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [todaysPnL, setTodaysPnL] = useState(0);
  const [overrideUntil, setOverrideUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodaysPnL();
      checkOverrideStatus();
    }
  }, [user]);

  useEffect(() => {
    // Check if locked based on PnL and override status
    const now = new Date();
    const overrideActive = overrideUntil && overrideUntil > now;

    if (!overrideActive && todaysPnL <= -dailyLossLimit) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [todaysPnL, dailyLossLimit, overrideUntil]);

  const loadTodaysPnL = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data } = await supabase
        .from('trades')
        .select('profit_loss, funding_fee, trading_fee')
        .eq('user_id', user.id)
        .gte('trade_date', today)
        .is('deleted_at', null);

      if (data) {
        const totalPnL = data.reduce((sum, t) => {
          const pnl = t.profit_loss || 0;
          const fundingFee = t.funding_fee || 0;
          const tradingFee = t.trading_fee || 0;
          return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
        }, 0);
        setTodaysPnL(totalPnL);
      }
    } catch (error) {
      console.error('Error loading today PnL:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOverrideStatus = () => {
    const stored = localStorage.getItem('daily_loss_override_until');
    if (stored) {
      const date = new Date(stored);
      const now = new Date();
      if (date > now) {
        setOverrideUntil(date);
      } else {
        localStorage.removeItem('daily_loss_override_until');
      }
    }
  };

  const override = async () => {
    const until = new Date();
    until.setMinutes(until.getMinutes() + 60);
    setOverrideUntil(until);
    localStorage.setItem('daily_loss_override_until', until.toISOString());

    if (user) {
      try {
        await supabase
          .from('daily_loss_events')
          .insert({
            user_id: user.id,
            event_date: new Date().toISOString(),
            limit_value: dailyLossLimit,
            loss_value: Math.abs(todaysPnL),
            action: 'override',
            override_expires_at: until.toISOString(),
          });

        tradeStationEvents.emit({
          type: 'dailyLock:overridden',
          payload: { until },
        });
      } catch (error) {
        console.error('Error logging override:', error);
      }
    }
  };

  const logLockTrigger = async () => {
    if (!user || isLocked) return;

    try {
      await supabase
        .from('daily_loss_events')
        .insert({
          user_id: user.id,
          event_date: new Date().toISOString(),
          limit_value: dailyLossLimit,
          loss_value: Math.abs(todaysPnL),
          action: 'triggered',
        });

      tradeStationEvents.emit({
        type: 'dailyLock:triggered',
        payload: { limit: dailyLossLimit },
      });
    } catch (error) {
      console.error('Error logging lock trigger:', error);
    }
  };

  return {
    isLocked,
    todaysPnL,
    remaining: Math.max(0, dailyLossLimit + todaysPnL),
    overrideUntil,
    loading,
    override,
    logLockTrigger,
    reload: loadTodaysPnL,
  };
};
