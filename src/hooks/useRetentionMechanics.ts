import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useXPSystem } from './useXPSystem';
import { toast } from 'sonner';

interface StreakData {
  dailyStreak: number;
  weeklyStreak: number;
  lastActiveDate: string;
  freezeTokens: number;
}

export const useRetentionMechanics = () => {
  const { user } = useAuth();
  const { addXP } = useXPSystem();
  const [streakData, setStreakData] = useState<StreakData>({
    dailyStreak: 0,
    weeklyStreak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    freezeTokens: 0,
  });
  const [showStreakWarning, setShowStreakWarning] = useState(false);
  const [daysInactive, setDaysInactive] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkStreakStatus = async () => {
      // Fetch progression data
      const { data: progression } = await supabase
        .from('user_progression')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch freeze tokens
      const { data: freezeInventory } = await supabase
        .from('streak_freeze_inventory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progression) {
        const lastActive = new Date(progression.last_active_date);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        setStreakData({
          dailyStreak: progression.daily_streak,
          weeklyStreak: progression.weekly_streak,
          lastActiveDate: progression.last_active_date,
          freezeTokens: freezeInventory?.freeze_tokens || 0,
        });

        setDaysInactive(daysDiff);

        // Show warning if streak is at risk (hasn't traded today and has streak)
        if (daysDiff === 1 && progression.daily_streak > 0) {
          setShowStreakWarning(true);
        }

        // Award comeback bonus if returning after 7+ days
        if (daysDiff >= 7) {
          await addXP(50, 'comeback_bonus', 'Welcome back! Comeback bonus awarded');
          toast.success('Welcome back! +50 XP comeback bonus', { icon: '🎉' });
        }

        // Update last active date
        if (daysDiff > 0) {
          await supabase
            .from('user_progression')
            .update({ last_active_date: today.toISOString().split('T')[0] })
            .eq('user_id', user.id);
        }
      } else {
        // Initialize progression for new user
        await supabase
          .from('user_progression')
          .insert({
            user_id: user.id,
            xp: 0,
            level: 1,
            rank: 'rookie_trader',
            daily_streak: 0,
            weekly_streak: 0,
            last_active_date: new Date().toISOString().split('T')[0],
          });
      }
    };

    checkStreakStatus();
  }, [user, addXP]);

  const useFreezeToken = useCallback(async () => {
    if (!user || streakData.freezeTokens <= 0) return;

    const { error } = await supabase
      .from('streak_freeze_inventory')
      .update({
        freeze_tokens: streakData.freezeTokens - 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      toast.success('Streak freeze activated! Your streak is safe for 24 hours', { icon: '🛡️' });
      setShowStreakWarning(false);
      setStreakData(prev => ({ ...prev, freezeTokens: prev.freezeTokens - 1 }));
    }
  }, [user, streakData]);

  const updateDailyStreak = useCallback(async () => {
    if (!user) return;

    const { data: progression } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!progression) return;

    const lastActive = new Date(progression.last_active_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let newDailyStreak = progression.daily_streak;

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newDailyStreak += 1;

      // Award milestone XP
      if (newDailyStreak === 7) {
        await addXP(100, 'streak_milestone', '7-day trading streak!');
        toast.success('🔥 7-Day Streak! +100 XP', { duration: 4000 });
      } else if (newDailyStreak === 14) {
        await addXP(250, 'streak_milestone', '14-day trading streak!');
        toast.success('🔥🔥 14-Day Streak! +250 XP', { duration: 4000 });
      } else if (newDailyStreak === 30) {
        await addXP(500, 'streak_milestone', '30-day trading streak!');
        toast.success('🔥🔥🔥 30-Day Streak! +500 XP', { duration: 5000 });
      }
    } else if (daysDiff === 0) {
      // Same day - no change
      return;
    } else {
      // Streak broken
      newDailyStreak = 1;
    }

    await supabase
      .from('user_progression')
      .update({
        daily_streak: newDailyStreak,
        last_active_date: today.toISOString().split('T')[0],
      })
      .eq('user_id', user.id);

    setStreakData(prev => ({
      ...prev,
      dailyStreak: newDailyStreak,
      lastActiveDate: today.toISOString().split('T')[0],
    }));
  }, [user, addXP]);

  return {
    streakData,
    daysInactive,
    showStreakWarning,
    setShowStreakWarning,
    useFreezeToken,
    updateDailyStreak,
  };
};
