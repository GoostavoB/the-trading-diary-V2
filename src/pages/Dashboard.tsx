import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Plus, Columns } from 'lucide-react';
import { DndContext, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, MeasuringStrategy } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsightsQuickSummary } from '@/components/insights/InsightsQuickSummary';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { TradingStreaks } from '@/components/TradingStreaks';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { AccentColorPicker } from '@/components/AccentColorPicker';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatCurrency } from '@/utils/formatNumber';
import type { Trade } from '@/types/trade';
import { WIDGET_CATALOG } from '@/config/widgetCatalog';
import { WidgetLibrary } from '@/components/widgets/WidgetLibrary';
import { SortableWidget } from '@/components/widgets/SortableWidget';
import { CustomWidgetRenderer } from '@/components/widgets/CustomWidgetRenderer';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useGridLayout, WidgetPosition } from '@/hooks/useGridLayout';
import { DropZone } from '@/components/widgets/DropZone';

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

function calculateCurrentStreak(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 0;
  const sorted = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
  let count = 0;
  const isWinning = (sorted[0].pnl || 0) > 0;
  for (const trade of sorted) {
    const pnl = trade.pnl || 0;
    if ((isWinning && pnl > 0) || (!isWinning && pnl <= 0)) {
      count++;
    } else {
      break;
    }
  }
  return isWinning ? count : -count;
}

