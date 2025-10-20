import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Plus } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceInsights } from '@/components/PerformanceInsights';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { TradingStreaks } from '@/components/TradingStreaks';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { AccentColorPicker } from '@/components/AccentColorPicker';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { formatCurrency } from '@/utils/formatNumber';
import type { Trade } from '@/types/trade';
import { WIDGET_CATALOG } from '@/config/widgetCatalog';
import { WidgetLibrary } from '@/components/widgets/WidgetLibrary';

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
  avg_pnl_per_trade: number;
  avg_pnl_per_day: number;
  trading_days: number;
  current_roi: number;
  avg_roi_per_trade: number;
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
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  
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
  // Widget system
  const {
    layout,
    isLoading: isLayoutLoading,
    updateLayout,
    saveLayout,
    addWidget,
    removeWidget,
    resetLayout,
    activeWidgets,
  } = useWidgetLayout(user?.id);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  // Spot wallet data for widget
  const { holdings, isLoading: isSpotWalletLoading } = useSpotWallet();
  const { prices } = useTokenPrices(holdings.map(h => h.token_symbol));

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

  // Measure grid container width for responsive layout
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

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

      // Calculate unique trading days
      const uniqueDays = new Set(trades.map(t => new Date(t.trade_date).toDateString())).size;
      
      // Calculate average P&L per trade
      const avgPnLPerTrade = trades.length > 0 
        ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / trades.length 
        : 0;
      
      // Calculate average P&L per day
      const avgPnLPerDay = uniqueDays > 0 
        ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / uniqueDays 
        : 0;
      
      // Calculate current balance
      const currentBalance = initialInvestment + (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees);
      
      // Calculate current ROI from initial capital
      const currentROI = initialInvestment > 0 
        ? ((currentBalance - initialInvestment) / initialInvestment) * 100 
        : 0;
      
      // Calculate average ROI per trade
      const avgROIPerTrade = trades.length > 0 
        ? trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length 
        : 0;

      setStats({
        total_pnl: includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees,
        win_rate: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
        total_trades: trades.length,
        avg_duration: avgDuration,
        avg_pnl_per_trade: avgPnLPerTrade,
        avg_pnl_per_day: avgPnLPerDay,
        trading_days: uniqueDays,
        current_roi: currentROI,
        avg_roi_per_trade: avgROIPerTrade,
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
  }, []);

  const handleSaveLayout = useCallback(() => {
    saveLayout(layout);
    setIsCustomizing(false);
    // Force charts to recalculate dimensions
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [layout, saveLayout]);

  // Auto-fit widget heights based on rendered content
  useEffect(() => {
    if (!layout?.length) return;

    // Measure after paint
    const id = requestAnimationFrame(() => {
      let changed = false;
      const updated = layout.map((item: any) => {
        const el = itemRefs.current[item.i];
        if (!el) return item;
        const contentHeight = el.scrollHeight; // includes overflowed content
        const desiredH = Math.max(item.minH || 1, Math.ceil(contentHeight / ROW_HEIGHT_PX));
        if (desiredH !== item.h) {
          changed = true;
          return { ...item, h: desiredH };
        }
        return item;
      });
      if (changed) {
        updateLayout(updated);
      }
    });

    return () => cancelAnimationFrame(id);
  }, [containerWidth, isCustomizing, layout, updateLayout]);
  const handleCancelCustomize = useCallback(() => {
    setIsCustomizing(false);
  }, []);
  const spotWalletTotal = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const price = Number(prices[holding.token_symbol] || 0);
      return sum + (Number(holding.quantity) * price);
    }, 0);
  }, [holdings, prices]);

  const portfolioChartData = useMemo(() => {
    const combined = [...trades, ...capitalLog.map(c => ({
      trade_date: c.log_date,
      pnl: c.amount_added
    }))].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    let cumulative = initialInvestment;
    return combined.map(item => {
      cumulative += item.pnl || 0;
      return {
        date: new Date(item.trade_date).toLocaleDateString(),
        value: cumulative
      };
    });
  }, [trades, capitalLog, initialInvestment]);

  // Dynamic widget renderer
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ROW_HEIGHT_PX = 120;

  const renderWidget = useCallback((layoutItem: any) => {
    const widgetConfig = WIDGET_CATALOG[layoutItem.i];
    if (!widgetConfig) return null;

    const WidgetComponent = widgetConfig.component;
    const widgetId = layoutItem.i;

    // Prepare props based on widget ID
    const widgetProps: any = {
      id: widgetId,
      isEditMode: isCustomizing,
      onRemove: () => removeWidget(widgetId),
    };

    // Add widget-specific data
    switch (widgetId) {
      case 'totalBalance':
        widgetProps.totalBalance = stats?.total_pnl || 0;
        widgetProps.change24h = stats?.total_pnl || 0;
        widgetProps.changePercent24h = initialInvestment > 0 
          ? ((stats?.total_pnl || 0) / initialInvestment) * 100 
          : 0;
        break;
      case 'winRate':
        const winningTrades = processedTrades.filter(t => t.pnl > 0).length;
        const losingTrades = processedTrades.filter(t => t.pnl <= 0).length;
        widgetProps.winRate = stats?.win_rate || 0;
        widgetProps.wins = winningTrades;
        widgetProps.losses = losingTrades;
        break;
      case 'totalTrades':
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'spotWallet':
        widgetProps.totalValue = spotWalletTotal || 0;
        widgetProps.change24h = 0;
        widgetProps.changePercent24h = 0;
        widgetProps.tokenCount = holdings?.length || 0;
        break;
      case 'portfolioOverview':
        widgetProps.data = portfolioChartData;
        widgetProps.totalValue = stats?.total_pnl || 0;
        break;
      case 'topMovers':
      case 'aiInsights':
      case 'recentTransactions':
        widgetProps.trades = processedTrades;
        break;
      case 'quickActions':
        // No additional props needed
        break;
      case 'avgPnLPerTrade':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        break;
      case 'avgPnLPerDay':
        widgetProps.avgPnLPerDay = stats?.avg_pnl_per_day || 0;
        widgetProps.tradingDays = stats?.trading_days || 0;
        break;
      case 'currentROI':
        widgetProps.currentROI = stats?.current_roi || 0;
        widgetProps.initialInvestment = initialInvestment;
        widgetProps.currentBalance = initialInvestment + (stats?.total_pnl || 0);
        break;
      case 'avgROIPerTrade':
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
    }

    return (
      <div
        key={layoutItem.i}
        className="dash-card"
        ref={(el) => { itemRefs.current[layoutItem.i] = el; }}
      >
        <WidgetComponent {...widgetProps} />
      </div>
    );
  }, [isCustomizing, removeWidget, stats, processedTrades, initialInvestment, spotWalletTotal, holdings, portfolioChartData]);

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
        {!loading && stats && stats.total_trades > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {!isCustomizing ? (
              <Button
                onClick={handleStartCustomize}
                variant="outline"
                className="glass"
              >
                Customize Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowWidgetLibrary(true)}
                  variant="outline"
                  className="glass"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
                <Button onClick={handleSaveLayout} variant="default">
                  Save Layout
                </Button>
                <Button onClick={handleCancelCustomize} variant="outline">
                  Cancel
                </Button>
                <Button onClick={resetLayout} variant="ghost">
                  Reset to Default
                </Button>
              </>
            )}
          </div>
        )}

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
                <div ref={gridContainerRef} className="w-full">
                  <GridLayout
                    className="dashboard-grid"
                    layout={layout}
                    cols={12}
                    rowHeight={1}
                    width={containerWidth}
                    margin={[20, 20]}
                    containerPadding={[0, 0]}
                    isDraggable={isCustomizing}
                    isResizable={isCustomizing}
                    onLayoutChange={updateLayout}
                    draggableHandle=".drag-handle"
                    compactType="vertical"
                    preventCollision={false}
                    isBounded={true}
                    autoSize={true}
                  >
                    {layout.map(renderWidget)}
                  </GridLayout>
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

        {/* Widget Library Modal */}
        <WidgetLibrary
          open={showWidgetLibrary}
          onClose={() => setShowWidgetLibrary(false)}
          onAddWidget={addWidget}
          activeWidgets={activeWidgets}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
