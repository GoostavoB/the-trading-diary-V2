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
    const fetchUserData = async () => {
      if (!user) {
        setRole(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setRole(roleData?.role as UserRole || 'user');

        // Fetch subscription info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, trial_end_date')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setSubscription({
            tier: (profileData.subscription_tier as any) || 'free',
            status: (profileData.subscription_status as any) || 'inactive',
            trialEndDate: profileData.trial_end_date || undefined
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
