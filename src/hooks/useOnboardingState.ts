import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedFirstUpload: boolean;
  hasTaggedFirstEmotion: boolean;
  hasViewedInsights: boolean;
}

export function useOnboardingState() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    hasSeenWelcome: false,
    hasCompletedFirstUpload: false,
    hasTaggedFirstEmotion: false,
    hasViewedInsights: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage and database
  useEffect(() => {
    const loadOnboardingState = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check localStorage first (instant)
      const localState = localStorage.getItem(`onboarding_${user.id}`);
      if (localState) {
        setState(JSON.parse(localState));
      }

      // Check database for trade count
      const { data: trades } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
        .limit(5);

      const hasUploaded = (trades?.length || 0) > 0;
      const hasTagged = false; // Will be implemented when emotion tagging is added

      // Update state
      const newState = {
        hasSeenWelcome: localState ? JSON.parse(localState).hasSeenWelcome : false,
        hasCompletedFirstUpload: hasUploaded,
        hasTaggedFirstEmotion: hasTagged,
        hasViewedInsights: localState ? JSON.parse(localState).hasViewedInsights : false,
      };

      setState(newState);
      setIsLoading(false);

      // Save to localStorage
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState));
    };

    loadOnboardingState();
  }, [user]);

  // Mark welcome as seen
  const markWelcomeSeen = () => {
    if (!user) return;
    
    const newState = { ...state, hasSeenWelcome: true };
    setState(newState);
    localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState));
  };

  // Mark first upload complete
  const markFirstUploadComplete = () => {
    if (!user) return;
    
    const newState = { ...state, hasCompletedFirstUpload: true };
    setState(newState);
    localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState));
  };

  // Mark insights viewed
  const markInsightsViewed = () => {
    if (!user) return;
    
    const newState = { ...state, hasViewedInsights: true };
    setState(newState);
    localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState));
  };

  // Check if user should see welcome modal
  const shouldShowWelcome = !isLoading && user && !state.hasSeenWelcome && !state.hasCompletedFirstUpload;

  // Check if user should see first upload reward
  const shouldShowFirstUploadReward = state.hasCompletedFirstUpload && !state.hasViewedInsights;

  return {
    ...state,
    isLoading,
    shouldShowWelcome,
    shouldShowFirstUploadReward,
    markWelcomeSeen,
    markFirstUploadComplete,
    markInsightsViewed,
  };
}
