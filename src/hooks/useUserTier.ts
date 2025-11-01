import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  calculateTier, 
  getTierName, 
  getXPToNextTier, 
  getDailyXPCap,
  getDailyUploadLimit,
  canEarnXP,
  getRemainingDailyXP,
  getTierProgress,
  type TierLevel 
} from '@/utils/xpEngine';

export type UserTier = 'free' | 'basic' | 'pro' | 'elite';

export interface TierData {
  tier: UserTier;
  tierLevel: TierLevel;
  tierName: string;
  totalXP: number;
  xpToNextTier: number | null;
  tierProgress: number;
  dailyXPEarned: number;
  dailyXPCap: number;
  canEarnXP: boolean;
  remainingDailyXP: number;
  dailyUploadLimit: number;
  uploadCreditsUsed: number;
}

export const useUserTier = () => {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const queryClient = useQueryClient();

  const { data: tierData, isLoading } = useQuery({
    queryKey: ['user-tier', user?.id],
    queryFn: async (): Promise<TierData> => {
      if (!user) throw new Error('No user');

      try {
        // Fetch user XP levels
        const { data: xpData } = await supabase
          .from('user_xp_levels')
          .select('total_xp_earned')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fetch user tier data
        const { data: tierInfo } = await supabase
          .from('user_xp_tiers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // Use subscription from context (passed from closure)
        const subscriptionData = subscription;

        console.log('[UserTier-Debug]', {
          userId: user.id,
          subscription: subscriptionData,
          tierInfo,
          xpData,
        });

        const totalXP = xpData?.total_xp_earned || 0;
        const tierLevel = calculateTier(totalXP);
        const tierName = getTierName(tierLevel);
        const xpToNextTier = getXPToNextTier(totalXP);
        const tierProgress = getTierProgress(totalXP);

        // Derive daily XP cap strictly from tier level for consistency
        const dailyXPCap = getDailyXPCap(tierLevel);
        const dailyXPEarned = tierInfo?.daily_xp_earned ?? 0;
        const dailyUploadLimit = tierInfo?.daily_upload_limit ?? getDailyUploadLimit(tierLevel);

        // Map to legacy tier system for backwards compatibility
        let legacyTier: UserTier = 'free';
        if (subscriptionData?.plan_type === 'elite') {
          legacyTier = 'elite';
        } else if (subscriptionData?.plan_type === 'pro') {
          legacyTier = 'pro';
        } else if (tierLevel >= 2) {
          legacyTier = 'basic';
        }

        return {
          tier: legacyTier,
          tierLevel,
          tierName,
          totalXP,
          xpToNextTier,
          tierProgress,
          dailyXPEarned,
          dailyXPCap,
          canEarnXP: canEarnXP(dailyXPEarned, dailyXPCap),
          remainingDailyXP: getRemainingDailyXP(dailyXPEarned, dailyXPCap),
          dailyUploadLimit,
          uploadCreditsUsed: 0, // TODO: Track this separately
        };
      } catch (error) {
        console.error('Error fetching tier data:', error);
        // Return fallback free tier data
        return {
          tier: 'free',
          tierLevel: 0,
          tierName: 'Free',
          totalXP: 0,
          xpToNextTier: 1000,
          tierProgress: 0,
          dailyXPEarned: 0,
          dailyXPCap: 750,
          canEarnXP: true,
          remainingDailyXP: 750,
          dailyUploadLimit: 1,
          uploadCreditsUsed: 0,
        };
      }
    },
    enabled: !!user && !subscriptionLoading,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-tier', user?.id] });
  };

  const isPro = tierData?.tier === 'pro' || tierData?.tier === 'elite';
  const isElite = tierData?.tier === 'elite';
  const canCustomizeDashboard = isPro || isElite;

  return {
    ...tierData,
    tier: tierData?.tier || 'free',
    isLoading,
    isPro,
    isElite,
    canCustomizeDashboard,
    refresh,
  };
};
