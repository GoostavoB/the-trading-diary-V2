import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target, Eye, EyeOff, Info, GripVertical } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardCharts } from '@/components/DashboardCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceInsights } from '@/components/PerformanceInsights';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { TradingStreaks } from '@/components/TradingStreaks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { DashboardWidget } from '@/components/DashboardWidget';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { AccentColorPicker } from '@/components/AccentColorPicker';
import { WinsByHourChart } from '@/components/charts/WinsByHourChart';
import { MaxDrawdownCard } from '@/components/MaxDrawdownCard';
import { TopAssetsByWinRate } from '@/components/TopAssetsByWinRate';
import { CurrentStreakCard } from '@/components/CurrentStreakCard';
import { TotalBalanceCard } from '@/components/TotalBalanceCard';
import { TopMoversCard } from '@/components/TopMoversCard';
import { QuickActionCard } from '@/components/QuickActionCard';
import { RecentTransactionsCard } from '@/components/RecentTransactionsCard';
import { PremiumCTACard } from '@/components/PremiumCTACard';
import { AIInsightCard } from '@/components/AIInsightCard';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import { LazyChart } from '@/components/LazyChart';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatNumber';
import type { Trade } from '@/types/trade';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// Lazy load heavy components
const TradeHistory = lazy(() => import('@/components/TradeHistory').then(m => ({ default: m.TradeHistory })));
const AdvancedAnalytics = lazy(() => import('@/components/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const GoalsTracker = lazy(() => import('@/components/GoalsTracker').then(m => ({ default: m.GoalsTracker })));
const WeeklyReview = lazy(() => import('@/components/WeeklyReview').then(m => ({ default: m.WeeklyReview })));
const ExpenseTracker = lazy(() => import('@/components/ExpenseTracker').then(m => ({ default: m.ExpenseTracker })));
const MonthlyReport = lazy(() => import('@/components/MonthlyReport').then(m => ({ default: m.MonthlyReport })));
const StatisticsComparison = lazy(() => import('@/components/StatisticsComparison').then(m => ({ default: m.StatisticsComparison })));
const SetupManager = lazy(() => import('@/components/SetupManager').then(m => ({ default: m.SetupManager })));
const DrawdownAnalysis = lazy(() => import('@/components/DrawdownAnalysis').then(m => ({ default: m.DrawdownAnalysis })));
const TradingHeatmap = lazy(() => import('@/components/TradingHeatmap').then(m => ({ default: m.TradingHeatmap })));
const AIAssistant = lazy(() => import('@/components/AIAssistant').then(m => ({ default: m.AIAssistant })));

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
  const [capitalLog, setCapitalLog] = useState<any[]>([]);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Memoize processed trades to prevent unnecessary recalculations
  const processedTrades = useMemo(() => 
    filteredTrades.length > 0 ? filteredTrades : trades,
    [filteredTrades, trades]
  );

  // Memoize dashboard stats calculations with capital log
  const dashboardStats = useDashboardStats(processedTrades, capitalLog);

  // Enable badge notifications
  useBadgeNotifications(processedTrades);
  
  const handleTabChange = useCallback((val: string) => {
    const container = tabsContainerRef.current?.closest('main') as HTMLElement | null;
    const prevScrollTop = container ? container.scrollTop : window.scrollY;
    setActiveTab(val);
    requestAnimationFrame(() => {
      if (container) container.scrollTop = prevScrollTop;
      else window.scrollTo({ top: prevScrollTop });
    });
  }, []);
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

  const fetchCapitalLog = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('capital_log')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true });

    if (error) {
      console.error('Error fetching capital log:', error);
    } else {
      setCapitalLog(data || []);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchInitialInvestment();
      fetchCapitalLog();
    }
    
    // Set up realtime subscription for trades and capital changes
    const tradesChannel = supabase
      .channel('trades-changes-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchStats();
        }
      )
      .subscribe();
    
    const capitalChannel = supabase
      .channel('capital-changes-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'capital_log', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchCapitalLog();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(capitalChannel);
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

  // Memoize helper functions for performance
  const calculateCurrentStreak = useCallback((trades: Trade[]) => {
    if (trades.length === 0) return 0;
    const sorted = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
    let streak = 0;
    const isWinning = sorted[0].pnl > 0;
    for (const trade of sorted) {
      if ((isWinning && trade.pnl > 0) || (!isWinning && trade.pnl <= 0)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, []);

  const calculateStreakType = useCallback((trades: Trade[]): 'winning' | 'losing' => {
    if (trades.length === 0) return 'winning';
    const sorted = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
    return sorted[0].pnl > 0 ? 'winning' : 'losing';
  }, []);

  const getBestAsset = useCallback((trades: Trade[]) => {
    if (trades.length === 0) return 'N/A';
    const assetPnL: Record<string, number> = {};
    trades.forEach(t => {
      const symbol = t.symbol || 'Unknown';
      assetPnL[symbol] = (assetPnL[symbol] || 0) + (t.pnl || 0);
    });
    const best = Object.entries(assetPnL).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : 'N/A';
  }, []);

  // Memoize handlers
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const handleStartCustomize = useCallback(() => {
    setIsCustomizing(true);
  }, [setIsCustomizing]);

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
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-dashboard-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Screen reader announcements for dynamic updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {stats && `Dashboard updated. Total P&L: ${formatCurrency(stats.total_pnl)}, Win rate: ${stats.win_rate.toFixed(1)}%, Total trades: ${stats.total_trades}`}
      </div>

      <div id="main-dashboard-content" className="space-y-6 mobile-safe animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-sm text-muted-foreground/80">Track your trading performance and analytics</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AccentColorPicker />
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
            {trades.length > 0 && (
              <ExportTradesDialog trades={processedTrades} />
            )}
          </div>
        </div>

        {/* Customize Dashboard Controls */}
        <CustomizeDashboardControls
          isCustomizing={isCustomizing}
          hasChanges={hasChanges}
          onStartCustomize={handleStartCustomize}
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
            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <TabsList className="glass rounded-2xl grid w-full grid-cols-3 h-auto p-1.5">
                <TabsTrigger value="overview" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Overview</TabsTrigger>
                <TabsTrigger value="insights" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Insights</TabsTrigger>
                <TabsTrigger value="history" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">History</TabsTrigger>
              </TabsList>

              {/* Overview Tab - Main Dashboard Grid */}
              <TabsContent value="overview" className="space-y-6">
                {/* Dashboard Grid */}
                <GridLayout
                  className="dashboard-grid"
                  layout={layout}
                  cols={12}
                  rowHeight={30}
                  width={1200}
                  isDraggable={isCustomizing}
                  isResizable={isCustomizing}
                  onLayoutChange={updateLayout}
                  draggableHandle=".drag-handle"
                  compactType="vertical"
                >
              {/* Total Balance Card */}
              {(isCustomizing || isWidgetVisible('totalBalance')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('totalBalance') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('totalBalance')}
                        title={isWidgetVisible('totalBalance') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('totalBalance') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <TotalBalanceCard 
                    balance={stats?.total_pnl || 0}
                    change={stats?.total_pnl || 0}
                    changePercent={initialInvestment > 0 ? ((stats?.total_pnl || 0) / initialInvestment) * 100 : 0}
                    trades={processedTrades}
                  />
                </div>
              )}

              {/* Stats Overview */}
              {(isCustomizing || isWidgetVisible('stats')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('stats') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('stats')}
                        title={isWidgetVisible('stats') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('stats') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="glass rounded-2xl p-4 hover-lift">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <Info className="h-3 w-3 text-muted-foreground/60" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Percentage of winning trades out of total trades</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedCounter value={stats?.win_rate || 0} suffix="%" decimals={1} />
                      </div>
                      <div className="chart-wrapper h-10 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trades.slice(-7).map((t, i) => ({ 
                            value: trades.slice(0, i + 1).filter(trade => trade.pnl > 0).length / (i + 1) * 100 
                          }))}>
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <RechartsTooltip 
                              content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="glass-strong px-3 py-2 rounded-lg text-sm font-semibold border border-border/50 shadow-lg">
                                      {(payload[0].value as number).toFixed(1)}%
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="glass rounded-2xl p-4 hover-lift">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <div className="text-xs text-muted-foreground font-medium">Total Trades</div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedCounter value={stats?.total_trades || 0} decimals={0} />
                      </div>
                      <div className="chart-wrapper h-10 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trades.slice(-7).map((_, i) => ({ 
                            value: trades.slice(0, -7 + i + 1).length 
                          }))}>
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <RechartsTooltip 
                              content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="glass-strong px-3 py-2 rounded-lg text-sm font-semibold border border-border/50 shadow-lg">
                                      {Math.round(payload[0].value as number)} trades
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Overview */}
              {(isCustomizing || isWidgetVisible('portfolio')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('portfolio') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('portfolio')}
                        title={isWidgetVisible('portfolio') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('portfolio') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Portfolio Overview</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">7D</Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2 bg-primary/10 text-primary">30D</Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">90D</Button>
                    </div>
                  </div>
                  <div className="chart-wrapper">
                    <LazyChart height={256}>
                      <DashboardCharts 
                        trades={processedTrades} 
                        chartType="cumulative" 
                      />
                    </LazyChart>
                  </div>
                </div>
              )}

              {/* Top Movers */}
              {(isCustomizing || isWidgetVisible('topMovers')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('topMovers') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('topMovers')}
                        title={isWidgetVisible('topMovers') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('topMovers') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <TopMoversCard trades={processedTrades} />
                </div>
              )}

              {/* Quick Actions */}
              {(isCustomizing || isWidgetVisible('quickActions')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('quickActions') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('quickActions')}
                        title={isWidgetVisible('quickActions') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('quickActions') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <QuickActionCard />
                </div>
              )}

              {/* Recent Transactions */}
              {(isCustomizing || isWidgetVisible('recentTransactions')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('recentTransactions') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('recentTransactions')}
                        title={isWidgetVisible('recentTransactions') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('recentTransactions') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <RecentTransactionsCard trades={processedTrades} />
                </div>
              )}

              {/* AI Insight */}
              {(isCustomizing || isWidgetVisible('insights')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('insights') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('insights')}
                        title={isWidgetVisible('insights') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('insights') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <AIInsightCard 
                    trades={processedTrades}
                    capitalLog={capitalLog}
                    stats={dashboardStats}
                  />
                </div>
              )}

              {/* Premium CTA */}
              {(isCustomizing || isWidgetVisible('premiumCTA')) && (
                <div className={`dash-card ${isCustomizing && !isWidgetVisible('premiumCTA') ? 'opacity-50' : ''}`}>
                  {isCustomizing && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => toggleWidgetVisibility('premiumCTA')}
                        title={isWidgetVisible('premiumCTA') ? "Hide widget" : "Show widget"}
                      >
                        {isWidgetVisible('premiumCTA') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <PremiumCTACard />
                </div>
              )}
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4 md:space-y-6 relative glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <TradingStreaks trades={processedTrades} />
                  <MonthlyReport trades={processedTrades} />
                  <PerformanceInsights trades={processedTrades} />
                  <StatisticsComparison trades={processedTrades} />
                </Suspense>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="relative glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <TradeHistory onTradesChange={fetchStats} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {/* AI Assistant */}
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
