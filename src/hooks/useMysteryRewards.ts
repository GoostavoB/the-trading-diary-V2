import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from './useXPSystem';
import { toast } from 'sonner';

interface MysteryReward {
  id: string;
  reward_type: string;
  reward_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface MysteryRewardResult {
  reward: MysteryReward;
  animation: 'common' | 'rare' | 'epic' | 'legendary';
}

export const useMysteryRewards = () => {
  const { user } = useAuth();
  const { addXP } = useXPSystem();
  const [availableRewards, setAvailableRewards] = useState<MysteryReward[]>([]);
  const [tradeCount, setTradeCount] = useState(0);
  const [lastRewardTrade, setLastRewardTrade] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchRewards = async () => {
      const { data } = await supabase
        .from('mystery_rewards')
        .select('*')
        .eq('is_active', true);

      if (data) {
        setAvailableRewards(data.map(r => ({
          ...r,
          rarity: r.rarity as 'common' | 'rare' | 'epic' | 'legendary'
        })));
      }
    };

    const fetchTradeCount = async () => {
      const { count } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTradeCount(count || 0);
    };

    fetchRewards();
    fetchTradeCount();
  }, [user]);

  const checkEligibility = useCallback((): boolean => {
    // Random chance: 1 in 20 trades gets a mystery reward
    const randomChance = Math.random() < 0.05;
    
    // Minimum trades since last reward
    const tradesSinceReward = tradeCount - lastRewardTrade;
    const enoughTrades = tradesSinceReward >= 5;

    return randomChance && enoughTrades && availableRewards.length > 0;
  }, [tradeCount, lastRewardTrade, availableRewards]);

  const triggerMysteryReward = useCallback(async (): Promise<MysteryRewardResult | null> => {
    if (!checkEligibility()) return null;

    // Weighted random selection based on rarity
    const rarityWeights = {
      common: 50,
      rare: 30,
      epic: 15,
      legendary: 5,
    };

    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    const randomValue = Math.random() * totalWeight;
    
    let selectedRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
    let cumulativeWeight = 0;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeWeight += weight;
      if (randomValue <= cumulativeWeight) {
        selectedRarity = rarity as typeof selectedRarity;
        break;
      }
    }

    // Select reward of chosen rarity
    const rarityRewards = availableRewards.filter(r => r.rarity === selectedRarity);
    if (rarityRewards.length === 0) return null;

    const reward = rarityRewards[Math.floor(Math.random() * rarityRewards.length)];

    // Award the reward
    if (reward.reward_type === 'xp_boost') {
      await addXP(reward.reward_value, 'mystery_reward', `Mystery reward: +${reward.reward_value} XP!`);
    } else if (reward.reward_type === 'freeze_token') {
      // Add freeze token to inventory directly
      await supabase
        .from('streak_freeze_inventory')
        .upsert({
          user_id: user?.id,
          freeze_tokens: 1,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        });
    }
    // TODO: Handle other reward types (badge_unlock, theme_unlock, profile_frame)

    // Log the event
    await supabase
      .from('dopamine_events')
      .insert({
        user_id: user?.id,
        event_type: 'mystery_reward',
        xp_awarded: reward.reward_type === 'xp_boost' ? reward.reward_value : 0,
        animation_type: reward.rarity,
        sound_type: 'mystery_reward',
      });

    setLastRewardTrade(tradeCount);

    // Determine animation based on rarity (1 in 20 gets rare animation)
    const isRareAnimation = Math.random() < 0.05;
    const animation: 'common' | 'rare' | 'epic' | 'legendary' = isRareAnimation ? 'legendary' : reward.rarity;

    return { reward, animation };
  }, [checkEligibility, availableRewards, addXP, user, tradeCount]);

  return {
    checkEligibility,
    triggerMysteryReward,
    availableRewards,
  };
};
