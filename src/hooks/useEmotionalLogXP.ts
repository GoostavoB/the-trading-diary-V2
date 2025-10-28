import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from './useXPSystem';
import { trackEvent } from '@/utils/analyticsEvents';

interface PsychologyLog {
  id: string;
  user_id: string;
  emotional_state: string;
  intensity: number;
  conditions: string[];
  notes: string | null;
  xp_awarded: boolean;
  created_at: string;
  logged_at: string;
}

/**
 * Hook to automatically award XP for emotional logging
 * Awards XP based on log completeness and daily cap
 */
export const useEmotionalLogXP = () => {
  const { user } = useAuth();
  const { addXP } = useXPSystem();

  // Fetch unrewarded psychology logs
  const { data: unrewardedLogs = [] } = useQuery({
    queryKey: ['unrewarded-emotional-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('psychology_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('xp_awarded', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching unrewarded emotional logs:', error);
        return [];
      }

      return data as PsychologyLog[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Process XP rewards for unrewarded logs
  useEffect(() => {
    if (!user?.id || unrewardedLogs.length === 0) return;

    const processLogXP = async () => {
      for (const log of unrewardedLogs) {
        try {
          // Check daily cap (3 logs per day)
          const { data: tierData } = await supabase
            .from('user_xp_tiers')
            .select('psychology_logs_today')
            .eq('user_id', user.id)
            .single();

          const logsToday = tierData?.psychology_logs_today || 0;

          if (logsToday >= 3) {
            console.log('[EmotionalLogXP] Daily cap reached (3 logs)');
            trackEvent('emotional_log_daily_cap_reached', {
              logs_today: logsToday,
              cap_limit: 3,
            });
            break; // Stop processing
          }

          // Calculate XP
          let xpAmount = 5; // Base XP
          const bonusReasons: string[] = [];

          // +5 XP for notes ≥ 20 characters
          if (log.notes && log.notes.length >= 20) {
            xpAmount += 5;
            bonusReasons.push('detailed notes');
            trackEvent('emotional_log_with_notes', {
              notes_length: log.notes.length,
            });
          }

          // +5 XP for extreme intensity (1-2 or 9-10)
          if (log.intensity <= 2 || log.intensity >= 9) {
            xpAmount += 5;
            bonusReasons.push('extreme emotion');
            trackEvent('extreme_emotion_logged', {
              emotional_state: log.emotional_state,
              intensity: log.intensity,
            });
          }

          // +3 XP for ≥3 conditions selected
          if (log.conditions && log.conditions.length >= 3) {
            xpAmount += 3;
            bonusReasons.push('detailed conditions');
            trackEvent('detailed_conditions_logged', {
              conditions_count: log.conditions.length,
            });
          }

          // Award XP
          const bonusText = bonusReasons.length > 0 ? ` (${bonusReasons.join(', ')})` : '';
          await addXP(
            xpAmount,
            'emotional_log',
            `Emotional state logged${bonusText}`,
            true // Skip multiplier for psychology logs
          );

          // Mark log as rewarded
          await supabase
            .from('psychology_logs')
            .update({ xp_awarded: true })
            .eq('id', log.id);

          // Increment daily counter
          await supabase.rpc('increment_psychology_logs_counter', {
            p_user_id: user.id,
          });

          // Track analytics
          trackEvent('emotional_log_created', {
            xp_awarded: xpAmount,
            emotional_state: log.emotional_state,
            intensity: log.intensity,
            has_notes: !!log.notes,
            conditions_count: log.conditions?.length || 0,
          });

          console.log(`[EmotionalLogXP] Awarded ${xpAmount} XP for emotional log`);
        } catch (error) {
          console.error('[EmotionalLogXP] Error processing log:', error);
        }
      }
    };

    processLogXP();
  }, [unrewardedLogs, user?.id, addXP]);

  return { unrewardedLogs };
};
