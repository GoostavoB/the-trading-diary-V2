import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target, Eye, EyeOff, Info, GripVertical } from 'lucide-react';
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
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LazyChart } from '@/components/LazyChart';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatNumber';
import type { Trade } from '@/types/trade';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Lazy load heavy components
const TradeHistory = lazy(() => import('@/components/TradeHistory').then(m => ({ default: m.TradeHistory })));
const AdvancedAnalytics = lazy(() => import('@/components/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const GoalsTracker = lazy(() => import('@/components/GoalsTracker').then(m => ({ default: m.GoalsTracker })));
const AchievementBadges = lazy(() => import('@/components/AchievementBadges').then(m => ({ default: m.AchievementBadges })));
const WeeklyReview = lazy(() => import('@/components/WeeklyReview').then(m => ({ default: m.WeeklyReview })));
const ExpenseTracker = lazy(() => import('@/components/ExpenseTracker').then(m => ({ default: m.ExpenseTracker })));
const MonthlyReport = lazy(() => import('@/components/MonthlyReport').then(m => ({ default: m.MonthlyReport })));
const StatisticsComparison = lazy(() => import('@/components/StatisticsComparison').then(m => ({ default: m.StatisticsComparison })));
const MonthSummaryInsights = lazy(() => import('@/components/MonthSummaryInsights').then(m => ({ default: m.MonthSummaryInsights })));
const SetupManager = lazy(() => import('@/components/SetupManager').then(m => ({ default: m.SetupManager })));
const DrawdownAnalysis = lazy(() => import('@/components/DrawdownAnalysis').then(m => ({ default: m.DrawdownAnalysis })));
const TradingHeatmap = lazy(() => import('@/components/TradingHeatmap').then(m => ({ default: m.TradingHeatmap })));
const AIAssistant = lazy(() => import('@/components/AIAssistant').then(m => ({ default: m.AIAssistant })));

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
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<string>('insights');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Memoize processed trades to prevent unnecessary recalculations
  const processedTrades = useMemo(() => 
    filteredTrades.length > 0 ? filteredTrades : trades,
    [filteredTrades, trades]
  );

  // Memoize dashboard stats calculations
  const dashboardStats = useDashboardStats(processedTrades);
  
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
            {/* Draggable Dashboard Grid */}
            <ResponsiveGridLayout
              className="layout"
              layouts={{
                lg: layout.filter(item => isCustomizing || isWidgetVisible(item.i)),
                md: layout.filter(item => isCustomizing || isWidgetVisible(item.i)),
                sm: layout.filter(item => isCustomizing || isWidgetVisible(item.i)).map(item => ({
                  ...item,
                  x: 0,
                  w: 12,
                  static: !isCustomizing
                })),
                xs: layout.filter(item => isCustomizing || isWidgetVisible(item.i)).map(item => ({
                  ...item,
                  x: 0,
                  w: 12,
                  static: true
                }))
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
              cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
              rowHeight={80}
              isDraggable={isCustomizing}
              isResizable={isCustomizing}
              onLayoutChange={(newLayout) => {
                if (isCustomizing) updateLayout(newLayout);
              }}
              draggableHandle=".drag-handle"
              compactType="vertical"
              preventCollision={false}
              margin={[16, 16]}
              containerPadding={[0, 0]}
            >
              {/* Total Balance Card */}
              {(isCustomizing || isWidgetVisible('totalBalance')) && (
                <div key="totalBalance" className={isCustomizing && !isWidgetVisible('totalBalance') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('totalBalance')}
                          title={isWidgetVisible('totalBalance') ? "Hide widget" : "Show widget"}
                        >
                          {isWidgetVisible('totalBalance') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
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
                </div>
              )}

              {/* Stats Overview */}
              {(isCustomizing || isWidgetVisible('stats')) && (
                <div key="stats" className={isCustomizing && !isWidgetVisible('stats') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
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
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="glass rounded-2xl p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-primary" />
                          <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          <AnimatedCounter value={stats?.win_rate || 0} suffix="%" decimals={1} />
                        </div>
                        {/* Sparkline for win rate trend */}
                        <div className="h-10 mt-2">
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
                        {/* Sparkline for trade volume trend */}
                        <div className="h-10 mt-2">
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
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Overview */}
              {(isCustomizing || isWidgetVisible('portfolio')) && (
                <div key="portfolio" className={isCustomizing && !isWidgetVisible('portfolio') ? 'opacity-50' : ''}>
                  <div className="relative h-full glass rounded-2xl p-6 hover-lift">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('portfolio')}
                        >
                          {isWidgetVisible('portfolio') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
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
                    <div className="h-64">
                      <LazyChart height={256}>
                        <DashboardCharts 
                          trades={processedTrades} 
                          chartType="cumulative" 
                        />
                      </LazyChart>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Movers */}
              {(isCustomizing || isWidgetVisible('topMovers')) && (
                <div key="topMovers" className={isCustomizing && !isWidgetVisible('topMovers') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('topMovers')}
                        >
                          {isWidgetVisible('topMovers') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    <TopMoversCard 
                      trades={processedTrades}
                    />
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {(isCustomizing || isWidgetVisible('quickActions')) && (
                <div key="quickActions" className={isCustomizing && !isWidgetVisible('quickActions') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('quickActions')}
                        >
                          {isWidgetVisible('quickActions') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    <QuickActionCard />
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {(isCustomizing || isWidgetVisible('recentTransactions')) && (
                <div key="recentTransactions" className={isCustomizing && !isWidgetVisible('recentTransactions') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('recentTransactions')}
                        >
                          {isWidgetVisible('recentTransactions') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    <RecentTransactionsCard 
                      trades={processedTrades}
                    />
                  </div>
                </div>
              )}

              {/* Premium CTA */}
              {(isCustomizing || isWidgetVisible('premiumCTA')) && (
                <div key="premiumCTA" className={isCustomizing && !isWidgetVisible('premiumCTA') ? 'opacity-50' : ''}>
                  <div className="relative h-full">
                    {isCustomizing && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 drag-handle cursor-move hover:bg-primary/10"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10"
                          onClick={() => toggleWidgetVisibility('premiumCTA')}
                        >
                          {isWidgetVisible('premiumCTA') ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    <PremiumCTACard />
                  </div>
                </div>
              )}
            </ResponsiveGridLayout>

            {/* Month Summary Insights */}
            {stats && stats.total_trades > 0 && (
              <div className="mt-6">
                <MonthSummaryInsights trades={processedTrades} />
              </div>
            )}

            {/* Trading Streaks */}
            {stats && stats.total_trades > 0 && (
              <div className="mb-6">
                <TradingStreaks trades={processedTrades} />
              </div>
            )}

            {/* Charts Section - Flexible Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="glass rounded-2xl p-6 hover-lift widget-card">
                <div className="flex items-center justify-between mb-4 w-full">
                  <h3 className="text-lg font-semibold">Cumulative P&L</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="glass-strong max-w-xs">
                        <p className="font-semibold mb-1">Cumulative Profit & Loss</p>
                        <p className="text-xs mb-2">Running total of all profits and losses over time, showing your account growth trajectory.</p>
                        <p className="text-xs text-muted-foreground">Formula: Sum of all P&L values up to each point in time</p>
                        <p className="text-xs text-accent mt-2">Why it matters: Visualizes your overall trading performance trend and consistency.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="chart-wrapper">
                  <LazyChart height={280}>
                    <DashboardCharts trades={processedTrades} chartType="cumulative" />
                  </LazyChart>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6 hover-lift widget-card">
                <div className="flex items-center justify-between mb-4 w-full">
                  <h3 className="text-lg font-semibold">Wins vs Losses</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="glass-strong max-w-xs">
                        <p className="font-semibold mb-1">Wins vs Losses Distribution</p>
                        <p className="text-xs mb-2">Compares the number and magnitude of profitable trades against losing trades.</p>
                        <p className="text-xs text-muted-foreground">Shows: Count and total value of winning vs losing positions</p>
                        <p className="text-xs text-accent mt-2">Why it matters: Helps identify if losses are balanced by wins and guides risk management.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="chart-wrapper">
                  <LazyChart height={280}>
                    <DashboardCharts trades={processedTrades} chartType="winsLosses" />
                  </LazyChart>
                </div>
              </div>
            </div>

            {/* Trading Heatmap */}
            {stats && stats.total_trades > 0 && (
              <div className="glass rounded-2xl p-6 hover-lift widget-card mb-6">
                <div className="flex items-center justify-between mb-4 w-full">
                  <h3 className="text-lg font-semibold">Trading Heatmap</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="glass-strong max-w-xs">
                        <p className="font-semibold mb-1">Trading Activity Heatmap</p>
                        <p className="text-xs mb-2">Visual representation of trading frequency and profitability by day and time.</p>
                        <p className="text-xs text-muted-foreground">Shows: Color-coded cells indicating P&L intensity across different time periods</p>
                        <p className="text-xs text-accent mt-2">Why it matters: Identifies your most and least profitable trading times, helping optimize your schedule.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="chart-wrapper">
                  <LazyChart height={300}>
                    <TradingHeatmap trades={processedTrades} />
                  </LazyChart>
                </div>
              </div>
            )}

            {/* Wins by Hour Chart */}
            {stats && stats.total_trades > 0 && (
              <div className="mb-6">
                <LazyChart height={300}>
                  <WinsByHourChart trades={processedTrades} />
                </LazyChart>
              </div>
            )}

            {/* Grid Layout Container - Isolated stacking context */}
            <div className="relative w-full mb-3">
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
            </ResponsiveGridLayout>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <TabsList className="glass rounded-2xl grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1.5">
                <TabsTrigger value="insights" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Insights</TabsTrigger>
                <TabsTrigger value="history" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">History</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Analytics</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Monthly</TabsTrigger>
                <TabsTrigger value="goals" className="text-xs md:text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Goals</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4 md:space-y-6 relative glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <MonthlyReport 
                    trades={processedTrades}
                  />
                  <PerformanceInsights
                    trades={processedTrades}
                  />
                  <StatisticsComparison 
                    trades={processedTrades}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="history" className="relative glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <TradeHistory onTradesChange={fetchStats} />
                </Suspense>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 md:space-y-6 relative glass rounded-2xl p-6">
                {/* Additional Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <MaxDrawdownCard value={3500} percentage={12.5} />
                  <CurrentStreakCard 
                    streak={calculateCurrentStreak(processedTrades)}
                    type={calculateStreakType(processedTrades)}
                  />
                  <div className="p-5 glass rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-2">Best Asset</p>
                    <p className="text-2xl font-bold">{getBestAsset(processedTrades)}</p>
                  </div>
                </div>

                <Suspense fallback={<DashboardSkeleton />}>
                  <DrawdownAnalysis
                    trades={processedTrades}
                    initialInvestment={initialInvestment}
                  />
                  <SetupManager
                    trades={processedTrades}
                  />
                  <AdvancedAnalytics
                    trades={processedTrades}
                    initialInvestment={initialInvestment}
                    userId={user?.id || ''}
                    onInitialInvestmentUpdate={setInitialInvestment}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="weekly" className="glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <WeeklyReview 
                    trades={processedTrades}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="monthly" className="glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <MonthlyReport 
                    trades={processedTrades}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4 md:space-y-6 glass rounded-2xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GoalsTracker 
                      trades={processedTrades}
                    />
                    <AchievementBadges 
                      trades={processedTrades}
                    />
                  </div>
                  <ExpenseTracker />
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
