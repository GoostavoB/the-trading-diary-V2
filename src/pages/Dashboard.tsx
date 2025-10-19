import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target, Flame, Eye, EyeOff } from 'lucide-react';
import { DashboardCharts } from '@/components/DashboardCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeHistory } from '@/components/TradeHistory';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { PerformanceInsights } from '@/components/PerformanceInsights';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { GoalsTracker } from '@/components/GoalsTracker';
import { AchievementBadges } from '@/components/AchievementBadges';
import { WeeklyReview } from '@/components/WeeklyReview';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { MonthlyReport } from '@/components/MonthlyReport';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { StatisticsComparison } from '@/components/StatisticsComparison';
import { TradingStreaks } from '@/components/TradingStreaks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { SetupManager } from '@/components/SetupManager';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DrawdownAnalysis } from '@/components/DrawdownAnalysis';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { DashboardWidget } from '@/components/DashboardWidget';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Trade } from '@/types/trade';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface TradeStats {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  avg_duration: number;
}

const Dashboard = () => {
  useKeyboardShortcuts();
  const { user } = useAuth();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const [beastModeDays, setBeastModeDays] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  
  const {
    widgets,
    layout,
    isCustomizing,
    hasChanges,
    setIsCustomizing,
    toggleWidgetVisibility,
    updateLayout,
    saveLayout,
    resetLayout,
    cancelCustomization,
    isWidgetVisible,
  } = useDashboardLayout();

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
    <Card className="p-5 glass hover-lift transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className={`text-2xl font-bold ${valueColor || ''}`}>
            {animated && typeof numericValue === 'number' ? (
              value
            ) : (
              value
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon 
            className={trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-red' : 'text-primary'} 
            size={24} 
          />
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6 mobile-safe">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track your trading performance and analytics</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            {trades.length > 0 && (
              <ExportTradesDialog trades={filteredTrades.length > 0 ? filteredTrades : trades} />
            )}
          </div>
          {beastModeDays > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-help w-full md:w-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-primary/20 blur-xl animate-pulse"></div>
                    <div className="relative flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 glass-strong border-2 border-neon-green/30 rounded-xl shadow-lg">
                      <Flame className="w-6 h-6 md:w-8 md:h-8 text-neon-green flex-shrink-0" />
                      <div>
                        <div className="text-[10px] md:text-xs font-medium text-neon-green uppercase tracking-wider">Unlocked</div>
                        <div className="text-base md:text-xl font-bold text-neon-green">
                          BEAST MODE
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                          {beastModeDays} {beastModeDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Beast Mode Days</p>
                  <p className="text-sm">Days where you achieved over 70% win rate. Keep pushing for consistency!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Customize Dashboard Controls */}
        <CustomizeDashboardControls
          isCustomizing={isCustomizing}
          hasChanges={hasChanges}
          onStartCustomize={() => setIsCustomizing(true)}
          onSave={saveLayout}
          onCancel={cancelCustomization}
          onReset={resetLayout}
          widgets={widgets}
          onToggleWidget={toggleWidgetVisibility}
        />

        {loading ? (
          <DashboardSkeleton />
        ) : stats && stats.total_trades === 0 ? (
          <Card className="p-8 text-center glass">
            <h3 className="text-xl font-semibold mb-2">No trades yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by uploading your first trade to see analytics and insights
            </p>
            <a href="/upload" className="text-primary hover:underline">
              Upload Trade →
            </a>
          </Card>
        ) : (
          <>
            {/* Grid Layout Container - Isolated stacking context */}
            <div className="relative w-full mb-6">
              <ResponsiveGridLayout
                className="layout"
                layouts={{
                lg: layout.filter(item => isCustomizing || isWidgetVisible(item.i)),
                md: layout.filter(item => isCustomizing || isWidgetVisible(item.i)),
                sm: layout.filter(item => isCustomizing || isWidgetVisible(item.i)).map(item => ({
                  ...item,
                  x: 0,
                  w: 6,
                  static: !isCustomizing
                })),
                xs: layout.filter(item => isCustomizing || isWidgetVisible(item.i)).map(item => ({
                  ...item,
                  x: 0,
                  w: 1,
                  static: true
                }))
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 1 }}
              rowHeight={70}
              isDraggable={isCustomizing}
              isResizable={isCustomizing}
              onLayoutChange={(newLayout) => {
                if (isCustomizing) updateLayout(newLayout);
              }}
              draggableHandle=".drag-handle"
              compactType="vertical"
              preventCollision={true}
              isBounded={true}
              margin={[16, 16]}
              containerPadding={[0, 0]}
            >
                {/* Stats Widget */}
                {(isCustomizing || isWidgetVisible('stats')) && (
                  <div key="stats" className="space-y-3">
                    {/* Title and Controls */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-base lg:text-lg font-semibold">Statistics Overview</h3>
                      {isCustomizing && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={() => toggleWidgetVisibility('stats')}
                            title={isWidgetVisible('stats') ? "Hide widget" : "Show widget"}
                          >
                            {isWidgetVisible('stats') ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Stats Cards Grid - Mobile optimized */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center items-start min-h-[80px] lg:min-h-[100px] relative">
                        {/* Fees Toggle - Minimalistic in top right */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Label htmlFor="fees-toggle-grid" className="cursor-pointer text-[10px] text-muted-foreground hidden lg:inline">
                            {includeFeesInPnL ? 'w/ Fees' : 'w/o Fees'}
                          </Label>
                          <Switch
                            id="fees-toggle-grid"
                            checked={includeFeesInPnL}
                            onCheckedChange={setIncludeFeesInPnL}
                            className="scale-75"
                          />
                        </div>
                        
                        <div className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2 w-full">Total P&L</div>
                        <div className={`text-lg lg:text-2xl font-bold w-full ${
                          stats && stats.total_pnl > 0 ? 'text-neon-green' : 
                          stats && stats.total_pnl < 0 ? 'text-neon-red' : 'text-foreground'
                        }`}>
                          <AnimatedCounter value={stats?.total_pnl || 0} prefix="$" decimals={2} />
                        </div>
                      </div>
                      
                      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center items-start min-h-[80px] lg:min-h-[100px]">
                        <div className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2 w-full">Win Rate</div>
                        <div className={`text-lg lg:text-2xl font-bold w-full ${
                          stats && stats.win_rate > 70 ? 'text-neon-green' : 'text-foreground'
                        }`}>
                          <AnimatedCounter value={stats?.win_rate || 0} suffix="%" decimals={1} />
                        </div>
                      </div>
                      
                      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center items-start min-h-[80px] lg:min-h-[100px]">
                        <div className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2 w-full">Total Trades</div>
                        <div className="text-lg lg:text-2xl font-bold w-full">
                          <AnimatedCounter value={stats?.total_trades || 0} decimals={0} />
                        </div>
                      </div>
                      
                      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center items-start min-h-[80px] lg:min-h-[100px]">
                        <div className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2 w-full">Avg Duration</div>
                        <div className="text-lg lg:text-2xl font-bold w-full">
                          <AnimatedCounter value={Math.round(stats?.avg_duration || 0)} decimals={0} />
                          <span className="text-sm lg:text-base ml-1">m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Heatmap Widget - with proper spacing from stats */}
                {(isCustomizing || isWidgetVisible('heatmap')) && (
                  <div key="heatmap">
                    <DashboardWidget
                      id="heatmap"
                      title="Trading Success Heatmap"
                      isCustomizing={isCustomizing}
                      isVisible={isWidgetVisible('heatmap')}
                      onToggleVisibility={toggleWidgetVisibility}
                      className="w-fit max-w-full"
                    >
                      <TradingHeatmap trades={filteredTrades.length > 0 ? filteredTrades : trades} />
                    </DashboardWidget>
                  </div>
                )}

                {/* Charts Widget */}
                {(isCustomizing || isWidgetVisible('charts')) && (
                  <div key="charts">
                    <DashboardWidget
                      id="charts"
                      title="Performance Charts"
                      isCustomizing={isCustomizing}
                      isVisible={isWidgetVisible('charts')}
                      onToggleVisibility={toggleWidgetVisibility}
                    >
                      <DashboardCharts trades={filteredTrades.length > 0 ? filteredTrades : trades} />
                    </DashboardWidget>
                  </div>
                )}
              </ResponsiveGridLayout>
            </div>

            {/* Tabs Section - Separate stacking context */}
            {stats && stats.total_trades > 0 && (
            <div className="relative z-10 w-full">
              <Tabs defaultValue="insights" className="space-y-4 md:space-y-6">
                <TabsList className="w-full grid grid-cols-3 h-auto gap-1 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
                  <TabsTrigger value="insights" className="text-xs md:text-sm py-2">Insights</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs md:text-sm py-2">Advanced Analytics</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs md:text-sm py-2">Trade History</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4 md:space-y-6 relative">
                  <MonthlyReport 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <WeeklyReview 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GoalsTracker 
                      trades={filteredTrades.length > 0 ? filteredTrades : trades}
                    />
                    <AchievementBadges 
                      trades={filteredTrades.length > 0 ? filteredTrades : trades}
                    />
                  </div>
                  <StatisticsComparison 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <TradingStreaks 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <PerformanceInsights 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 md:space-y-6 relative">
                  <DrawdownAnalysis
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                    initialInvestment={initialInvestment}
                  />
                  <SetupManager
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <ExpenseTracker />
                  <AdvancedAnalytics
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                    initialInvestment={initialInvestment}
                    userId={user?.id || ''}
                    onInitialInvestmentUpdate={setInitialInvestment}
                  />
                </TabsContent>

              <TabsContent value="history" className="relative">
                <TradeHistory onTradesChange={fetchStats} />
              </TabsContent>
              </Tabs>
            </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
