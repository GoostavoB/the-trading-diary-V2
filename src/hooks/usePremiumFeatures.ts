import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type PlanType = 'basic' | 'pro' | 'elite';

interface PremiumFeaturesHook {
  currentPlan: PlanType;
  canAccessFeature: (requiredPlan: PlanType) => boolean;
  isFeatureLocked: (requiredPlan: PlanType) => boolean;
}

/**
 * Hook to check premium feature access based on user's plan
 * In a real implementation, this would check against the user's subscription in the database
 */
export const usePremiumFeatures = (): PremiumFeaturesHook => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('basic');

  useEffect(() => {
    // TODO: Fetch user's actual subscription plan from database
    // For now, we'll default to basic
    if (user) {
      // This would be replaced with actual subscription check
      // Example: const { data } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single();
      setCurrentPlan('basic');
    }
  }, [user]);

  const planHierarchy: Record<PlanType, number> = {
    basic: 1,
    pro: 2,
    elite: 3
  };

  const canAccessFeature = (requiredPlan: PlanType): boolean => {
    return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
  };

  const isFeatureLocked = (requiredPlan: PlanType): boolean => {
    return !canAccessFeature(requiredPlan);
  };

  return {
    currentPlan,
    canAccessFeature,
    isFeatureLocked
  };
};
