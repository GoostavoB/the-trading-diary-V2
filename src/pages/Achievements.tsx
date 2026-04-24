import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import type { Trade } from '@/types/trade';
import { SkipToContent } from '@/components/SkipToContent';



const Achievements = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('trade_date', { ascending: false });

        if (error) throw error;
        setTrades((data || []) as Trade[]);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  // Enable badge notifications
  useBadgeNotifications(trades);

  return (
    <>
      <SEO
        title={pageMeta.achievements.title}
        description={pageMeta.achievements.description}
        keywords={pageMeta.achievements.keywords}
        canonical={pageMeta.achievements.canonical}
        noindex={true}
      />
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className="container mx-auto py-6 space-y-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2" id="achievements-heading">Achievement Badges</h1>
          <p className="text-muted-foreground">
            Track your trading milestones and unlock badges as you progress
          </p>
        </header>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Achievements are currently disabled.</p>
          </div>
        )}
      </main>
    </AppLayout>
    </>
  );
};

export default Achievements;
