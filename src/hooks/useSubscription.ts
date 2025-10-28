import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'basic' | 'pro' | 'elite';
type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

interface Subscription {
  id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'annual' | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isActive: boolean;
  refetch: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, plan_type, status, billing_cycle, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSubscription({
          id: data.id,
          plan_type: data.plan_type as PlanType,
          status: data.status as SubscriptionStatus,
          billing_cycle: data.billing_cycle as 'monthly' | 'annual' | null,
          current_period_end: data.current_period_end,
          cancel_at_period_end: data.cancel_at_period_end
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isActive = subscription 
    ? subscription.status === 'active' || 
      (subscription.status === 'trial' && 
       subscription.current_period_end && 
       new Date(subscription.current_period_end) > new Date())
    : false;

  return {
    subscription,
    isLoading,
    isActive,
    refetch: fetchSubscription
  };
};
