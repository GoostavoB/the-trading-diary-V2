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

      // Get user's current reward status
      const { data: tierData, error: tierError } = await supabase
        .from('user_xp_tiers')
        .select('consecutive_login_days, last_reward_claimed_date, current_tier, last_login_date, total_rewards_claimed')
        .eq('user_id', user.id)
        .single();

      if (tierError) {
        console.error('Error fetching tier data:', tierError);
        setLoading(false);
        return;
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

  const claimReward = async () => {
    if (!user || !reward || !reward.canClaim) return;

    // Wrap entire operation in a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Claim timeout - operation took too long')), 15000);
    });

    const claimPromise = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        console.log('📝 Step 1: Fetching current tier data...');
        const { data: currentTierData, error: tierFetchError } = await Promise.race([
          supabase
            .from('user_xp_tiers')
            .select('total_rewards_claimed')
            .eq('user_id', user.id)
            .single(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tier fetch timeout')), 5000))
        ]) as any;

        if (tierFetchError) {
          console.error('❌ Failed to fetch tier data:', tierFetchError);
          throw new Error('Failed to fetch user tier data');
        }

        console.log('📝 Step 2: Inserting reward log...');
        const { error: logError } = await Promise.race([
          supabase
            .from('daily_rewards_log')
            .insert({
              user_id: user.id,
              reward_date: today,
              consecutive_days: reward.consecutiveDays,
              xp_awarded: reward.xpReward,
              bonus_multiplier: reward.bonusMultiplier,
              reward_tier: reward.rewardTier
            }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Log insert timeout')), 5000))
        ]) as any;

        if (logError) {
          console.error('❌ Failed to insert reward log:', logError);
          throw logError;
        }

        console.log('📝 Step 3: Updating user_xp_tiers...');
        const { error: updateError } = await Promise.race([
          supabase
            .from('user_xp_tiers')
            .update({
              consecutive_login_days: reward.consecutiveDays,
              last_reward_claimed_date: today,
              total_rewards_claimed: (currentTierData?.total_rewards_claimed || 0) + 1
            })
            .eq('user_id', user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tier update timeout')), 5000))
        ]) as any;

        if (updateError) {
          console.error('❌ Failed to update tier:', updateError);
          throw updateError;
        }

        console.log('📝 Step 4: Fetching current XP...');
        const { data: xpData, error: xpFetchError } = await Promise.race([
          supabase
            .from('user_xp_levels')
            .select('total_xp_earned')
            .eq('user_id', user.id)
            .single(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('XP fetch timeout')), 5000))
        ]) as any;

        if (xpFetchError) {
          console.error('❌ Failed to fetch XP data:', xpFetchError);
          throw xpFetchError;
        }

        console.log('📝 Step 5: Updating XP...');
        const { error: xpError } = await Promise.race([
          supabase
            .from('user_xp_levels')
            .update({
              total_xp_earned: (xpData?.total_xp_earned || 0) + reward.xpReward
            })
            .eq('user_id', user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('XP update timeout')), 5000))
        ]) as any;

        if (xpError) {
          console.error('❌ Failed to update XP:', xpError);
          throw xpError;
        }

        console.log('✅ Reward claimed successfully!');

        // Track analytics
        analytics.track('daily_reward_claimed', {
          user_id: user.id,
          xp_awarded: reward.xpReward,
          consecutive_days: reward.consecutiveDays,
          reward_tier: reward.rewardTier,
          bonus_multiplier: reward.bonusMultiplier
        });

        toast.success(`🎉 Daily reward claimed! +${reward.xpReward} XP`, {
          description: `${reward.consecutiveDays} day streak!`
        });

        // Update reward state
        setReward({
          ...reward,
          canClaim: false,
          alreadyClaimed: true
        });

        setShowRewardModal(false);

        // Refresh data
        await checkDailyReward();
      } catch (error) {
        console.error('❌ Error in claim operation:', error);
        throw error;
      }
    };

    try {
      await Promise.race([claimPromise(), timeoutPromise]);
    } catch (error) {
      console.error('❌ Error claiming reward:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to claim reward', {
        description: errorMessage + '. Please try again.'
      });
      // Re-throw so modal can handle it
      throw error;
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
