import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target, Flame } from 'lucide-react';
import { DashboardCharts } from '@/components/DashboardCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeHistory } from '@/components/TradeHistory';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import type { Trade } from '@/types/trade';

interface TradeStats {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  avg_duration: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const [beastModeDays, setBeastModeDays] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchInitialInvestment();
    }
    
    // Set up realtime subscription for trades changes
    const channel = supabase
      .channel('trades-changes-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, includeFeesInPnL]);

  // Filter trades based on date range
  useEffect(() => {
    if (!trades.length) {
      setFilteredTrades([]);
      return;
    }

    if (!dateRange?.from) {
      setFilteredTrades(trades);
      return;
    }

    const filtered = trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      const from = dateRange.from!;
      const to = dateRange.to || new Date();
      
      return tradeDate >= from && tradeDate <= to;
    });

    setFilteredTrades(filtered);
  }, [trades, dateRange]);

  const fetchStats = async () => {
    if (!user) return;

    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (trades) {
      setTrades(trades.map(trade => ({
        ...trade,
        side: trade.side as 'long' | 'short' | null
      })));
      
      // Calculate P&L without fees
      const totalPnlWithoutFees = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      // Calculate P&L with fees (subtract fees from profit)
      const totalPnlWithFees = trades.reduce((sum, t) => {
        const pnl = t.pnl || 0;
        const fundingFee = t.funding_fee || 0;
        const tradingFee = t.trading_fee || 0;
        return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
      }, 0);
      
      const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
      const avgDuration = trades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (trades.length || 1);

      // Calculate Beast Mode days (days with >70% win rate)
      const tradesByDate = trades.reduce((acc, trade) => {
        const date = new Date(trade.trade_date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(trade);
        return acc;
      }, {} as Record<string, typeof trades>);

      const daysWithBeastMode = Object.values(tradesByDate).filter(dayTrades => {
        const wins = dayTrades.filter(t => (t.pnl || 0) > 0).length;
        const winRate = (wins / dayTrades.length) * 100;
        return winRate > 70;
      }).length;

      setBeastModeDays(daysWithBeastMode);

      setStats({
        total_pnl: includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees,
        win_rate: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
        total_trades: trades.length,
        avg_duration: avgDuration
      });
    }
    setLoading(false);
  };

  const fetchInitialInvestment = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('initial_investment')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setInitialInvestment(data.initial_investment || 0);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, valueColor, animated = false, numericValue }: any) => (
    <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className={`text-3xl font-bold ${valueColor || ''}`}>
            {animated && typeof numericValue === 'number' ? (
              value
            ) : (
              value
            )}
          </div>
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
        <Alert className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <Flame className="h-5 w-5 text-primary" />
          <AlertDescription className="text-foreground ml-2 text-base">
            <strong>REMEMBER:</strong> Protect your capital, stay disciplined, and trust your setups. Keep it simple and you'll be on the right path.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your trading performance and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
          {beastModeDays > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-help">
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-primary/20 blur-xl animate-pulse"></div>
                    <div className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-neon-green/10 to-primary/10 border-2 border-neon-green/30 rounded-lg shadow-lg">
                      <span className="text-4xl animate-bounce">👹</span>
                      <div>
                        <div className="text-xs font-medium text-neon-green uppercase tracking-wider">Unlocked</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-neon-green to-primary bg-clip-text text-transparent">
                          BEAST MODE
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {beastModeDays} {beastModeDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Beast Mode Days 👹</p>
                  <p className="text-sm">Days where you achieved over 70% win rate. Keep pushing for consistency!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <StatCard
                  title="Total P&L"
                  value={
                    <AnimatedCounter 
                      value={stats?.total_pnl || 0}
                      prefix="$"
                      decimals={2}
                    />
                  }
                  animated
                  numericValue={stats?.total_pnl || 0}
                  icon={DollarSign}
                  trend={stats && stats.total_pnl > 0 ? 'up' : stats && stats.total_pnl < 0 ? 'down' : 'neutral'}
                  valueColor={
                    stats && stats.total_pnl > 0 
                      ? 'text-neon-green' 
                      : stats && stats.total_pnl < 0 
                      ? 'text-neon-red' 
                      : 'text-foreground'
                  }
                />
                <div className="flex items-center justify-center gap-2 bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
                  <Label htmlFor="fees-toggle" className="text-xs cursor-pointer text-muted-foreground">
                    {includeFeesInPnL ? 'With Fees' : 'Without Fees'}
                  </Label>
                  <Switch
                    id="fees-toggle"
                    checked={includeFeesInPnL}
                    onCheckedChange={setIncludeFeesInPnL}
                    className="scale-75"
                  />
                </div>
              </div>
              <StatCard
                title="Win Rate"
                value={
                  <div className="flex items-center gap-2">
                    <AnimatedCounter 
                      value={stats?.win_rate || 0}
                      suffix="%"
                      decimals={1}
                    />
                    {stats && stats.win_rate > 70 && (
                      <span className="text-xl">👹</span>
                    )}
                  </div>
                }
                animated
                numericValue={stats?.win_rate || 0}
                icon={Target}
                trend="neutral"
                valueColor={stats && stats.win_rate > 70 ? 'text-neon-green' : ''}
              />
              <StatCard
                title="Total Trades"
                value={
                  <AnimatedCounter 
                    value={stats?.total_trades || 0}
                    decimals={0}
                  />
                }
                animated
                numericValue={stats?.total_trades || 0}
                icon={TrendingUp}
                trend="neutral"
              />
              <StatCard
                title="Avg Duration"
                value={
                  <>
                    <AnimatedCounter 
                      value={Math.round(stats?.avg_duration || 0)}
                      decimals={0}
                    />
                    <span>m</span>
                  </>
                }
                animated
                numericValue={stats?.avg_duration || 0}
                icon={TrendingDown}
                trend="neutral"
              />
            </div>

            {stats && stats.total_trades === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <h3 className="text-xl font-semibold mb-2">No trades yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by uploading your first trade to see analytics and insights
                </p>
                <a href="/upload" className="text-foreground hover:underline">
                  Upload Trade →
                </a>
              </Card>
            ) : (
              <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="history">Trade History</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                  <TradingHeatmap trades={filteredTrades.length > 0 ? filteredTrades : trades} />
                  <DashboardCharts trades={filteredTrades.length > 0 ? filteredTrades : trades} />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <AdvancedAnalytics 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                    initialInvestment={initialInvestment}
                    userId={user?.id || ''}
                    onInitialInvestmentUpdate={setInitialInvestment}
                  />
                </TabsContent>

              <TabsContent value="history">
                <TradeHistory onTradesChange={fetchStats} />
              </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
