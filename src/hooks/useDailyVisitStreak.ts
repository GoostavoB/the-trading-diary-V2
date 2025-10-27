import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyStreakData {
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}

export const useDailyVisitStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    isNewRecord: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkAndUpdateStreak = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Fetch current streak data
        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('last_visit_date, current_visit_streak, longest_visit_streak')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        let currentStreak = settings?.current_visit_streak || 0;
        let longestStreak = settings?.longest_visit_streak || 0;
        const lastVisit = settings?.last_visit_date;
        let isNewRecord = false;

        // Calculate if we should update the streak
        if (!lastVisit || lastVisit !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastVisit === yesterdayStr) {
            // Consecutive day - increment streak
            currentStreak += 1;
          } else if (!lastVisit) {
            // First visit ever
            currentStreak = 1;
          } else {
            // Streak broken - reset to 1
            currentStreak = 1;
          }

          // Check if we hit a new record
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            isNewRecord = true;
          }

          // Update the database
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              last_visit_date: today,
              current_visit_streak: currentStreak,
              longest_visit_streak: longestStreak,
            }, {
              onConflict: 'user_id',
            });
        }

        setStreakData({
          currentStreak,
          longestStreak,
          isNewRecord,
        });
      } catch (error) {
        console.error('Error updating daily visit streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndUpdateStreak();
  }, [user]);

  return { ...streakData, isLoading };
};
