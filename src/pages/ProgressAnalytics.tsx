import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Star } from 'lucide-react';
import { TradingStreaks } from '@/components/TradingStreaks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ProgressAnalytics = () => {
  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <SEO
        title={pageMeta.progressAnalytics.title}
        description={pageMeta.progressAnalytics.description}
        keywords={pageMeta.progressAnalytics.keywords}
        canonical={pageMeta.progressAnalytics.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Progress Analytics</h1>
          <p className="text-muted-foreground">
            Track your trading journey and consistency
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <PremiumCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{trades.length}</p>
              </div>
            </div>
          </PremiumCard>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <PremiumCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Trading Streaks</h2>
            <TradingStreaks trades={trades as any[]} />
          </PremiumCard>
        </div>
      </div>
    </AppLayout>
    </>
  );
};

export default ProgressAnalytics;
