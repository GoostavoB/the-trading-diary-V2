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
import { PinnedWidgetsArea } from '@/components/PinnedWidgetsArea';
import { usePinnedWidgets, CATALOG_TO_PINNED_MAP } from '@/contexts/PinnedWidgetsContext';
import { AITrainingQuestionnaire } from '@/components/ai-training/AITrainingQuestionnaire';
import { useAITrainingProfile } from '@/hooks/useAITrainingProfile';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { FloatingXP } from '@/components/gamification/FloatingXP';
import { MicroFeedbackOverlay } from '@/components/gamification/MicroFeedbackOverlay';
import { WeeklySummaryRecap } from '@/components/WeeklySummaryRecap';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useTradeXPRewards } from '@/hooks/useTradeXPRewards';
import { useProfitMilestoneBadges } from '@/hooks/useProfitMilestoneBadges';
import { TradingStreaks } from '@/components/TradingStreaks';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDateRange } from '@/contexts/DateRangeContext';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
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
import { useUserTier } from '@/hooks/useUserTier';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { DailyMissionBar } from '@/components/dashboard/DailyMissionBar';
import { XPTestButton } from '@/components/dev/XPTestButton';
import { Tier3PreviewModal } from '@/components/tier/Tier3PreviewModal';
import { useSearchParams } from 'react-router-dom';
import { ProgressTrigger } from '@/components/progress/ProgressTrigger';

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
import { DailyStreakFlame } from '@/components/DailyStreakFlame';
import { QuickShareButtons } from '@/components/social/QuickShareButtons';
import { GamificationHub } from '@/components/gamification/GamificationHub';
import { XPBoostIndicator } from '@/components/gamification/XPBoostIndicator';
import { ComebackModal } from '@/components/gamification/ComebackModal';
import { useComebackRewards } from '@/hooks/useComebackRewards';

