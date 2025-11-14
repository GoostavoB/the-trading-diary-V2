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
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { FloatingXP } from '@/components/gamification/FloatingXP';
import { MicroFeedbackOverlay } from '@/components/gamification/MicroFeedbackOverlay';
import { WeeklySummaryRecap } from '@/components/WeeklySummaryRecap';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useTradeXPRewards } from '@/hooks/useTradeXPRewards';
import { TradingStreaks } from '@/components/TradingStreaks';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDateRange } from '@/contexts/DateRangeContext';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LessonLearnedPopup } from '@/components/lessons/LessonLearnedPopup';
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
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUserTier } from '@/hooks/useUserTier';
import { UpgradePrompt } from '@/components/UpgradePrompt';

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
// GamificationSidebar temporarily disabled - XP/Level/Challenges hidden
// const GamificationSidebar = lazy(() => import('@/components/gamification/GamificationSidebar').then(m => ({ default: m.GamificationSidebar })));
import { TourCTAButton } from '@/components/tour/TourCTAButton';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { pageMeta } from '@/utils/seoHelpers';
import { TradeStationView } from '@/components/trade-station/TradeStationView';

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
  const isWinning = (sorted[0].profit_loss || 0) > 0;
  for (const trade of sorted) {
    const pnl = trade.profit_loss || 0;
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
  usePageMeta(pageMeta.dashboard);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [capitalLog, setCapitalLog] = useState<any[]>([]);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const { dateRange, setDateRange, clearDateRange, isToday } = useDateRange();
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  
  // Onboarding flow
  const { showOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  
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
  
  // Grid layout with free positioning - single source of truth
  const {
    positions,
    columnCount: savedColumnCount,
    isLoading: isLayoutLoading,
    updatePosition,
    saveLayout: saveGridLayout,
    updateColumnCount,
    addWidget,
    removeWidget,
    resetLayout,
  } = useGridLayout(user?.id, Object.keys(WIDGET_CATALOG));

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  // State for Trade Station controls
  const [tradeStationControls, setTradeStationControls] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedColumnCount, setSelectedColumnCount] = useState(3);
  const [originalPositions, setOriginalPositions] = useState<WidgetPosition[]>([]);
  // Gamification temporarily disabled
  // const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // User tier for feature restrictions
  const { tier, canCustomizeDashboard, isLoading: tierLoading } = useUserTier();

  // Sync column count from saved settings
  useEffect(() => {
    setSelectedColumnCount(savedColumnCount);
  }, [savedColumnCount]);

  // Track if layout has changed
  const hasLayoutChanges = useMemo(() => {
    if (!isCustomizing || originalPositions.length === 0) return false;
    
    // Compare current positions with original
    if (positions.length !== originalPositions.length) return true;
    
    return positions.some(pos => {
      const original = originalPositions.find(o => o.id === pos.id);
      return !original || original.column !== pos.column || original.row !== pos.row;
    });
  }, [isCustomizing, positions, originalPositions]);

  // Gamification system
  const { xpData, showLevelUp, setShowLevelUp } = useXPSystem();
  const { updateChallengeProgress } = useDailyChallenges();
  
  // Award XP for trades
  useTradeXPRewards(trades);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);

  // Track column count based on user selection and viewport - only restore once on mount
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    
    const updateCols = () => {
      const width = el.clientWidth;
      // On mobile, always use 1 column
      if (width < 768) {
        setColumnCount(1);
      } else {
        // Use user's selected column count (from saved settings)
        setColumnCount(selectedColumnCount);
      }
    };
    
    updateCols();
    const ro = new ResizeObserver(updateCols);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedColumnCount]);

  // Save column count to backend when user changes it
  const handleColumnCountChange = useCallback((newCount: number) => {
    setSelectedColumnCount(newCount);
    updateColumnCount(newCount);
  }, [updateColumnCount]);

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
      fetchCapitalLog(); // Fetch capital log first
      fetchInitialInvestment();
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
          fetchCapitalLog().then(() => fetchStats());
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(capitalChannel);
    };
  }, [user, includeFeesInPnL, initialInvestment]);

  // Fetch stats when capital log changes
  useEffect(() => {
    if (user && capitalLog.length >= 0) {
      fetchStats();
    }
  }, [capitalLog]);

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

  // Track XP from trades and update daily challenges
  useEffect(() => {
    if (!trades || trades.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(
      t => new Date(t.trade_date).toISOString().split('T')[0] === today
    );

    if (todayTrades.length > 0) {
      updateChallengeProgress('trade_count', todayTrades.length);

      const sortedTodayTrades = todayTrades.sort(
        (a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
      );
      let winStreak = 0;
      for (const trade of sortedTodayTrades) {
        if ((trade.profit_loss || 0) > 0) {
          winStreak++;
        } else {
          break;
        }
      }
      updateChallengeProgress('win_rate', winStreak);

      const todayProfit = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      updateChallengeProgress('profit_target', Math.floor(todayProfit));
    }
  }, [trades, updateChallengeProgress]);

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
      const totalPnlWithoutFees = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      
      // Calculate P&L with fees (subtract fees from profit)
      const totalPnlWithFees = trades.reduce((sum, t) => {
        const pnl = t.profit_loss || 0;
        const fundingFee = t.funding_fee || 0;
        const tradingFee = t.trading_fee || 0;
        return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
      }, 0);
      
      const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
      const avgDuration = trades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (trades.length || 1);

      // Calculate total calendar days from first to last trade
      let tradingDaySpan = 0;
      if (trades.length > 0) {
        const tradeDates = trades.map(t => new Date(t.trade_date).getTime());
        const firstTradeDate = Math.min(...tradeDates);
        const lastTradeDate = Math.max(...tradeDates);
        const daysDifference = Math.ceil((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24));
        tradingDaySpan = daysDifference + 1; // +1 to include both first and last day
      }
      
      // Calculate average P&L per trade
      const avgPnLPerTrade = trades.length > 0 
        ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / trades.length 
        : 0;
      
      // Calculate average P&L per day
      const avgPnLPerDay = tradingDaySpan > 0 
        ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / tradingDaySpan 
        : 0;
      
      // Calculate total added capital from capital_log (sum of all additions)
      const totalAddedCapital = capitalLog.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
      
      // Use total added capital as the "initial investment" for ROI calculation
      // If no capital log exists, fallback to initialInvestment from settings
      const baseCapital = totalAddedCapital > 0 ? totalAddedCapital : initialInvestment;
      
      // Calculate current balance
      const currentBalance = baseCapital + (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees);
      
      // Calculate current ROI based on total invested capital
      let currentROI = 0;
      if (baseCapital > 0) {
        currentROI = ((currentBalance - baseCapital) / baseCapital) * 100;
      }
      
      // Calculate average ROI per trade - based on avgPnLPerTrade and baseCapital
      // This properly calculates ROI as (avg P&L / capital) * 100
      const avgROIPerTrade = baseCapital > 0 && trades.length > 0
        ? (avgPnLPerTrade / baseCapital) * 100
        : 0;

      setStats({
        total_pnl: includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees,
        win_rate: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
        total_trades: trades.length,
        avg_duration: avgDuration,
        avg_pnl_per_trade: avgPnLPerTrade,
        avg_pnl_per_day: avgPnLPerDay,
        trading_days: tradingDaySpan,
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
      assetPnL[symbol] = (assetPnL[symbol] || 0) + (t.profit_loss || 0);
    });
    const best = Object.entries(assetPnL).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : 'N/A';
  }, []);

  // Memoize handlers
  const handleDateRangeChange = useCallback((range: typeof dateRange) => {
    setDateRange(range);
  }, [setDateRange]);

  const handleStartCustomize = useCallback(() => {
    // Check if user has permission to customize
    if (!canCustomizeDashboard) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setOriginalPositions([...positions]);
    setIsCustomizing(true);
  }, [positions, canCustomizeDashboard]);

  const handleSaveLayout = useCallback(async () => {
    setIsCustomizing(false);
    setOriginalPositions([]);
    
    // Actually save the layout to database
    await saveGridLayout(positions, selectedColumnCount);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [positions, selectedColumnCount, saveGridLayout]);

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

    // Save immediately - hook manages the state
    saveGridLayout(updatedPositions);
    setActiveId(null);
  }, [positions, saveGridLayout]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCancelCustomize = useCallback(() => {
    // Revert to original positions
    if (originalPositions.length > 0) {
      saveGridLayout(originalPositions);
    }
    setIsCustomizing(false);
    setOriginalPositions([]);
  }, [originalPositions, saveGridLayout]);

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
    // Start from the same base used by the widget to avoid mismatches
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Show last 6 months

    const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;

    // Use trades only for the growth line when base already includes capital additions
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date as any).getTime() - new Date(b.trade_date as any).getTime()
    );

    const chartData: { date: string; value: number }[] = [];
    let cumulative = baseCapital;

    // Add initial point if we have no data or if the first data point is after our start date
    if (sortedTrades.length === 0 || new Date(sortedTrades[0].trade_date as any) > startDate) {
      chartData.push({
        date: startDate.toLocaleDateString(),
        value: baseCapital,
      });
    }

    // Add P&L over time
    sortedTrades.forEach((item) => {
      const pnl = Number((item as any).pnl ?? (item as any).profit_loss ?? 0);
      cumulative += pnl;
      chartData.push({
        date: new Date((item as any).trade_date).toLocaleDateString(),
        value: cumulative,
      });
    });

    return chartData;
  }, [trades, initialInvestment, totalCapitalAdditions]);

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
        const totalInvestedCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.totalBalance = totalInvestedCapital + (stats?.total_pnl || 0);
        widgetProps.change24h = stats?.total_pnl || 0;
        widgetProps.changePercent24h = totalInvestedCapital > 0 
          ? ((stats?.total_pnl || 0) / totalInvestedCapital) * 100 
          : 0;
        break;
      case 'winRate':
        const winningTrades = processedTrades.filter(t => (t.profit_loss || 0) > 0).length;
        const losingTrades = processedTrades.filter(t => (t.profit_loss || 0) <= 0).length;
        widgetProps.winRate = stats?.win_rate || 0;
        widgetProps.wins = winningTrades;
        widgetProps.losses = losingTrades;
        widgetProps.totalTrades = stats?.total_trades || 0;
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
        const totalInvestedForPortfolio = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.totalValue = totalInvestedForPortfolio + (stats?.total_pnl || 0);
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
          ? Math.min(...processedTrades.map(t => t.profit_loss || 0))
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
        // Show total invested capital from capital_log as "initial investment"
        widgetProps.initialInvestment = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.currentBalance = totalCapitalAdditions > 0 
          ? totalCapitalAdditions + (stats?.total_pnl || 0)
          : initialInvestment + (stats?.total_pnl || 0);
        widgetProps.onInitialInvestmentUpdate = async (newValue: number) => {
          setInitialInvestment(newValue);
          // Refetch capital log and stats to reflect the change
          await fetchCapitalLog();
          await fetchInitialInvestment();
          await fetchStats();
        };
        break;
      case 'avgROIPerTrade':
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'capitalGrowth':
        widgetProps.chartData = portfolioChartData;
        const baseCapitalForGrowth = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.initialInvestment = baseCapitalForGrowth;
        // Don't pass totalCapitalAdditions separately when it's already in initialInvestment
        widgetProps.totalCapitalAdditions = 0;
        widgetProps.currentBalance = baseCapitalForGrowth + (stats?.total_pnl || 0);
        break;
      case 'heatmap':
        widgetProps.trades = processedTrades;
        break;
      case 'rollingTarget':
        widgetProps.trades = processedTrades;
        widgetProps.initialInvestment = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        break;
      case 'combinedPnLROI':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        break;
      // Trade Station widgets - pass required props
      case 'errorReflection':
      case 'riskCalculator':
      case 'dailyLossLock':
      case 'simpleLeverage':
        // These widgets manage their own data
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
    <>
    <AppLayout>
      {/* Onboarding Flow - shows for new users */}
      {showOnboarding && !onboardingLoading && (
        <OnboardingFlow onComplete={completeOnboarding} />
      )}
      
      <FloatingXP />
      <MicroFeedbackOverlay />
      <WeeklySummaryRecap />
      <LessonLearnedPopup />
      <LevelUpModal
        show={showLevelUp} 
        level={xpData.currentLevel} 
        onClose={() => setShowLevelUp(false)} 
      />
      
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
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
            {/* Gamification Button temporarily hidden */}
            {/* <Button
              size="icon"
              onClick={() => setIsGamificationOpen(!isGamificationOpen)}
              variant="outline"
              className="glass hover:glass-strong"
            >
              <Zap className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        {/* Customize Dashboard Controls - Show for Overview and Trade Station tabs */}
        {!loading && stats && stats.total_trades > 0 && (activeTab === 'overview' || activeTab === 'tradestation') && (
          <div data-tour="dashboard-customization">
            {activeTab === 'overview' ? (
              <CustomizeDashboardControls
                isCustomizing={isCustomizing}
                hasChanges={hasLayoutChanges}
                onStartCustomize={handleStartCustomize}
                onSave={handleSaveLayout}
                onCancel={handleCancelCustomize}
                onReset={resetLayout}
                onAddWidget={() => {
                  if (!canCustomizeDashboard) {
                    setShowUpgradePrompt(true);
                    return;
                  }
                  setShowWidgetLibrary(true);
                }}
                columnCount={selectedColumnCount}
                onColumnCountChange={handleColumnCountChange}
                widgetCount={positions.length}
              />
            ) : tradeStationControls ? (
              <CustomizeDashboardControls
                isCustomizing={tradeStationControls.isCustomizing}
                hasChanges={tradeStationControls.hasChanges}
                onStartCustomize={tradeStationControls.handleStartCustomize}
                onSave={tradeStationControls.handleSave}
                onCancel={tradeStationControls.handleCancel}
                onReset={tradeStationControls.handleReset}
                onAddWidget={() => {
                  if (!canCustomizeDashboard) {
                    setShowUpgradePrompt(true);
                    return;
                  }
                  setShowWidgetLibrary(true);
                }}
                columnCount={tradeStationControls.columnCount}
                onColumnCountChange={tradeStationControls.handleColumnCountChange}
                widgetCount={tradeStationControls.widgetCount}
                canUndo={tradeStationControls.canUndo}
                onUndoReset={tradeStationControls.handleUndoReset}
              />
            ) : null}
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : stats && stats.total_trades === 0 ? (
          <Card className="p-8 text-center glass">
            <h3 className="text-xl font-semibold mb-2">{t('trades.trades')}</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first trades to activate the dashboard and see your performance metrics
            </p>
            <a href="/upload" className="text-primary hover:underline">
              {t('trades.addTrade')} →
            </a>
          </Card>
        ) : (
          <>
            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <TabsList className="glass rounded-2xl grid w-full grid-cols-4 h-auto p-1.5">
                <TabsTrigger value="tradestation" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Trade Station</TabsTrigger>
                <TabsTrigger value="overview" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Command Center</TabsTrigger>
                <TabsTrigger value="insights" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('analytics.insights')}</TabsTrigger>
                <TabsTrigger value="history" className="text-sm py-2.5 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('trades.tradeHistory')}</TabsTrigger>
              </TabsList>

              <TabsContent value="tradestation" className="space-y-6">
                <TradeStationView onControlsReady={setTradeStationControls} />
              </TabsContent>

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
                      maxDrawdownPercent={Math.abs((Math.min(...processedTrades.map(t => t.profit_loss || 0)) / initialInvestment) * 100)}
                      maxDrawdownAmount={Math.min(...processedTrades.map(t => t.profit_loss || 0))}
                      profitFactor={dashboardStats.profitFactor}
                    />
                  </div>

                  {/* Layer 3: Cost Efficiency + Behavior */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CostEfficiencyPanel trades={processedTrades} />
                    <BehaviorAnalytics trades={processedTrades} />
                  </div>

                  {/* Layer 4: Heatmap + Drawdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingHeatmap trades={processedTrades} />
                    <DrawdownAnalysis trades={processedTrades} initialInvestment={initialInvestment} />
                  </div>

                  {/* Trading Streaks */}
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

        {/* Widget Library Modal - Context-aware for Overview vs Trade Station */}
        <WidgetLibrary
          open={showWidgetLibrary}
          onClose={() => setShowWidgetLibrary(false)}
          onAddWidget={(widgetId) => {
            if (activeTab === 'tradestation' && tradeStationControls) {
              tradeStationControls.handleAddWidgetDirect(widgetId);
            } else {
              addWidget(widgetId);
            }
          }}
          onRemoveWidget={(widgetId) => {
            if (activeTab === 'tradestation' && tradeStationControls) {
              tradeStationControls.handleRemoveWidgetDirect(widgetId);
            } else {
              removeWidget(widgetId);
            }
          }}
          activeWidgets={activeTab === 'tradestation' && tradeStationControls ? tradeStationControls.activeWidgets : activeWidgets}
        />
        
        {/* Tour CTA Button */}
        <TourCTAButton />
        
        {/* Upgrade Prompt for Free Users */}
        <UpgradePrompt
          open={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          feature="dashboard customization"
        />
      </div>
    </AppLayout>
    
    {/* Glassmorphic Overlay Sidebar - Gamification temporarily disabled */}
    {/* <AnimatePresence>
      {isGamificationOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsGamificationOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          />
          
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="fixed right-0 top-0 bottom-0 w-96 z-50 bg-background/40 backdrop-blur-3xl border-l border-white/20 shadow-2xl"
          >
            <div className="h-full p-6 overflow-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Your Progress</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGamificationOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <GamificationSidebar />
              </Suspense>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence> */}
    </>
  );
};

export default Dashboard;
