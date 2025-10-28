import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { posthog } from '@/lib/posthog';

interface PromoStatus {
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  isLoading: boolean;
}

export function usePromoStatus() {
  const [promoStatus, setPromoStatus] = useState<PromoStatus>({
    isActive: false,
    expiresAt: null,
    daysRemaining: 0,
    hoursRemaining: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchPromoStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setPromoStatus(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('promo_expires_at, created_at')
          .eq('id', user.id)
          .single();

        if (!profile?.promo_expires_at) {
          setPromoStatus(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const expiresAt = new Date(profile.promo_expires_at);
        const now = new Date();
        const isActive = expiresAt > now;
        const msRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
        const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));

        setPromoStatus({
          isActive,
          expiresAt,
          daysRemaining,
          hoursRemaining,
          isLoading: false,
        });

        // Track promo status
        if (isActive) {
          posthog.capture('promo_viewed', {
            days_remaining: daysRemaining,
            expires_at: expiresAt.toISOString(),
          });
        } else if (profile.promo_expires_at) {
          posthog.capture('promo_expired', {
            expired_at: expiresAt.toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching promo status:', error);
        setPromoStatus(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchPromoStatus();

    // Update every minute to keep countdown accurate
    const interval = setInterval(fetchPromoStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return promoStatus;
}
