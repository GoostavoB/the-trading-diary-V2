/**
 * Analytics helper for tracking activation and user journey events
 */

import { posthog } from './posthog';

export const trackUserActivation = (userId: string, timeToActivation: number) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('user_activated', {
      time_to_activation_seconds: timeToActivation,
      activation_date: new Date().toISOString(),
    });
    
    // Set user property
    posthog.setPersonProperties({
      activated: true,
      activation_date: new Date().toISOString(),
    });
    
    console.log('[Analytics] User activated:', { userId, timeToActivation });
  }
};

export const trackPaywallShown = (userId: string, context: 'soft' | 'hard') => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('paywall_shown', {
      context,
      user_id: userId,
    });
  }
};

export const trackFirstUpload = (userId: string) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('first_upload_completed', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
};
