import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'basic' | 'pro' | 'elite';

interface SubscriptionContextType {
  subscription: any | null;
  credits: number;
  plan: PlanType | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Computed properties
  isElite: boolean;
  isPro: boolean;
  isBasic: boolean;
  isFree: boolean;
  hasActiveSubscription: boolean;
  // Backward compatibility
  currentPlan: PlanType;
  isActive: boolean;
  canAccessFeature: (requiredPlan: PlanType) => boolean;
  isFeatureLocked: (requiredPlan: PlanType) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[SubscriptionContext-Debug] Fetching subscription for user:', user.id);

      // CRITICAL: Single query for ALL subscription data
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .maybeSingle();

      console.log('[SubscriptionContext-Debug] Result:', { data, error: fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('[SubscriptionContext-Debug] Failed to fetch subscription:', err);
      setError(err as Error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription when user changes
  useEffect(() => {
    console.log('[SubscriptionContext-Debug] useEffect triggered:', { 
      authLoading, 
      hasUser: !!user, 
      userId: user?.id 
    });

    if (!authLoading && user?.id) {
      console.log('[SubscriptionContext-Debug] Conditions met, calling fetchSubscription');
      fetchSubscription();
    } else if (!authLoading && !user) {
      console.log('[SubscriptionContext-Debug] No user, clearing subscription');
      setSubscription(null);
      setIsLoading(false);
    } else {
      console.log('[SubscriptionContext-Debug] Still loading auth or waiting for user');
    }
  }, [user?.id, authLoading]);

  // Set up realtime subscription for automatic updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('[SubscriptionContext-Debug] Setting up realtime channel');

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[SubscriptionContext-Debug] Realtime update received:', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      console.log('[SubscriptionContext-Debug] Cleaning up realtime channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Plan hierarchy for feature access
  const planHierarchy: Record<PlanType, number> = {
    basic: 1,
    pro: 2,
    elite: 3
  };

  // Compute plan from subscription - NEVER default during loading
  const plan: PlanType | null = isLoading 
    ? null 
    : subscription?.plan_type === 'elite'
    ? 'elite'
    : subscription?.plan_type === 'pro'
    ? 'pro'
    : subscription?.plan_type === 'basic'
    ? 'basic'
    : 'basic';

  // Computed boolean properties
  const isElite = !isLoading && subscription?.plan_type === 'elite';
  const isPro = !isLoading && subscription?.plan_type === 'pro';
  const isBasic = !isLoading && subscription?.plan_type === 'basic';
  const isFree = !isLoading && !subscription;
  const hasActiveSubscription = !isLoading && !!subscription;

  const canAccessFeature = (requiredPlan: PlanType): boolean => {
    if (isLoading || !plan) return false;
    return planHierarchy[plan] >= planHierarchy[requiredPlan];
  };

  const isFeatureLocked = (requiredPlan: PlanType): boolean => {
    return !canAccessFeature(requiredPlan);
  };

  const value: SubscriptionContextType = {
    subscription,
    credits: subscription?.upload_credits_balance ?? 0,
    plan,
    isLoading,
    error,
    refetch: fetchSubscription,
    // Computed properties
    isElite,
    isPro,
    isBasic,
    isFree,
    hasActiveSubscription,
    // Backward compatibility
    currentPlan: plan ?? 'basic',
    isActive: hasActiveSubscription,
    canAccessFeature,
    isFeatureLocked
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

// Alias for convenience
export const useSubscription = useSubscriptionContext;
