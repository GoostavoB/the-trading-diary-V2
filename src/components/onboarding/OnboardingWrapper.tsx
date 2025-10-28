import { OnboardingFlow } from './OnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

/**
 * Global onboarding wrapper that shows the onboarding flow
 * for new users across all pages until completed
 */
export const OnboardingWrapper = () => {
  const { user } = useAuth();
  const { showOnboarding, loading, completeOnboarding } = useOnboarding();
  const location = useLocation();

  // Don't show onboarding on auth or public pages
  const isPublicPage = ['/auth', '/'].includes(location.pathname) || 
    location.pathname.startsWith('/blog') || 
    location.pathname.startsWith('/pricing') ||
    location.pathname.startsWith('/legal') ||
    location.pathname.startsWith('/terms') ||
    location.pathname.startsWith('/privacy');

  // Only show onboarding for authenticated users on protected pages
  if (!user || loading || !showOnboarding || isPublicPage) {
    return null;
  }

  return <OnboardingFlow onComplete={completeOnboarding} />;
};
