import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RollingTargetWidget } from '@/components/widgets/RollingTargetWidget';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Trade } from '@/types/trade';

export const TradeStationRollingTarget = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (tradesData) {
        setTrades(tradesData.map(trade => ({
          ...trade,
          side: trade.side as 'long' | 'short' | null
        })));
      }

      // Fetch initial investment
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('initial_investment')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setInitialInvestment(settingsData.initial_investment || 0);
      }
    } catch (error) {
      console.error('Error fetching rolling target data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PremiumCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PremiumCard>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Widget takes full space - header is inside RollingTargetWidget */}
      <RollingTargetWidget
        id="tradestation-rolling-target"
        trades={trades}
        initialInvestment={initialInvestment}
      />
    </div>
  );
};