interface TradeStats {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  avg_duration: number;
  avg_pnl_per_trade: number;
  avg_pnl_per_day: number;
  trading_days: number;
  current_roi: number;
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
  usePageMeta(pageMeta.dashboard);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { pinnedWidgets } = usePinnedWidgets();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const { hasProfile, loading: profileLoading, refetch: refetchProfile } = useAITrainingProfile();
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [capitalLog, setCapitalLog] = useState<any[]>([]);
  const [withdrawalLog, setWithdrawalLog] = useState<any[]>([]);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const { dateRange, setDateRange, clearDateRange, isToday } = useDateRange();
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview');
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
    // Update URL with new tab
    setSearchParams({ tab: val });
    requestAnimationFrame(() => {
      if (container) container.scrollTop = prevScrollTop;
      else window.scrollTo({ top: prevScrollTop });
    });
  }, [setSearchParams]);
  
  // Fix positions state management
  const [positions, setPositions] = useState<WidgetPosition[]>([]);

  // Grid layout with free positioning
  const {
    positions: loadedPositions,
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedColumnCount, setSelectedColumnCount] = useState(3);
  const [originalPositions, setOriginalPositions] = useState<WidgetPosition[]>([]);
  // Gamification temporarily disabled
  // const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // User tier for feature restrictions
  const { tier, canCustomizeDashboard, isLoading: tierLoading } = useUserTier();

  // Sync loaded positions and column count with local state
  useEffect(() => {
    if (!isCustomizing && loadedPositions.length > 0) {
      setPositions(loadedPositions);
    }
  }, [loadedPositions, isCustomizing]);

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
  const { xpData, showLevelUp, setShowLevelUp, showTier3Preview, setShowTier3Preview } = useXPSystem();
  const { updateChallengeProgress } = useDailyChallenges();
  const { showComebackModal, setShowComebackModal, comebackReward } = useComebackRewards();
  
  // Award XP for trades
  useTradeXPRewards(trades);
  
  // Check profit milestone badges
  const totalTradingProfit = useMemo(() => 
    trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
    [trades]
  );
  useProfitMilestoneBadges(totalTradingProfit, user?.id);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);

  // Track column count from saved settings only; mobile handled by CSS media query
  useEffect(() => {
    const clamped = Math.min(4, Math.max(1, savedColumnCount || 4));
    setColumnCount(clamped);
    console.log('[Dashboard] Column count set from saved settings:', {
      saved: savedColumnCount,
      clamped,
    });
  }, [savedColumnCount]);


  // Safety: ensure the dashboard never gets stuck in loading (3s guard)
  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(id);
  }, []);

  // Save column count to backend when user changes it
  const handleColumnCountChange = useCallback((newCount: number) => {
    setSelectedColumnCount(newCount);
    updateColumnCount(newCount);
  }, [updateColumnCount]);

  // Local handlers for immediate UI feedback during customization
  const handleRemoveWidget = useCallback((widgetId: string) => {
    if (isCustomizing) {
      // During customization: update local state immediately, don't persist yet
      const newPositions = positions.filter(p => p.id !== widgetId);
      setPositions(newPositions);
      toast.success('Widget removed');
    } else {
      // Outside customization: persist immediately
      removeWidget(widgetId);
    }
  }, [isCustomizing, positions, removeWidget]);

  const handleAddWidget = useCallback((widgetId: string) => {
    if (isCustomizing) {
      // During customization: update local state immediately, don't persist yet
      if (positions.find(p => p.id === widgetId)) {
        toast.info('Widget already added');
        return;
      }
      const maxRow = Math.max(0, ...positions.map(p => p.row));
      const newPositions = [...positions, { id: widgetId, column: 0, row: maxRow + 1 }];
      setPositions(newPositions);
      toast.success('Widget added');
    } else {
      // Outside customization: persist immediately
      addWidget(widgetId);
    }
  }, [isCustomizing, positions, addWidget]);

  // Organize widgets by column and row, filtering out pinned widgets
  const grid = useMemo(() => {
    const result: { [col: number]: { [row: number]: string } } = {};
    
    console.log('Building grid from positions:', positions);
    
    // Filter out pinned widgets
    const filteredPositions = positions.filter(pos => {
      const pinnedId = CATALOG_TO_PINNED_MAP[pos.id];
      return !(pinnedId && pinnedWidgets.includes(pinnedId));
    });
    
    filteredPositions.forEach(pos => {
      if (!result[pos.column]) result[pos.column] = {};
      result[pos.column][pos.row] = pos.id;
    });
    
    console.log('Grid structure (after filtering pinned):', result);
    return result;
  }, [positions, pinnedWidgets]);

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
      console.warn('Error fetching capital log:', error);
      setCapitalLog([]); // ensure state updates to trigger stats fetch
    } else {
      setCapitalLog(data || []);
    }
  };

  const fetchWithdrawalLog = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('withdrawal_log')
      .select('*')
      .eq('user_id', user.id)
      .order('withdrawal_date', { ascending: true });

    if (error) {
      console.warn('Error fetching withdrawal log:', error);
      setWithdrawalLog([]);
    } else {
      setWithdrawalLog(data || []);
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
      fetchWithdrawalLog(); // Fetch withdrawal log
      fetchInitialInvestment();
      fetchCustomWidgets();
      // Kick off stats immediately so UI doesn't block on the above
      fetchStats();
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
    
    const withdrawalChannel = supabase
      .channel('withdrawal-changes-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'withdrawal_log', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchWithdrawalLog().then(() => fetchStats());
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(capitalChannel);
      supabase.removeChannel(withdrawalChannel);
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
        if ((trade.pnl || 0) > 0) {
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
    if (!user) {
      setLoading(false);
      return;
    }

    setHasAttemptedFetch(true);

    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('closed_at', 'is', null); // Only count closed trades for accurate P&L

      if (error) {
        console.warn('Error fetching trades for stats:', error);
        setTrades([]);
        setStats({
          total_pnl: 0,
          win_rate: 0,
          total_trades: 0,
          avg_duration: 0,
          avg_pnl_per_trade: 0,
          avg_pnl_per_day: 0,
          trading_days: 0,
          current_roi: 0,
        });
        return;
      }

      if (trades) {
        // Deduplicate trades based on closed_at + profit_loss combination
        const uniqueTradesMap = trades.reduce((acc, trade) => {
          const key = `${trade.closed_at}_${trade.profit_loss}`;
          if (!acc.has(key)) {
            acc.set(key, trade);
          }
          return acc;
        }, new Map());
        const deduplicatedTrades = Array.from(uniqueTradesMap.values());
        
        setTrades(deduplicatedTrades.map(trade => ({
          ...trade,
          side: trade.side as 'long' | 'short' | null
        })));
        
        // Calculate total P&L using profit_loss from deduplicated trades
        const totalPnL = deduplicatedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        
        const winningTrades = deduplicatedTrades.filter(t => (t.profit_loss || 0) > 0).length;
        const avgDuration = deduplicatedTrades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (deduplicatedTrades.length || 1);

        // Calculate unique trading days
        const uniqueDays = new Set(deduplicatedTrades.map(t => new Date(t.trade_date).toDateString())).size;
        
        // Calculate average P&L per trade
        const avgPnLPerTrade = deduplicatedTrades.length > 0
          ? totalPnL / deduplicatedTrades.length
          : 0;
        
        // Calculate average P&L per day
        const avgPnLPerDay = uniqueDays > 0 
          ? totalPnL / uniqueDays 
          : 0;
        
        // Calculate total added capital from capital_log (sum of all additions)
        const totalAddedCapital = capitalLog.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
        
        // Use total added capital as the "initial investment" for ROI calculation
        // If no capital log exists, fallback to initialInvestment from settings
        const baseCapital = totalAddedCapital > 0 ? totalAddedCapital : initialInvestment;
        
        // Calculate total withdrawals
        const totalWithdrawals = withdrawalLog.reduce((sum, entry) => sum + (entry.amount_withdrawn || 0), 0);
        
        // Calculate current balance (subtract withdrawals)
        const currentBalance = baseCapital + totalPnL - totalWithdrawals;
        
        // Calculate current ROI: Total profit regardless of withdrawals
        let currentROI = 0;
        if (baseCapital > 0) {
          currentROI = (totalPnL / baseCapital) * 100;
        }

        setStats({
          total_pnl: totalPnL,
          win_rate: deduplicatedTrades.length > 0 ? (winningTrades / deduplicatedTrades.length) * 100 : 0,
          total_trades: deduplicatedTrades.length,
          avg_duration: avgDuration,
          avg_pnl_per_trade: avgPnLPerTrade,
          avg_pnl_per_day: avgPnLPerDay,
          trading_days: uniqueDays,
          current_roi: currentROI,
        });
      }
    } catch (err) {
      console.error('Unexpected error in fetchStats:', err);
    } finally {
      setLoading(false);
    }
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

  const handleSaveLayout = useCallback(() => {
    saveGridLayout(positions);
    setIsCustomizing(false);
    setOriginalPositions([]);
    toast.success('Layout saved');
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

    // Rule 1: Direct Swap - swap positions with another widget
    const overPos = positions.find(p => p.id === overId);
    if (overPos && overId !== activeId) {
      updatedPositions = positions.map(p => {
        if (p.id === activeId) {
          return { id: p.id, column: overPos.column, row: overPos.row };
        }
        if (p.id === overId) {
          return { id: p.id, column: activePos.column, row: activePos.row };
        }
        return p;
      });

      // Validate: Ensure no position duplicates after swap
      const positionKeys = updatedPositions.map(p => `${p.column}-${p.row}`);
      const uniquePositions = new Set(positionKeys);
      
      if (uniquePositions.size !== positionKeys.length) {
        console.error('Position conflict detected after swap');
        toast.error('Cannot swap: position conflict detected');
        setActiveId(null);
        return;
      }
    }
    // Rule 3: Move to Dropzone - move to empty space
    else if (overId.startsWith('dropzone-')) {
      const [, colStr, rowStr] = overId.split('-');
      const targetCol = parseInt(colStr, 10);
      const targetRow = parseInt(rowStr, 10);
      
      // Check if position is truly empty
      const occupied = positions.find(p => p.column === targetCol && p.row === targetRow && p.id !== activeId);
      if (occupied) {
        toast.error('Position already occupied');
        setActiveId(null);
        return;
      }
      
      updatedPositions = positions.map(p =>
        p.id === activeId ? { id: p.id, column: targetCol, row: targetRow } : p
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

    // Don't auto-save during customize mode - let user explicitly save
    if (!isCustomizing) {
      saveGridLayout(updatedPositions);
    } else {
      // Just update local state during customization
      setPositions(updatedPositions);
    }
    setActiveId(null);
  }, [positions, saveGridLayout, isCustomizing]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCancelCustomize = useCallback(() => {
    // Revert to original positions
    if (originalPositions.length > 0) {
      setPositions(originalPositions);
    }
    setIsCustomizing(false);
    setOriginalPositions([]);
  }, [originalPositions]);

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

  // Calculate total withdrawals from withdrawal log
  const totalWithdrawals = useMemo(() => {
    return withdrawalLog.reduce((sum, log) => sum + (log.amount_withdrawn || 0), 0);
  }, [withdrawalLog]);

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
          onRemove={() => handleRemoveWidget(widgetId)}
        >
          <CustomWidgetRenderer 
            widget={customWidget}
            onDelete={async () => {
              await supabase.from('custom_dashboard_widgets').delete().eq('id', widgetId);
              handleRemoveWidget(widgetId);
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
      onRemove: () => handleRemoveWidget(widgetId),
    };

    // Add widget-specific data
    switch (widgetId) {
      case 'totalBalance':
        const totalInvestedCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.totalBalance = totalInvestedCapital + (stats?.total_pnl || 0) - totalWithdrawals;
        widgetProps.change24h = stats?.total_pnl || 0;
        widgetProps.changePercent24h = totalInvestedCapital > 0 
          ? ((stats?.total_pnl || 0) / totalInvestedCapital) * 100 
          : 0;
        break;
      case 'winRate':
        const winningTrades = processedTrades.filter(t => t.profit_loss > 0).length;
        const losingTrades = processedTrades.filter(t => t.profit_loss <= 0).length;
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
        const totalInvestedForPortfolio = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.totalValue = totalInvestedForPortfolio + (stats?.total_pnl || 0) - totalWithdrawals;
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
          ? totalCapitalAdditions + (stats?.total_pnl || 0) - totalWithdrawals
          : initialInvestment + (stats?.total_pnl || 0) - totalWithdrawals;
        widgetProps.onInitialInvestmentUpdate = async (newValue: number) => {
          setInitialInvestment(newValue);
          // fetchStats will be automatically called via useEffect when initialInvestment changes
        };
        break;
      case 'capitalGrowth':
        // Capital Growth widget now self-fetches data via useCapitalGrowthData hook
        break;
      case 'absoluteProfit':
        const tradingPnL = processedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        const cumulativeData: Array<{ date: string; value: number }> = [];
        let cumulative = 0;
        
        [...processedTrades]
          .sort((a, b) => new Date(a.closed_at || a.trade_date).getTime() - new Date(b.closed_at || b.trade_date).getTime())
          .forEach(t => {
            cumulative += t.profit_loss || 0;
            const date = new Date(t.closed_at || t.trade_date);
            cumulativeData.push({
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: cumulative,
            });
          });
        
        widgetProps.totalPnL = tradingPnL;
        widgetProps.tradeCount = processedTrades.length;
        widgetProps.chartData = cumulativeData;
        break;
      case 'heatmap':
        widgetProps.trades = processedTrades;
        break;
    }

    return (
      <SortableWidget
        key={widgetId}
        id={widgetId}
        isEditMode={isCustomizing}
        onRemove={() => handleRemoveWidget(widgetId)}
      >
        <WidgetComponent {...widgetProps} />
      </SortableWidget>
    );
  }, [isCustomizing, handleRemoveWidget, stats, processedTrades, initialInvestment, spotWalletTotal, holdings, portfolioChartData, customWidgets, fetchCustomWidgets]);

  // Show AI Training Questionnaire if user doesn't have a profile yet
  if (hasProfile === false && !profileLoading) {
    return <AITrainingQuestionnaire onComplete={refetchProfile} />;
  }

  return (
    <>
    <AppLayout>
      <FloatingXP />
      <MicroFeedbackOverlay />
      <WeeklySummaryRecap />
      <LessonLearnedPopup />
      <LevelUpModal
        show={showLevelUp} 
        level={xpData.currentLevel} 
        onClose={() => setShowLevelUp(false)} 
      />
      <Tier3PreviewModal
        open={showTier3Preview}
        onClose={() => setShowTier3Preview(false)}
        totalXP={xpData.totalXPEarned}
        currentTier={0}
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
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm text-muted-foreground/80">{t('dashboard.overview')}</p>
            </div>
            <DailyStreakFlame />
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

        {/* Customize Dashboard Controls - Always show on Overview tab */}
        {!loading && activeTab === 'overview' && (
          <div data-tour="dashboard-customization">
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
          </div>
        )}

        {(loading && !hasAttemptedFetch) ? (
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
            {/* Progress Trigger */}
            <ProgressTrigger />

            {/* Daily Mission Bar */}
            <div className="mb-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <DailyMissionBar />
            </div>

            {/* Pinned Widgets Area */}
            <PinnedWidgetsArea 
              winRate={dashboardStats.winRate}
              winCount={dashboardStats.winningTrades.length}
              lossCount={dashboardStats.losingTrades.length}
              totalProfit={dashboardStats.totalPnL}
              currentROI={dashboardStats.avgRoi}
              totalTrades={dashboardStats.totalTrades}
              totalBalance={(totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment) + (stats?.total_pnl || 0) - totalWithdrawals}
              change24h={stats?.total_pnl || 0}
              changePercent24h={(totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment) > 0 
                ? ((stats?.total_pnl || 0) / (totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment)) * 100 
                : 0}
              spotTotalValue={spotWalletTotal}
              spotChange24h={0}
              spotChangePercent24h={0}
              tokenCount={holdings?.length || 0}
              trades={trades}
              avgPnLPerTrade={stats?.avg_pnl_per_trade || 0}
              avgPnLPerDay={stats?.avg_pnl_per_day || 0}
              tradingDays={stats?.trading_days || 0}
            />

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

            {/* Social Share Section - Moved to bottom */}
            <Card className="p-6 mb-6 animate-fade-in glass">
              <h3 className="text-lg font-semibold mb-4">Share Your Trading Journey</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your progress on social media and earn XP rewards!
              </p>
              <QuickShareButtons 
                text="Check out my trading progress! 📈 #TradingJournal #CryptoTrading"
                contentType="general"
              />
            </Card>

            {/* Gamification Hub - Moved to bottom */}
            <div className="mb-6 animate-fade-in">
              <GamificationHub />
            </div>
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
              onAddWidget={handleAddWidget}
              onRemoveWidget={handleRemoveWidget}
              activeWidgets={activeWidgets}
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
    
    {/* Dev-only XP Test Button */}
    <XPTestButton />
    
    {/* XP Boost Indicator */}
    <XPBoostIndicator />
    
    {/* Comeback Modal */}
    {comebackReward && (
      <ComebackModal
        open={showComebackModal}
        onClose={() => setShowComebackModal(false)}
        xpReward={comebackReward.xp}
        daysAway={comebackReward.daysAway}
      />
    )}
    
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
