import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
      const { data, error } = await supabase
        .from('subscriptions')
        .select('upload_credits_balance, upload_credits_used_this_month, monthly_upload_limit, extra_credits_purchased')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching upload credits:', error);
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

      setCredits({
        balance: data?.upload_credits_balance || 0,
        used: data?.upload_credits_used_this_month || 0,
        limit: data?.monthly_upload_limit || 20,
        extraPurchased: data?.extra_credits_purchased || 0,
        canUpload: (data?.upload_credits_balance || 0) > 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking upload credits:', error);
      setCredits({
        balance: 0,
        used: 0,
        limit: 20,
        extraPurchased: 0,
        canUpload: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchCredits();

    // Subscribe to subscription changes
    const channel = supabase
      .channel('subscription-credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;

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
