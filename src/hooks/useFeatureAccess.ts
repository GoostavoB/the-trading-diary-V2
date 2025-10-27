import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'basic' | 'pro' | 'elite';

interface FeatureAccess {
  hasFeeAnalysis: boolean;
  connectedAccountsLimit: number;
  currentAccountsCount: number;
  canAddAccount: boolean;
  customMetricsLimit: number;
  customMetricsUsed: number;
  canCreateCustomMetric: boolean;
  planType: PlanType;
  isLoading: boolean;
}

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const [access, setAccess] = useState<FeatureAccess>({
    hasFeeAnalysis: false,
    connectedAccountsLimit: 1,
    currentAccountsCount: 0,
    canAddAccount: true,
    customMetricsLimit: 0,
    customMetricsUsed: 0,
    canCreateCustomMetric: false,
    planType: 'basic',
    isLoading: true,
  });

  const fetchAccess = async () => {
    if (!user) {
      setAccess({
        hasFeeAnalysis: false,
        connectedAccountsLimit: 1,
        currentAccountsCount: 0,
        canAddAccount: true,
        customMetricsLimit: 0,
        customMetricsUsed: 0,
        canCreateCustomMetric: false,
        planType: 'basic',
        isLoading: false,
      });
      return;
    }

    try {
      // Fetch subscription details
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_type, has_fee_analysis_access, connected_accounts_limit, custom_metrics_limit, custom_metrics_used_this_month')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        setAccess({
          hasFeeAnalysis: false,
          connectedAccountsLimit: 1,
          currentAccountsCount: 0,
          canAddAccount: true,
          customMetricsLimit: 0,
          customMetricsUsed: 0,
          canCreateCustomMetric: false,
          planType: 'basic',
          isLoading: false,
        });
        return;
      }

      // Fetch current accounts count
      const { count: accountsCount, error: accountsError } = await supabase
        .from('connected_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Error fetching accounts count:', accountsError);
      }

      const currentCount = accountsCount || 0;
      const accountLimit = subscription?.connected_accounts_limit || 1;
      const metricsLimit = subscription?.custom_metrics_limit || 0;
      const metricsUsed = subscription?.custom_metrics_used_this_month || 0;

      setAccess({
        hasFeeAnalysis: subscription?.has_fee_analysis_access || false,
        connectedAccountsLimit: accountLimit,
        currentAccountsCount: currentCount,
        canAddAccount: currentCount < accountLimit,
        customMetricsLimit: metricsLimit,
        customMetricsUsed: metricsUsed,
        canCreateCustomMetric: metricsUsed < metricsLimit && metricsLimit > 0,
        planType: (subscription?.plan_type as PlanType) || 'basic',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking feature access:', error);
      setAccess({
        hasFeeAnalysis: false,
        connectedAccountsLimit: 1,
        currentAccountsCount: 0,
        canAddAccount: true,
        customMetricsLimit: 0,
        customMetricsUsed: 0,
        canCreateCustomMetric: false,
        planType: 'basic',
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchAccess();

    // Subscribe to subscription changes
    const channel = supabase
      .channel('subscription-feature-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    ...access,
    refetch: fetchAccess,
  };
};
