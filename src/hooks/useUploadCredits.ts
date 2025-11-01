import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadCredits {
  balance: number;
  used: number;
  limit: number;
  extraPurchased: number;
  canUpload: boolean;
  isLoading: boolean;
}

export const useUploadCredits = () => {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [credits, setCredits] = useState<UploadCredits>({
    balance: 0,
    used: 0,
    limit: 20,
    extraPurchased: 0,
    canUpload: false,
    isLoading: true,
  });

  const fetchCredits = async () => {
    if (!user) {
      setCredits({
        balance: 0,
        used: 0,
        limit: 20,
        extraPurchased: 0,
        canUpload: false,
        isLoading: false,
      });
      return;
    }

    try {
      // Check if user has unlimited uploads
      const { data: settings } = await supabase
        .from('user_settings')
        .select('unlimited_uploads')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings?.unlimited_uploads) {
        setCredits({
          balance: 999999,
          used: 0,
          limit: 999999,
          extraPurchased: 0,
          canUpload: true,
          isLoading: false,
        });
        return;
      }

      // Use subscription data from context
      const subscriptionData = subscription;
      const subscriptionError = null;

      console.log('[Credits-Debug]', {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        subscriptionData,
        subscriptionError,
        rawBalance: subscriptionData?.upload_credits_balance,
        rawUsed: subscriptionData?.upload_credits_used_this_month,
        rawLimit: subscriptionData?.monthly_upload_limit,
        rawExtra: subscriptionData?.extra_credits_purchased,
        rawPlan: subscriptionData?.plan_type,
        rawStatus: subscriptionData?.status,
      });

      // If no active subscription, check user_xp_tiers for daily upload limits
      if (!subscriptionData) {
        const { data: tierData, error: tierError } = await supabase
          .from('user_xp_tiers')
          .select('daily_upload_count, daily_upload_limit')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tierError) {
          console.error('Error fetching user tier data:', tierError);
          setCredits({
            balance: 5, // Default free credits
            used: 0,
            limit: 5,
            extraPurchased: 0,
            canUpload: true,
            isLoading: false,
          });
          return;
        }

        const used = tierData?.daily_upload_count || 0;
        const limit = tierData?.daily_upload_limit || 5;
        const remaining = Math.max(0, limit - used);

        setCredits({
          balance: remaining,
          used: used,
          limit: limit,
          extraPurchased: 0,
          canUpload: remaining > 0,
          isLoading: false,
        });
        return;
      }

      if (subscriptionError) {
        console.error('[Credits] Subscription error, falling back to tier:', subscriptionError);
        
        // Attempt tier fallback
        const { data: tierData } = await supabase
          .from('user_xp_tiers')
          .select('daily_upload_count, daily_upload_limit')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tierData) {
          const tierUsed = tierData.daily_upload_count || 0;
          const tierLimit = tierData.daily_upload_limit || 5;
          const tierRemaining = Math.max(0, tierLimit - tierUsed);
          
          console.log('[Credits] source: tier (error fallback), values:', { tierUsed, tierLimit, tierRemaining });
          setCredits({
            balance: tierRemaining,
            used: tierUsed,
            limit: tierLimit,
            extraPurchased: 0,
            canUpload: tierRemaining > 0,
            isLoading: false,
          });
          return;
        }

        // Default fallback
        console.log('[Credits] source: default (error fallback), values:', { balance: 5, limit: 5 });
        setCredits({
          balance: 5,
          used: 0,
          limit: 5,
          extraPurchased: 0,
          canUpload: true,
          isLoading: false,
        });
        return;
      }

      // Compute balance robustly for active or trial
      const usedSub = subscriptionData?.upload_credits_used_this_month ?? 0;
      const limitSub = subscriptionData?.monthly_upload_limit ?? 0;
      const extraSub = subscriptionData?.extra_credits_purchased ?? 0;

      const storedBalance = subscriptionData?.upload_credits_balance;
      const computedBalance = Math.max(0, limitSub - usedSub) + extraSub;
      const finalBalance =
        storedBalance === null || storedBalance === undefined || storedBalance < computedBalance
          ? computedBalance
          : storedBalance;

      // If subscription yields 0 or negative, fallback to tier
      if (finalBalance <= 0 || limitSub <= 0) {
        console.log('[Credits] Subscription balance 0, falling back to tier...');
        const { data: tierData } = await supabase
          .from('user_xp_tiers')
          .select('daily_upload_count, daily_upload_limit')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tierData) {
          const tierUsed = tierData.daily_upload_count || 0;
          const tierLimit = tierData.daily_upload_limit || 5;
          const tierRemaining = Math.max(0, tierLimit - tierUsed);
          
          if (tierRemaining > 0) {
            console.log('[Credits] source: tier, values:', { tierUsed, tierLimit, tierRemaining });
            setCredits({
              balance: tierRemaining,
              used: tierUsed,
              limit: tierLimit,
              extraPurchased: 0,
              canUpload: true,
              isLoading: false,
            });
            return;
          }
        }

        // Ultimate fallback: default to 5
        console.log('[Credits] source: default, values:', { balance: 5, limit: 5 });
        setCredits({
          balance: 5,
          used: 0,
          limit: 5,
          extraPurchased: 0,
          canUpload: true,
          isLoading: false,
        });
        return;
      }

      console.log('[Credits] source: subscription, values:', { usedSub, limitSub, extraSub, finalBalance });
      setCredits({
        balance: finalBalance,
        used: usedSub,
        limit: limitSub,
        extraPurchased: extraSub,
        canUpload: finalBalance > 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking upload credits:', error);
      setCredits({
        balance: 5, // Default free credits for new users
        used: 0,
        limit: 5,
        extraPurchased: 0,
        canUpload: true,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    if (!subscriptionLoading) {
      fetchCredits();
    }
  }, [user, subscription, subscriptionLoading]);

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;

    // Unlimited users bypass deduction
    if (credits.limit >= 999999) {
      return true;
    }

    try {
      const { data, error } = await supabase.rpc('deduct_upload_credit', {
        p_user_id: user.id,
      });

      if (error || !data) {
        toast({
          title: 'No Credits Available',
          description: 'You have used all your upload credits for this month. Purchase extra credits to continue.',
          variant: 'destructive',
        });
        return false;
      }

      await fetchCredits();
      return true;
    } catch (error) {
      console.error('Error deducting credit:', error);
      toast({
        title: 'Error',
        description: 'Failed to process upload credit. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const purchaseExtraCredits = async (credits: number, amount: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('add_extra_credits', {
        p_user_id: user.id,
        p_credits: credits,
        p_amount: amount,
      });

      if (error || !data) {
        toast({
          title: 'Purchase Failed',
          description: 'Failed to add extra credits. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Credits Added',
        description: `${credits} upload credits have been added to your account.`,
      });

      await fetchCredits();
      return true;
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to purchase credits. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    ...credits,
    deductCredit,
    purchaseExtraCredits,
    refetch: fetchCredits,
  };
};