const Dashboard = () => {
  useKeyboardShortcuts();
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  
  // Memoize processed trades to prevent unnecessary recalculations
  const processedTrades = useMemo(() => 
    filteredTrades.length > 0 ? filteredTrades : trades,
    [filteredTrades, trades]
  );

  // Memoize dashboard stats calculations with capital log
  const dashboardStats = useDashboardStats(processedTrades, capitalLog);

  // Memoize current streak calculation
  const currentStreak = useMemo(() => {
    const streak = calculateCurrentStreak(processedTrades);
    return { 
      type: (streak > 0 ? 'win' : 'loss') as 'win' | 'loss',
      count: Math.abs(streak)
    };
  }, [processedTrades]);

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
  // Grid layout with free positioning
  const {
    positions,
    isLoading: isLayoutLoading,
    updatePosition,
    saveLayout: saveGridLayout,
    addWidget,
    removeWidget,
    resetLayout,
  } = useGridLayout(user?.id, Object.keys(WIDGET_CATALOG));

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedColumnCount, setSelectedColumnCount] = useState(3);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);

  // Track column count based on user selection and viewport
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    
    const updateCols = () => {
      const width = el.clientWidth;
      // On mobile, always use 1 column
      if (width < 768) {
        setColumnCount(1);
      } else {
        // Use user's selected column count
        setColumnCount(selectedColumnCount);
      }
    };
    
    updateCols();
    const ro = new ResizeObserver(updateCols);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedColumnCount]);

  // Organize widgets by column and row
  const grid = useMemo(() => {
    const result: { [col: number]: { [row: number]: string } } = {};
    
    console.log('Building grid from positions:', positions);
    
    positions.forEach(pos => {
      if (!result[pos.column]) result[pos.column] = {};
      result[pos.column][pos.row] = pos.id;
    });
    
    console.log('Grid structure:', result);
    return result;
  }, [positions]);

  const activeWidgets = useMemo(() => {
    const widgets = positions.map(p => p.id);
    console.log('Active widgets:', widgets);
    return widgets;
  }, [positions]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const fetchCustomWidgets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_dashboard_widgets')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching custom widgets:', error);
    } else {
      setCustomWidgets(data || []);
    }
  };


  useEffect(() => {
    if (user) {
      fetchStats();
      fetchInitialInvestment();
      fetchCapitalLog();
      fetchCustomWidgets();
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
  }, [user, includeFeesInPnL, initialInvestment]);

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

  // calculateCurrentStreak moved to top-level helper for hoisting

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
    saveGridLayout(positions);
    setIsCustomizing(false);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [positions, saveGridLayout]);

  // Handle drag
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find active widget position
    const activePos = positions.find(p => p.id === activeId);
    if (!activePos) {
      console.error('Active widget not found:', activeId);
      setActiveId(null);
      return;
    }

    let updatedPositions: WidgetPosition[];

    // Handle drop on another widget - swap positions
    const overPos = positions.find(p => p.id === overId);
    if (overPos) {
      // Simply swap positions - no shifting needed
      updatedPositions = positions.map(p => {
        if (p.id === activeId) {
          return { ...p, column: overPos.column, row: overPos.row };
        }
        if (p.id === overId) {
          return { ...p, column: activePos.column, row: activePos.row };
        }
        return p;
      });
    }
    // Handle drop on dropzone
    else if (overId.startsWith('dropzone-')) {
      const [, colStr, rowStr] = overId.split('-');
      const targetCol = parseInt(colStr, 10);
      const targetRow = parseInt(rowStr, 10);
      
      updatedPositions = positions.map(p =>
        p.id === activeId ? { ...p, column: targetCol, row: targetRow } : p
      );
    }
    else {
      console.warn('Unknown drop target:', overId);
      setActiveId(null);
      return;
    }

    // Validate all widgets are still present
    const originalIds = new Set(positions.map(p => p.id));
    const updatedIds = new Set(updatedPositions.map(p => p.id));
    
    if (originalIds.size !== updatedIds.size) {
      console.error('Widget count mismatch!', {
        original: Array.from(originalIds),
        updated: Array.from(updatedIds)
      });
      toast.error('Layout update failed - widgets would be lost');
      setActiveId(null);
      return;
    }

    // Save the updated positions (this will also update the hook's internal state)
    saveGridLayout(updatedPositions);
    setActiveId(null);
  }, [positions, saveGridLayout]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCancelCustomize = useCallback(() => {
    setIsCustomizing(false);
  }, []);

  const spotWalletTotal = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const price = Number(prices[holding.token_symbol] || 0);
      return sum + (Number(holding.quantity) * price);
    }, 0);
  }, [holdings, prices]);

  // Calculate total capital additions from capital log
  const totalCapitalAdditions = useMemo(() => {
    return capitalLog.reduce((sum, log) => sum + (log.amount_added || 0), 0);
  }, [capitalLog]);

  const portfolioChartData = useMemo(() => {
    // Start with initial investment as the first data point
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Show last 6 months
    
    // Combine trades and capital additions
    const combined = [...trades, ...capitalLog.map(c => ({
      trade_date: c.log_date,
      pnl: c.amount_added
    }))].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    // Always start with initial investment
    const chartData = [];
    let cumulative = initialInvestment;
    
    // Add initial point if we have no data or if the first data point is after our start date
    if (combined.length === 0 || new Date(combined[0].trade_date) > startDate) {
      chartData.push({
        date: startDate.toLocaleDateString(),
        value: initialInvestment
      });
    }
    
    // Add all trades and capital additions
    combined.forEach(item => {
      cumulative += item.pnl || 0;
      chartData.push({
        date: new Date(item.trade_date).toLocaleDateString(),
        value: cumulative
      });
    });
    
    return chartData;
  }, [trades, capitalLog, initialInvestment]);

  // Dynamic widget renderer
  const renderWidget = useCallback((widgetId: string) => {
    // Check if it's a custom widget
    if (widgetId.startsWith('custom-')) {
      const customWidgetId = widgetId.replace('custom-', '');
      const customWidget = customWidgets.find(w => w.id === customWidgetId);
      
      if (!customWidget) return null;

      return (
        <SortableWidget
          key={widgetId}
          id={widgetId}
          isEditMode={isCustomizing}
          onRemove={() => removeWidget(widgetId)}
        >
          <CustomWidgetRenderer 
            widget={customWidget}
            onDelete={() => {
              removeWidget(widgetId);
              fetchCustomWidgets();
            }}
          />
        </SortableWidget>
      );
    }

    // Built-in widgets
    const widgetConfig = WIDGET_CATALOG[widgetId];
    if (!widgetConfig) return null;

    const WidgetComponent = widgetConfig.component;

    // Prepare props based on widget ID
    const widgetProps: any = {
      id: widgetId,
      isEditMode: isCustomizing,
      isCompact: false,
      onRemove: () => removeWidget(widgetId),
    };

    // Add widget-specific data
    switch (widgetId) {
      case 'totalBalance':
        widgetProps.totalBalance = initialInvestment + totalCapitalAdditions + (stats?.total_pnl || 0);
        widgetProps.change24h = stats?.total_pnl || 0;
        widgetProps.changePercent24h = (initialInvestment + totalCapitalAdditions) > 0 
          ? ((stats?.total_pnl || 0) / (initialInvestment + totalCapitalAdditions)) * 100 
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
        widgetProps.totalValue = initialInvestment + totalCapitalAdditions + (stats?.total_pnl || 0);
        break;
      case 'topMovers':
      case 'aiInsights':
      case 'recentTransactions':
        widgetProps.trades = processedTrades;
        break;
      case 'behaviorAnalytics':
        widgetProps.trades = processedTrades;
        break;
      case 'costEfficiency':
        widgetProps.trades = processedTrades;
        break;
      case 'performanceHighlights':
        widgetProps.trades = processedTrades;
        widgetProps.bestTrade = dashboardStats.bestTrade;
        widgetProps.worstTrade = dashboardStats.worstTrade;
        widgetProps.currentStreak = currentStreak;
        break;
      case 'tradingQuality':
        const minPnl = processedTrades.length > 0 
          ? Math.min(...processedTrades.map(t => t.pnl || 0)) 
          : 0;
        widgetProps.avgWin = dashboardStats.avgWin;
        widgetProps.avgLoss = dashboardStats.avgLoss;
        widgetProps.winCount = dashboardStats.winningTrades.length;
        widgetProps.lossCount = dashboardStats.losingTrades.length;
        widgetProps.maxDrawdownAmount = Math.min(0, minPnl);
        widgetProps.maxDrawdownPercent = initialInvestment > 0 
          ? Math.abs((minPnl / initialInvestment) * 100) 
          : 0;
        widgetProps.profitFactor = dashboardStats.profitFactor;
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
        widgetProps.currentBalance = initialInvestment + totalCapitalAdditions + (stats?.total_pnl || 0);
        widgetProps.onInitialInvestmentUpdate = async (newValue: number) => {
          setInitialInvestment(newValue);
          // fetchStats will be automatically called via useEffect when initialInvestment changes
        };
        break;
      case 'avgROIPerTrade':
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'capitalGrowth':
        widgetProps.chartData = portfolioChartData;
        widgetProps.initialInvestment = initialInvestment;
        widgetProps.totalCapitalAdditions = totalCapitalAdditions;
        widgetProps.currentBalance = initialInvestment + totalCapitalAdditions + (stats?.total_pnl || 0);
        break;
    }

    return (
      <SortableWidget
        key={widgetId}
        id={widgetId}
        isEditMode={isCustomizing}
        onRemove={() => removeWidget(widgetId)}
      >
        <WidgetComponent {...widgetProps} />
      </SortableWidget>
    );
  }, [isCustomizing, removeWidget, stats, processedTrades, initialInvestment, spotWalletTotal, holdings, portfolioChartData, customWidgets, fetchCustomWidgets]);

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
            <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('dashboard.title')}</h1>
            <p className="text-sm text-muted-foreground/80">{t('dashboard.overview')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AccentColorPicker />
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
            {trades.length > 0 && (
              <ExportTradesDialog trades={processedTrades} />
            )}
          </div>
        </div>

        {/* Customize Dashboard Controls - Only show on Overview tab */}
        {!loading && stats && stats.total_trades > 0 && activeTab === 'overview' && (
          <CustomizeDashboardControls
            isCustomizing={isCustomizing}
            hasChanges={false}
            onStartCustomize={handleStartCustomize}
            onSave={handleSaveLayout}
            onCancel={handleCancelCustomize}
            onReset={resetLayout}
            columnCount={selectedColumnCount}
            onColumnCountChange={setSelectedColumnCount}
            widgetCount={positions.length}
          />
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : stats && stats.total_trades === 0 ? (
          <Card className="p-8 text-center glass">
            <h3 className="text-xl font-semibold mb-2">{t('trades.trades')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('upload.uploadSuccess')}
            </p>
            <a href="/upload" className="text-primary hover:underline">
              {t('trades.addTrade')} →
            </a>
          </Card>
        ) : (
          <>
            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <TabsList className="glass rounded-2xl grid w-full grid-cols-3 h-auto p-1.5">
                <TabsTrigger value="overview" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('dashboard.overview')}</TabsTrigger>
                <TabsTrigger value="insights" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('analytics.insights')}</TabsTrigger>
                <TabsTrigger value="history" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('trades.tradeHistory')}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={rectIntersection}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext 
                    items={positions.map(p => p.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div 
                      ref={gridRef} 
                      className="dashboard-grid-free"
                      style={{ '--column-count': columnCount } as React.CSSProperties}
                    >
                      {Array.from({ length: columnCount }, (_, colIdx) => (
                        <div key={`col-${colIdx}`} className="dashboard-column-free">
                          {Object.entries(grid[colIdx] || {})
                            .sort(([rowA], [rowB]) => parseInt(rowA) - parseInt(rowB))
                            .map(([row, widgetId]) => (
                              <div key={widgetId}>
                                {renderWidget(widgetId)}
                              </div>
                            ))}
                          {isCustomizing && (
                            <DropZone id={`dropzone-${colIdx}-${Object.keys(grid[colIdx] || {}).length}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  {/* Layer 1: Quick Summary */}
                  <InsightsQuickSummary
                    totalPnL={dashboardStats.totalPnL}
                    winRate={dashboardStats.winRate}
                    profitFactor={dashboardStats.profitFactor}
                    avgROI={dashboardStats.avgRoi}
                    totalTrades={dashboardStats.totalTrades}
                  />

                  {/* Layer 2: Performance + Quality */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PerformanceHighlights
                      trades={processedTrades}
                      bestTrade={dashboardStats.bestTrade}
                      worstTrade={dashboardStats.worstTrade}
                      currentStreak={currentStreak}
                    />
                    
                    <TradingQualityMetrics
                      avgWin={dashboardStats.avgWin}
                      avgLoss={dashboardStats.avgLoss}
                      winCount={dashboardStats.winningTrades.length}
                      lossCount={dashboardStats.losingTrades.length}
                      maxDrawdownPercent={Math.abs((Math.min(...processedTrades.map(t => t.pnl || 0)) / initialInvestment) * 100)}
                      maxDrawdownAmount={Math.min(...processedTrades.map(t => t.pnl || 0))}
                      profitFactor={dashboardStats.profitFactor}
                    />
                  </div>

                  {/* Layer 3: Cost Efficiency + Behavior */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CostEfficiencyPanel trades={processedTrades} />
                    <BehaviorAnalytics trades={processedTrades} />
                  </div>

                  {/* Existing components */}
                  <DrawdownAnalysis trades={processedTrades} initialInvestment={initialInvestment} />
                  <TradingStreaks trades={processedTrades} />
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
          onRemoveWidget={removeWidget}
          activeWidgets={activeWidgets}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
