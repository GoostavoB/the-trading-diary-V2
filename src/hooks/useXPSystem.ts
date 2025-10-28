import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStreakMultiplier, calculateTier, getTierName } from '@/utils/xpEngine';
import { trackStreakEvents } from '@/utils/analyticsEvents';
import { analytics } from '@/utils/analytics';

interface XPData {
  currentXP: number;
  currentLevel: number;
  totalXPEarned: number;
  levelUpCount: number;
}

const XP_PER_LEVEL_BASE = 100;
const XP_GROWTH_RATE = 1.5;

export const calculateXPForLevel = (level: number): number => {
  return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH_RATE, level - 1));
};

export const calculateLevelFromXP = (totalXP: number): { level: number; currentXP: number } => {
  let level = 1;
  let xpForCurrentLevel = 0;
  
  while (totalXP >= xpForCurrentLevel + calculateXPForLevel(level)) {
    xpForCurrentLevel += calculateXPForLevel(level);
    level++;
  }
  
  return {
    level,
    currentXP: totalXP - xpForCurrentLevel
  };
};

export const useXPSystem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showTier3Preview, setShowTier3Preview] = useState(false);
  const newLevelRef = useRef<number | null>(null);

  const { data: xpData = {
    currentXP: 0,
    currentLevel: 1,
    totalXPEarned: 0,
    levelUpCount: 0
  }, isLoading: loading } = useQuery({
    queryKey: ['user-xp', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('user_xp_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          currentXP: data.current_xp,
          currentLevel: data.current_level,
          totalXPEarned: data.total_xp_earned,
          levelUpCount: data.level_up_count
        };
      }

      // Initialize XP data for new user
      const { error: insertError } = await supabase
        .from('user_xp_levels')
        .insert({
          user_id: user.id,
          current_xp: 0,
          current_level: 1,
          total_xp_earned: 0,
          level_up_count: 0
        });

      if (insertError) throw insertError;

      return {
        currentXP: 0,
        currentLevel: 1,
        totalXPEarned: 0,
        levelUpCount: 0
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const addXP = useCallback(async (
    amount: number, 
    activityType: string, 
    description?: string
  ) => {
    if (!user || amount <= 0) return;

    try {
      // Check daily XP cap before awarding XP
      const { data: tierData } = await supabase
        .from('user_xp_tiers')
        .select('daily_xp_earned, daily_xp_cap, current_tier')
        .eq('user_id', user.id)
        .single();

      const dailyXPEarned = tierData?.daily_xp_earned || 0;
      const dailyXPCap = tierData?.daily_xp_cap || 750;
      const currentTier = tierData?.current_tier || 0;

      // Check if user has hit daily cap
      if (dailyXPEarned >= dailyXPCap) {
        toast.error('Daily XP limit reached!', {
          description: 'Upgrade to Pro/Elite to keep earning XP',
          duration: 5000
        });
        
        analytics.trackDailyXPCapReached({
          dailyXP: dailyXPEarned,
          capLimit: dailyXPCap,
          planType: currentTier === 0 ? 'free' : currentTier === 1 ? 'bronze' : currentTier === 2 ? 'silver' : 'gold'
        });
        
        return; // Stop XP award
      }

      // Check for streak multiplier using centralized XP engine
      const { data: progression } = await supabase
        .from('user_progression')
        .select('login_streak, trade_streak')
        .eq('user_id', user.id)
        .single();

      // Use the higher streak for multiplier (rewards consistency)
      const loginStreak = progression?.login_streak || 0;
      const tradeStreak = progression?.trade_streak || 0;
      const bestStreak = Math.max(loginStreak, tradeStreak);
      
      // Determine multiplier type based on activity
      const streakType = activityType.includes('trade') ? 'trade' : 'login';
      const multiplier = getStreakMultiplier(streakType, bestStreak);

      let finalAmount = Math.floor(amount * multiplier);
      
      // Cap the XP amount if it would exceed daily cap
      const remainingDailyXP = dailyXPCap - dailyXPEarned;
      if (finalAmount > remainingDailyXP) {
        finalAmount = remainingDailyXP;
        toast.warning('XP capped', {
          description: `Only ${remainingDailyXP} XP remaining today`,
          duration: 3000
        });
      }

      const newTotalXP = xpData.totalXPEarned + finalAmount;
      const { level: newLevel, currentXP: newCurrentXP } = calculateLevelFromXP(newTotalXP);
      const didLevelUp = newLevel > xpData.currentLevel;

      // Update XP data
      const { error: updateError } = await supabase
        .from('user_xp_levels')
        .update({
          current_xp: newCurrentXP,
          current_level: newLevel,
          total_xp_earned: newTotalXP,
          level_up_count: didLevelUp ? xpData.levelUpCount + 1 : xpData.levelUpCount,
          last_xp_earned_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update daily XP earned in user_xp_tiers
      await supabase
        .from('user_xp_tiers')
        .update({ daily_xp_earned: dailyXPEarned + finalAmount })
        .eq('user_id', user.id);

      // Log activity
      const { error: logError } = await supabase
        .from('xp_activity_log')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          xp_earned: finalAmount,
          description: description || `Earned ${finalAmount} XP from ${activityType}${multiplier > 1 ? ` (${multiplier}x streak bonus)` : ''}`
        });

      if (logError) throw logError;

      // Update local state
      queryClient.setQueryData(['user-xp', user.id], {
        currentXP: newCurrentXP,
        currentLevel: newLevel,
        totalXPEarned: newTotalXP,
        levelUpCount: didLevelUp ? xpData.levelUpCount + 1 : xpData.levelUpCount
      });

      // Track XP award in analytics
      analytics.trackXPAwarded({
        amount: finalAmount,
        activityType,
        description,
        multiplier,
        totalXP: newTotalXP,
        currentLevel: newLevel,
      });

      // Check for tier unlock after XP award
      const oldTier = calculateTier(xpData.totalXPEarned);
      const newTier = calculateTier(newTotalXP);

      if (newTier > oldTier) {
        analytics.trackTierUnlocked({
          tier: newTier,
          totalXP: newTotalXP,
          previousTier: oldTier,
        });
        
        toast.success(`🎉 Tier Unlocked: ${getTierName(newTier)}!`, {
          description: `You've reached Tier ${newTier}!`,
          duration: 5000,
        });
      }

      // Check for Tier 3 preview trigger (2K XP milestone)
      if (newTotalXP >= 2000 && xpData.totalXPEarned < 2000) {
        // Check if user has already seen the preview
        const { data: existingPreview } = await supabase
          .from('tier_preview_unlocks')
          .select('id')
          .eq('user_id', user.id)
          .eq('tier_previewed', 3)
          .single();

        if (!existingPreview) {
          // Show modal and record in database
          setShowTier3Preview(true);
          
          await supabase
            .from('tier_preview_unlocks')
            .insert({
              user_id: user.id,
              tier_previewed: 3,
              previewed_at: new Date().toISOString(),
            });

          analytics.trackTier3PreviewOpened({
            totalXP: newTotalXP,
            currentTier: calculateTier(newTotalXP),
          });
        }
      }

      // Show notifications
      if (didLevelUp) {
        newLevelRef.current = newLevel;
        setShowLevelUp(true);
        
        toast.success(`🎉 Level Up! You're now level ${newLevel}!`, {
          description: `Keep trading to reach level ${newLevel + 1}`,
          duration: 5000
        });

        // Award freeze token every 5 levels
        if (newLevel % 5 === 0) {
          const { data: inventory } = await supabase
            .from('streak_freeze_inventory')
            .select('freeze_tokens, earned_from_level')
            .eq('user_id', user.id)
            .single();

          if (inventory) {
            await supabase
              .from('streak_freeze_inventory')
              .update({
                freeze_tokens: inventory.freeze_tokens + 1,
                earned_from_level: inventory.earned_from_level + 1,
              })
              .eq('user_id', user.id);
          } else {
            await supabase
              .from('streak_freeze_inventory')
              .insert({
                user_id: user.id,
                freeze_tokens: 1,
                earned_from_level: 1,
                earned_from_streak: 0,
              });
          }

          toast.success('Bonus! You earned a Streak Freeze token! 🧊', {
            duration: 4000,
          });
        }
      } else {
        toast.success(`+${finalAmount} XP${multiplier > 1 ? ` (${multiplier}x)` : ''}`, {
          description: description || activityType,
          duration: 2000,
          icon: '⚡'
        });
      }
    } catch (error) {
      console.error('Error adding XP:', error);
      toast.error('Failed to award XP');
    }
  }, [user, xpData]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-xp', user?.id] });
  }, [queryClient, user]);

  const getXPForNextLevel = useCallback(() => {
    return calculateXPForLevel(xpData.currentLevel);
  }, [xpData.currentLevel]);

  return {
    xpData,
    loading,
    addXP,
    getXPForNextLevel,
    showLevelUp,
    setShowLevelUp,
    newLevel: newLevelRef,
    refresh,
    showTier3Preview,
    setShowTier3Preview,
  };
};
