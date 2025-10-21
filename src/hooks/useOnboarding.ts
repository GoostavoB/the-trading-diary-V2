import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        setLoading(false);
        return;
      }

      // Show onboarding if not completed
      setShowOnboarding(!data?.onboarding_completed);
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
  };
};
