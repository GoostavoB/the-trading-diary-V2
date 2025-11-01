import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'basic' | 'pro' | 'elite';

interface PremiumFeaturesHook {
  currentPlan: PlanType;
  canAccessFeature: (requiredPlan: PlanType) => boolean;
  isFeatureLocked: (requiredPlan: PlanType) => boolean;
  isLoading: boolean;
}

/**
 * Hook to check premium feature access based on user's subscription
 */
export const usePremiumFeatures = (): PremiumFeaturesHook => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('basic');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.id) {
        setCurrentPlan('basic');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      console.log('[PremiumFeatures]', { data, error, userId: user.id });

      if (error) {
        console.error('[PremiumFeatures] Error:', error);
        setCurrentPlan('basic');
      } else {
        setCurrentPlan((data?.plan_type as PlanType) || 'basic');
      }
      
      setIsLoading(false);
    };

    fetchPlan();
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
    isFeatureLocked,
    isLoading
  };
};
