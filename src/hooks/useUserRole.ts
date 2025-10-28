import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'user';

export interface UserSubscription {
  tier: 'free' | 'basic' | 'pro' | 'elite';
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  trialEndDate?: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        setRole('user');
        setSubscription({
          tier: (subscriptionData?.plan_type as 'free' | 'basic' | 'pro' | 'elite') || 'free',
          status: (subscriptionData?.status as 'active' | 'inactive' | 'trial' | 'cancelled') || 'inactive',
          trialEndDate: undefined
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setRole('user');
        setSubscription({
          tier: 'free',
          status: 'inactive',
          trialEndDate: undefined
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const hasActiveSubscription = subscription?.status === 'active' || 
                                 (subscription?.status === 'trial' && subscription?.trialEndDate);
  const hasAccess = isAdmin || hasActiveSubscription;

  return {
    role,
    subscription,
    loading,
    isAdmin,
    hasActiveSubscription,
    hasAccess
  };
};
