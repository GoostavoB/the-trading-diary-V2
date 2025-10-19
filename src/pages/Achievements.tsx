import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import type { Trade } from '@/types/trade';

const AchievementBadges = lazy(() => import('@/components/AchievementBadges').then(m => ({ default: m.AchievementBadges })));

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
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Achievement Badges</h1>
          <p className="text-muted-foreground">
            Track your trading milestones and unlock badges as you progress
          </p>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <Suspense fallback={<DashboardSkeleton />}>
            <AchievementBadges trades={trades} />
          </Suspense>
        )}
      </div>
    </AppLayout>
  );
};

export default Achievements;
