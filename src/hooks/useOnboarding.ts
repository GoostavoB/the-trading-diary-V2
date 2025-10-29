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
      setShowOnboarding(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no user settings exist, create them
      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            onboarding_completed: false
          });

        if (insertError) {
          console.warn('Could not create user settings:', insertError);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
        setLoading(false);
        return;
      }

      if (error) {
        console.warn('Could not check onboarding status:', error);
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      // Show onboarding if not completed
      setShowOnboarding(!data?.onboarding_completed);
    } catch (error) {
      console.warn('Error in checkOnboardingStatus:', error);
      setShowOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          onboarding_completed: true
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating onboarding status:', error);
        return;
      }

      setShowOnboarding(false);
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
    }
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
  };
};
