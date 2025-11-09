import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { analytics } from '@/utils/analytics';

export interface DailyReward {
  xpReward: number;
  bonusMultiplier: number;
  rewardTier: number;
  consecutiveDays: number;
  canClaim: boolean;
  alreadyClaimed: boolean;
}

export const useDailyRewards = () => {
  const { user } = useAuth();
  const [reward, setReward] = useState<DailyReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkDailyReward();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkDailyReward = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's current reward status (use maybeSingle to handle missing records)
      const { data: tierData, error: tierError } = await supabase
        .from('user_xp_tiers')
        .select('consecutive_login_days, last_reward_claimed_date, current_tier, last_login_date, total_rewards_claimed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tierError) {
        console.error('Error fetching tier data:', tierError);
        setLoading(false);
        return;
      }

      // If no tier data exists, create it
      if (!tierData) {
        const { error: insertError } = await supabase
          .from('user_xp_tiers')
          .insert({
            user_id: user.id,
            consecutive_login_days: 0,
            consecutive_trade_days: 0,
            daily_xp_earned: 0,
            daily_upload_count: 0
          });

        if (insertError) {
          console.error('Error creating tier data:', insertError);
          setLoading(false);
          return;
        }

        // Retry fetch
        const { data: newTierData } = await supabase
          .from('user_xp_tiers')
          .select('consecutive_login_days, last_reward_claimed_date, current_tier, last_login_date, total_rewards_claimed')
          .eq('user_id', user.id)
          .single();

        if (!newTierData) {
          setLoading(false);
          return;
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const lastClaimedDate = tierData?.last_reward_claimed_date;
      const lastLoginDate = tierData?.last_login_date;

      // Check if already claimed today
      const alreadyClaimed = lastClaimedDate === today;

      // Calculate consecutive days
      let consecutiveDays = tierData?.consecutive_login_days || 0;
      
      if (!alreadyClaimed) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // If last login was yesterday, increment streak; otherwise reset to 1
        if (lastLoginDate === yesterdayStr || lastLoginDate === today) {
          consecutiveDays += 1;
        } else {
          consecutiveDays = 1;
        }
      }

      // Get reward calculation from database function
      const { data: rewardCalc, error: calcError } = await supabase
        .rpc('calculate_daily_reward', {
          p_consecutive_days: consecutiveDays,
          p_user_tier: tierData?.current_tier || 0
        });

      if (calcError) {
        console.error('Error calculating reward:', calcError);
        setLoading(false);
        return;
      }

      const rewardData = rewardCalc?.[0] || { xp_reward: 50, bonus_multiplier: 1.0, reward_tier: 1 };
      const finalXP = Math.floor(rewardData.xp_reward * rewardData.bonus_multiplier);

      setReward({
        xpReward: finalXP,
        bonusMultiplier: rewardData.bonus_multiplier,
        rewardTier: rewardData.reward_tier,
        consecutiveDays,
        canClaim: !alreadyClaimed && !!user,
        alreadyClaimed
      });

      // Auto-show modal if reward is available and not claimed
      if (!alreadyClaimed && user) {
        setShowRewardModal(true);
      }
    } catch (error) {
      console.error('Error checking daily reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (): Promise<boolean> => {
    console.info('[DailyRewards] Claim clicked');
    
    if (!user) {
      toast.error("You're not signed in", {
        description: "Please log in and try again."
      });
      return false;
    }
    
    if (!reward || !reward.canClaim) {
      console.warn('[DailyRewards] No reward available or already claiming');
      return false;
    }

    try {
      console.log('🎁 Claiming daily reward via RPC...');
      
      // Call the transactional RPC function
      const { data: rawData, error: rpcError } = await supabase
        .rpc('claim_daily_reward' as any);

      if (rpcError) {
        console.error('❌ RPC error:', rpcError);
        
        // Handle specific errors
        if (rpcError.message.includes('already claimed')) {
          toast.error("Already claimed today", {
            description: "Come back tomorrow for your next reward!"
          });
          setReward(prev => prev ? {...prev, canClaim: false, alreadyClaimed: true} : null);
          return false;
        }
        
        throw new Error(rpcError.message);
      }

      // Type assertion for RPC response
      const data = rawData as any;
      console.log('✅ Reward claimed successfully!', data);

      // Track analytics
      analytics.track('daily_reward_claimed', {
        user_id: user.id,
        xp_awarded: data.xp_awarded,
        consecutive_days: data.consecutive_days,
        total_rewards: data.total_rewards_claimed
      });

      toast.success(`🎉 Daily reward claimed! +${data.xp_awarded} XP`, {
        description: `${data.consecutive_days} day streak!`
      });

      // Update reward state
      setReward({
        ...reward,
        canClaim: false,
        alreadyClaimed: true
      });

      // Refresh data
      setTimeout(() => {
        checkDailyReward();
      }, 500);
      
      return true;
    } catch (error: any) {
      console.error('❌ Error claiming reward:', error);
      
      // Reset claiming state
      setReward(prev => prev ? {...prev, canClaim: true, alreadyClaimed: false} : null);
      
      toast.error("Failed to claim reward", {
        description: error?.message || "Please try again later.",
        duration: 5000
      });
      return false;
    }
  };

  return {
    reward,
    loading,
    showRewardModal,
    setShowRewardModal,
    claimReward,
    checkDailyReward
  };
};
