import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { tradeStationEvents } from '@/utils/tradeStationEvents';

export interface UserError {
  id: string;
  text: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'archived';
}

export const useErrorReflection = () => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<UserError[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyReminderShown, setDailyReminderShown] = useState(false);
  const [todaysPnL, setTodaysPnL] = useState(0);
  const [recentTradeErrors, setRecentTradeErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadErrors();
      loadTodaysPnL();
      loadRecentTradeErrors();
      checkDailyReminderStatus();
    }
  }, [user]);

  const loadErrors = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_errors')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setErrors((data || []).map(e => ({
        id: e.id,
        text: e.error_text,
        created_at: e.created_at,
        expires_at: e.expires_at,
        status: e.status as 'active' | 'archived',
      })));
    } catch (error) {
      console.error('Error loading errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysPnL = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data } = await supabase
        .from('trades')
        .select('pnl, funding_fee, trading_fee')
        .eq('user_id', user.id)
        .gte('trade_date', today)
        .is('deleted_at', null);

      if (data) {
        const totalPnL = data.reduce((sum, t) => {
          const pnl = t.pnl || 0;
          const fundingFee = t.funding_fee || 0;
          const tradingFee = t.trading_fee || 0;
          return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
        }, 0);
        setTodaysPnL(totalPnL);
      }
    } catch (error) {
      console.error('Error loading today PnL:', error);
    }
  };

  const loadRecentTradeErrors = async () => {
    if (!user) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data } = await supabase
        .from('trades')
        .select('error_tags, trade_date')
        .eq('user_id', user.id)
        .gte('trade_date', dateStr)
        .not('error_tags', 'is', null)
        .is('deleted_at', null)
        .order('trade_date', { ascending: false })
        .limit(50);

      if (data) {
        const allErrors = data.flatMap(t => t.error_tags || []);
        const uniqueErrors = [...new Set(allErrors)].filter(Boolean) as string[];
        setRecentTradeErrors(uniqueErrors.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading recent trade errors:', error);
    }
  };

  const checkDailyReminderStatus = () => {
    const lastShown = localStorage.getItem('error_reminder_last_shown');
    const today = new Date().toISOString().split('T')[0];
    setDailyReminderShown(lastShown === today);
  };

  const markDailyReminderShown = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('error_reminder_last_shown', today);
    setDailyReminderShown(true);
  };

  const addError = async (text: string) => {
    if (!user) return;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('user_errors')
        .insert({
          user_id: user.id,
          error_text: text,
          expires_at: expiresAt.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setErrors(prev => [{ 
          id: data.id, 
          text: data.error_text, 
          created_at: data.created_at, 
          expires_at: data.expires_at, 
          status: data.status as 'active' | 'archived'
        }, ...prev]);

        tradeStationEvents.emit({
          type: 'error:added',
          payload: { id: data.id, text: data.error_text },
        });
      }
    } catch (error) {
      console.error('Error adding error:', error);
      throw error;
    }
  };

  const extendError = async (id: string, days: number = 7) => {
    try {
      const error = errors.find(e => e.id === id);
      if (!error) return;

      const newExpiresAt = new Date(error.expires_at);
      newExpiresAt.setDate(newExpiresAt.getDate() + days);

      await supabase
        .from('user_errors')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('id', id);

      setErrors(prev =>
        prev.map(e => (e.id === id ? { ...e, expires_at: newExpiresAt.toISOString() } : e))
      );
    } catch (error) {
      console.error('Error extending error:', error);
    }
  };

  const archiveError = async (id: string) => {
    try {
      await supabase
        .from('user_errors')
        .update({ status: 'archived' })
        .eq('id', id);

      setErrors(prev => prev.filter(e => e.id !== id));
      
      tradeStationEvents.emit({
        type: 'error:expired',
        payload: { id },
      });
    } catch (error) {
      console.error('Error archiving error:', error);
    }
  };

  const deleteError = async (id: string) => {
    try {
      await supabase
        .from('user_errors')
        .delete()
        .eq('id', id);

      setErrors(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting error:', error);
    }
  };

  const checkCleanSheet = async (): Promise<boolean> => {
    if (!user) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      // Check for errors yesterday
      const { data: yesterdayErrors } = await supabase
        .from('user_errors')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', yesterdayStr)
        .lt('created_at', new Date().toISOString().split('T')[0]);

      if (yesterdayErrors && yesterdayErrors.length > 0) return false;

      // Check for negative PnL yesterday
      const { data: yesterdayTrades } = await supabase
        .from('trades')
        .select('pnl, funding_fee, trading_fee')
        .eq('user_id', user.id)
        .gte('trade_date', yesterdayStr)
        .lt('trade_date', new Date().toISOString().split('T')[0])
        .is('deleted_at', null);

      if (yesterdayTrades) {
        const totalPnL = yesterdayTrades.reduce((sum, t) => {
          const pnl = t.pnl || 0;
          const fundingFee = t.funding_fee || 0;
          const tradingFee = t.trading_fee || 0;
          return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
        }, 0);

        if (totalPnL < 0) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking clean sheet:', error);
      return false;
    }
  };

  return {
    errors,
    loading,
    todaysPnL,
    dailyReminderShown,
    recentTradeErrors,
    addError,
    extendError,
    archiveError,
    deleteError,
    markDailyReminderShown,
    checkCleanSheet,
    reload: loadErrors,
    reloadTradeErrors: loadRecentTradeErrors,
  };
};
