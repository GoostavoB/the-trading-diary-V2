import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface TradeStats {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  avg_duration: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);

    if (trades) {
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
      const avgDuration = trades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (trades.length || 1);

      setStats({
        total_pnl: totalPnl,
        win_rate: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
        total_trades: trades.length,
        avg_duration: avgDuration
      });
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon 
          className={trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-red' : 'text-foreground'} 
          size={32} 
        />
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your trading performance and analytics</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total P&L"
                value={`$${stats?.total_pnl.toFixed(2) || 0}`}
                icon={DollarSign}
                trend={stats && stats.total_pnl > 0 ? 'up' : 'down'}
              />
              <StatCard
                title="Win Rate"
                value={`${stats?.win_rate.toFixed(1) || 0}%`}
                icon={Target}
                trend="neutral"
              />
              <StatCard
                title="Total Trades"
                value={stats?.total_trades || 0}
                icon={TrendingUp}
                trend="neutral"
              />
              <StatCard
                title="Avg Duration"
                value={`${Math.round(stats?.avg_duration || 0)}m`}
                icon={TrendingDown}
                trend="neutral"
              />
            </div>

            {stats && stats.total_trades === 0 && (
              <Card className="p-8 text-center bg-card border-border">
                <h3 className="text-xl font-semibold mb-2">No trades yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by uploading your first trade to see analytics and insights
                </p>
                <a href="/upload" className="text-foreground hover:underline">
                  Upload Trade →
                </a>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
