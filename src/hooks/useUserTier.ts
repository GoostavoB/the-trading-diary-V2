import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserTier = 'free' | 'basic' | 'pro' | 'elite';

export const useUserTier = () => {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) {
        setTier('free');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user tier:', error);
        setTier('free');
      } else {
        setTier((data?.subscription_tier as UserTier) || 'free');
      }
      setIsLoading(false);
    };

    fetchTier();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-tier-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new && 'subscription_tier' in payload.new) {
            setTier((payload.new.subscription_tier as UserTier) || 'free');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPro = tier === 'pro' || tier === 'elite';
  const isElite = tier === 'elite';
  const canCustomizeDashboard = isPro || isElite;

  return {
    tier,
    isLoading,
    isPro,
    isElite,
    canCustomizeDashboard,
  };
};
