import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Trade {
  pnl?: number;
  roi?: number;
}

export const useHiddenRewards = (trades: Trade[]) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !trades || trades.length === 0) return;

    const checkHiddenThresholds = async () => {
      const latestTrade = trades[trades.length - 1];
      if (!latestTrade) return;

      const pnl = latestTrade.pnl || 0;
      const roi = latestTrade.roi || 0;

      let triggered = false;
      let message = '';
      let xpReward = 0;

      // Check for exact profit amounts
      if (Math.abs(pnl - 1337) < 0.01) {
        triggered = true;
        message = '🎮 1337! You hit the LEET number!';
        xpReward = 100;
      } else if (Math.abs(pnl - 420) < 0.01) {
        triggered = true;
        message = '🌿 420! Nice one!';
        xpReward = 75;
      } else if (Math.abs(pnl - 777) < 0.01) {
        triggered = true;
        message = '🍀 777! Lucky number!';
        xpReward = 100;
      } else if (Math.abs(pnl - 69) < 0.01) {
        triggered = true;
        message = '😏 69! Nice!';
        xpReward = 50;
      }

      // Check for perfect ROI percentages
      if (!triggered) {
        if (Math.abs(roi - 10) < 0.1) {
          triggered = true;
          message = '🎯 Perfect 10% ROI!';
          xpReward = 50;
        } else if (Math.abs(roi - 25) < 0.1) {
          triggered = true;
          message = '🎯 Perfect 25% ROI!';
          xpReward = 75;
        } else if (Math.abs(roi - 50) < 0.1) {
          triggered = true;
          message = '🎯 Perfect 50% ROI!';
          xpReward = 100;
        } else if (Math.abs(roi - 100) < 0.1) {
          triggered = true;
          message = '🎯 Perfect 100% ROI! Double your money!';
          xpReward = 200;
        }
      }

      if (triggered) {
        // Award XP
        const { data: currentXP } = await supabase
          .from('user_xp_levels')
          .select('total_xp_earned')
          .eq('user_id', user.id)
          .maybeSingle();

        const totalXP = currentXP?.total_xp_earned || 0;

        // Upsert XP record
        await supabase
          .from('user_xp_levels')
          .upsert({
            user_id: user.id,
            total_xp_earned: totalXP + xpReward,
            current_xp: totalXP + xpReward,
            current_level: 1
          }, { onConflict: 'user_id' });

        await supabase.from('xp_activity_log').insert({
          user_id: user.id,
          activity_type: 'hidden_threshold_reward',
          xp_earned: xpReward,
          description: message,
        });

        // Show notification
        toast.success(`Milestone Reached: ${message}`, {
          description: `+${xpReward} points`,
          duration: 5000,
        });
      }
    };

    checkHiddenThresholds();
  }, [user, trades]);
};
