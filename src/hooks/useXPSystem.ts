import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [xpData, setXpData] = useState<XPData>({
    currentXP: 0,
    currentLevel: 1,
    totalXPEarned: 0,
    levelUpCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const fetchXPData = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_xp_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setXpData({
          currentXP: data.current_xp,
          currentLevel: data.current_level,
          totalXPEarned: data.total_xp_earned,
          levelUpCount: data.level_up_count
        });
      } else {
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
      }
    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  const addXP = useCallback(async (
    amount: number, 
    activityType: string, 
    description?: string
  ) => {
    if (!user || amount <= 0) return;

    try {
      const newTotalXP = xpData.totalXPEarned + amount;
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

      // Log activity
      const { error: logError } = await supabase
        .from('xp_activity_log')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          xp_earned: amount,
          description
        });

      if (logError) throw logError;

      // Update local state
      setXpData({
        currentXP: newCurrentXP,
        currentLevel: newLevel,
        totalXPEarned: newTotalXP,
        levelUpCount: didLevelUp ? xpData.levelUpCount + 1 : xpData.levelUpCount
      });

      // Show notifications
      if (didLevelUp) {
        setShowLevelUp(true);
      } else {
        toast.success(`+${amount} XP`, {
          description: description || activityType,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error adding XP:', error);
      toast.error('Failed to award XP');
    }
  }, [user, xpData]);

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
    refresh: fetchXPData
  };
};
