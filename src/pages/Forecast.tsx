import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Forecast = () => {
  const { user } = useAuth();
  const [days, setDays] = useState([30]);
  const [avgDailyPnl, setAvgDailyPnl] = useState(0);
  const [projectedEquity, setProjectedEquity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvgPnl();
    
    // Set up realtime subscription for trades changes
    const channel = supabase
      .channel('trades-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchAvgPnl();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    setProjectedEquity(avgDailyPnl * days[0]);
  }, [days, avgDailyPnl]);

  const fetchAvgPnl = async () => {
    if (!user) return;

    const { data: trades } = await supabase
      .from('trades')
      .select('pnl, trade_date')
      .eq('user_id', user.id);

    if (trades && trades.length > 0) {
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const uniqueDays = new Set(trades.map(t => new Date(t.trade_date).toDateString())).size;
      setAvgDailyPnl(totalPnl / (uniqueDays || 1));
    } else {
      setAvgDailyPnl(0);
    }
    setLoading(false);
  };

  const formatDays = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Equity Forecast</h1>
          <p className="text-muted-foreground">Project your future equity based on historical performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Calculating projections...</p>
          </div>
        ) : (
          <>
            <Card className="p-6 bg-card border-border">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium">Time Period</label>
                    <span className="text-2xl font-bold">{formatDays(days[0])}</span>
                  </div>
                  <Slider
                    value={days}
                    onValueChange={setDays}
                    min={1}
                    max={1825}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1 day</span>
                    <span>5 years</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Avg Daily P&L</p>
                    <p className="text-2xl font-bold">${avgDailyPnl.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Projected Equity</p>
                    <p className="text-2xl font-bold text-neon-green">
                      ${projectedEquity.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-3">Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                This forecast is based on your historical trading performance and assumes consistent trading behavior. 
                Past performance does not guarantee future results. Markets are unpredictable, and actual results may vary significantly.
              </p>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Forecast;
