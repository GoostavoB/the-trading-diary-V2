import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/utils/analytics';

/**
 * Component to track conversion events and user properties
 * Automatically tracks user lifecycle events
 */
export const ConversionTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Set user properties for segmentation
      analytics.setUserProperties({
        user_id: user.id,
        user_created_at: user.created_at,
        // Add more user properties as needed
      });
    }
  }, [user]);

  return null; // This is a tracking component, no UI
};
