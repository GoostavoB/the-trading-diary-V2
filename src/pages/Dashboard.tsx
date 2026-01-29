import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Plus, Columns } from 'lucide-react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { OverviewContent } from '@/components/dashboard/tabs/OverviewContent';
import { BehaviorContent } from '@/components/dashboard/tabs/BehaviorContent';
import { InsightsContent } from '@/components/dashboard/tabs/InsightsContent';
import { HistoryContent } from '@/components/dashboard/tabs/HistoryContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import {
  validateLayout,
  toGridWidgets,
  isValidSwap,
  findNearestValidPosition
} from '@/utils/gridValidator';

import { TradingStreaks } from '@/components/TradingStreaks';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDateRange } from '@/contexts/DateRangeContext';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { useGridLayout, type WidgetPosition } from '@/hooks/useGridLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LessonLearnedPopup } from '@/components/lessons/LessonLearnedPopup';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatCurrency } from '@/utils/formatNumber';
import { calculateTradingDays } from '@/utils/tradingDays';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { WidgetConfig, WidgetSize } from '@/types/widget';
import type { Trade } from '@/types/trade';
import type { CapitalLogEntry, CustomWidget, TradeStationControls } from '@/types/dashboard';
import { WIDGET_CATALOG } from '@/config/widgetCatalog';
import { WidgetLibrary } from '@/components/widgets/WidgetLibrary';
import { CustomWidgetRenderer } from '@/components/widgets/CustomWidgetRenderer';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUserTier } from '@/hooks/useUserTier';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SimplifiedDashboardGrid } from '@/components/dashboard/SimplifiedDashboardGrid';
import { X } from 'lucide-react';
import { DashboardProvider, useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { TradeStationView } from '@/components/trade-station/TradeStationView';
import { AIAssistant } from '@/components/AIAssistant';
import { TourCTAButton } from '@/components/tour/TourCTAButton';

// Helper function
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

function DashboardContent() {
  useKeyboardShortcuts();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { activeSubAccount } = useSubAccount();
  const activeSubAccountId = activeSubAccount?.id || null;
  const { settings: userSettings } = useUserSettings();
  const tradingDaysMode = userSettings.trading_days_calculation_mode;
  const { dateRange, setDateRange, clearDateRange } = useDateRange();

  // Use Dashboard Context
  const {
    stats,
    processedTrades,
    capitalLog,
    loading,
    initialInvestment,
    includeFeesInPnL,
    customWidgets,
    refreshData: fetchStats,
    setFilteredTrades // Not really needed as context handles filtering, but kept for compatibility if needed
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Onboarding flow
  const { showOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

  // Memoize dashboard stats calculations with capital log (for camelCase stats used in widgets)
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

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [tradeStationControls, setTradeStationControls] = useState<TradeStationControls | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const { tier, canCustomizeDashboard, isLoading: tierLoading } = useUserTier();
  const availableWidgets = useMemo(() => Object.keys(WIDGET_CATALOG), []);

  const {
    positions,
    order,
    // columnCount removed - grid is always 3 columns (responsive)
    isLoading: layoutLoading,
    isSaving: layoutSaving,
    saveLayout: saveGridLayout,
    updatePosition,
    resizeWidget,
    addWidget,
    removeWidget,
    resetLayout,
    undoReset,
    canUndo
  } = useGridLayout(activeSubAccountId, availableWidgets);

  const [originalPositions, setOriginalPositions] = useState(positions);
  const [activeId, setActiveId] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const activeWidgets = useMemo(() => {
    const widgets = positions.map(p => p.id);
    return widgets;
  }, [positions]);

  const { holdings, isLoading: isSpotWalletLoading } = useSpotWallet();
  const { prices } = useTokenPrices(holdings.map(h => h.token_symbol));

  // Calculate total capital additions from capital log
  const totalCapitalAdditions = useMemo(() => {
    return capitalLog.reduce((sum, log) => sum + (log.amount_added || 0), 0);
  }, [capitalLog]);

  const spotWalletTotal = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const price = Number(prices[holding.token_symbol] || 0);
      return sum + (Number(holding.quantity) * price);
    }, 0);
  }, [holdings, prices]);

  const portfolioChartData = useMemo(() => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;

    const sortedTrades = [...processedTrades].sort((a, b) =>
      new Date(a.trade_date as any).getTime() - new Date(b.trade_date as any).getTime()
    );

    const chartData: { date: string; value: number }[] = [];
    let cumulative = baseCapital;

    if (sortedTrades.length === 0 || new Date(sortedTrades[0].trade_date as any) > startDate) {
      chartData.push({
        date: startDate.toLocaleDateString(),
        value: baseCapital,
      });
    }

    sortedTrades.forEach((item) => {
      const pnl = Number((item as any).pnl ?? (item as any).profit_loss ?? 0);
      cumulative += pnl;
      chartData.push({
        date: new Date((item as any).trade_date).toLocaleDateString(),
        value: cumulative,
      });
    });

    return chartData;
  }, [processedTrades, initialInvestment, totalCapitalAdditions]);

  const handleDateRangeChange = useCallback((range: typeof dateRange) => {
    setDateRange(range);
  }, [setDateRange]);

  const handleStartCustomize = useCallback(() => {
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
    await saveGridLayout(positions, order);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [positions, order, saveGridLayout]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Legacy drag handler - mostly handled by OverviewContent/SimplifiedDashboardGrid now
    // but kept if we need to handle drops outside the grid or specific logic
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }
    // ... (rest of drag logic if needed, but OverviewContent handles it)
    setActiveId(null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCancelCustomize = useCallback(() => {
    if (originalPositions.length > 0) {
      saveGridLayout(originalPositions, order);
    }
    setIsCustomizing(false);
    setOriginalPositions([]);
  }, [originalPositions, order, saveGridLayout]);

  const handleForceResetLayout = useCallback(async () => {
    if (!activeSubAccountId) {
      toast.error('No active sub-account');
      return;
    }
    if (!window.confirm('This will completely clear your saved dashboard layout and reload the page. This action cannot be undone. Continue?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          layout_json: null,
          updated_at: new Date().toISOString()
        })
        .eq('sub_account_id', activeSubAccountId);

      if (error) throw error;
      toast.success('Dashboard layout cleared. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('[Dashboard] ❌ Force reset failed:', error);
      toast.error('Failed to reset layout');
    }
  }, [activeSubAccountId]);

  const renderWidget = useCallback((widgetId: string) => {
    const widgetPosition = positions.find(p => p.id === widgetId);

    if (widgetId.startsWith('custom-')) {
      const customWidgetId = widgetId.replace('custom-', '');
      const customWidget = customWidgets.find(w => w.id === customWidgetId);
      if (!customWidget) return null;

      return (
        <SmartWidgetWrapper
          key={widgetId}
          id={widgetId}
          isEditMode={isCustomizing}
          onRemove={() => removeWidget(widgetId)}
          className={`col-span-${widgetPosition?.size || 2} row-span-${widgetPosition?.height || 2}`}
          isLoading={loading}
        >
          <CustomWidgetRenderer
            widget={customWidget}
            onDelete={() => {
              removeWidget(widgetId);
              // fetchCustomWidgets is handled by context refresh
              fetchStats();
            }}
          />
        </SmartWidgetWrapper>
      );
    }

    const widgetConfig = WIDGET_CATALOG[widgetId];
    if (!widgetConfig) return null;
    const WidgetComponent = widgetConfig.component;

    const widgetProps: any = {
      id: widgetId,
      isEditMode: isCustomizing,
      isCompact: false,
      onRemove: () => removeWidget(widgetId),
      onResize: (newSize?: WidgetSize, newHeight?: 2 | 4 | 6) => {
        if (resizeWidget) {
          resizeWidget(widgetId, newSize, newHeight);
        }
      },
      currentSize: widgetPosition?.size,
      currentHeight: widgetPosition?.height,
    };

    switch (widgetId) {
      case 'totalBalance':
        const totalInvestedCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.totalBalance = totalInvestedCapital + (stats?.total_pnl || 0);
        widgetProps.change24h = stats?.total_pnl || 0;
        widgetProps.changePercent24h = totalInvestedCapital > 0
          ? ((stats?.total_pnl || 0) / totalInvestedCapital) * 100
          : 0;
        widgetProps.tradingDays = stats?.trading_days || 0;
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
      case 'behaviorAnalytics':
      case 'costEfficiency':
      case 'heatmap':
      case 'rollingTarget':
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
      case 'avgPnLPerTrade':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        break;
      case 'avgPnLPerDay':
        const { tradingDays: filteredTradingDays } = calculateTradingDays(
          processedTrades,
          tradingDaysMode
        );
        const filteredTotalPnL = processedTrades.reduce((sum, t) => {
          const pnl = t.profit_loss || 0;
          if (includeFeesInPnL) {
            const fundingFee = t.funding_fee || 0;
            const tradingFee = t.trading_fee || 0;
            return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
          }
          return sum + pnl;
        }, 0);
        widgetProps.avgPnLPerDay = filteredTradingDays > 0
          ? filteredTotalPnL / filteredTradingDays
          : 0;
        widgetProps.tradingDays = filteredTradingDays;
        break;
      case 'currentROI':
        widgetProps.currentROI = stats?.current_roi || 0;
        widgetProps.initialInvestment = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.currentBalance = totalCapitalAdditions > 0
          ? totalCapitalAdditions + (stats?.total_pnl || 0)
          : initialInvestment + (stats?.total_pnl || 0);
        widgetProps.onInitialInvestmentUpdate = async (newValue: number) => {
          // We can't update initial investment directly from here easily without context support
          // But we can call supabase directly or add a method to context.
          // For now, let's keep it simple or assume context refresh will pick it up
          // if we update via supabase.
          // Ideally DashboardProvider should expose setInitialInvestment or updateSettings
        };
        break;
      case 'avgROIPerTrade':
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'simpleAvgROI':
        widgetProps.simpleAvgROI = stats?.simple_avg_roi || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'weightedAvgROI':
        widgetProps.weightedAvgROI = stats?.weighted_avg_roi || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        widgetProps.totalCapitalInvested = stats?.total_capital_invested || 0;
        break;
      case 'capitalGrowth':
        widgetProps.chartData = portfolioChartData;
        const baseCapitalForGrowth = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.initialInvestment = baseCapitalForGrowth;
        widgetProps.totalCapitalAdditions = 0;
        widgetProps.currentBalance = baseCapitalForGrowth + (stats?.total_pnl || 0);
        break;
      case 'combinedPnLROI':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        break;
      case 'compactPerformance':
        // ROI data
        widgetProps.currentROI = stats?.current_roi || 0;
        widgetProps.initialInvestment = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        widgetProps.currentBalance = totalCapitalAdditions > 0
          ? totalCapitalAdditions + (stats?.total_pnl || 0)
          : initialInvestment + (stats?.total_pnl || 0);
        // Win Rate data
        const winningTradesComp = processedTrades.filter(t => (t.profit_loss || 0) > 0).length;
        const losingTradesComp = processedTrades.filter(t => (t.profit_loss || 0) <= 0).length;
        widgetProps.winRate = stats?.win_rate || 0;
        widgetProps.wins = winningTradesComp;
        widgetProps.losses = losingTradesComp;
        widgetProps.totalTrades = stats?.total_trades || 0;
        // Avg PnL per Day data
        const { tradingDays: compTradingDays } = calculateTradingDays(processedTrades, tradingDaysMode);
        const compTotalPnL = processedTrades.reduce((sum, t) => {
          const pnl = t.profit_loss || 0;
          if (includeFeesInPnL) {
            const fundingFee = t.funding_fee || 0;
            const tradingFee = t.trading_fee || 0;
            return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
          }
          return sum + pnl;
        }, 0);
        widgetProps.avgPnLPerDay = compTradingDays > 0 ? compTotalPnL / compTradingDays : 0;
        widgetProps.tradingDays = compTradingDays;
        // Mini chart data (last 7 days PnL)
        widgetProps.pnlTrendData = [] as any; // Will implement later if needed
        break;
      case 'goals':
        widgetProps.includeFeesInPnL = includeFeesInPnL;
        widgetProps.tradesOverride = processedTrades;
        break;
    }

    // Widgets that handle their own padding/layout
    const widgetsWithCustomPadding = [
      'winRate',
      'capitalGrowth',
      'emotionMistakeCorrelation',
      'totalBalance',
      'weightedAvgROI',
      'portfolioOverview',
      'quickActions',
      'rollingTarget',
      'combinedPnLROI',
      'recentTransactions',
      'topMovers',
      'avgROIPerTrade',
      'longShortRatio',
      'currentROI',
      'avgPnLPerTrade',
      'roiPerTrade',
      'simpleAvgROI',
      'costEfficiency',
      'avgPnLPerDay',
      'spotWallet',
      'totalTrades',
      'performanceHighlights',
      'compactPerformance', // NEW: Handles own padding
    ];

    const widgetsHandlingOwnHeader = widgetsWithCustomPadding;
    const hasPadding = !widgetsWithCustomPadding.includes(widgetId);
    const shouldShowTitle = !widgetsHandlingOwnHeader.includes(widgetId);

    return (
      <SmartWidgetWrapper
        key={widgetId}
        id={widgetId}
        title={shouldShowTitle ? widgetConfig.title : undefined}
        isEditMode={isCustomizing}
        onRemove={() => removeWidget(widgetId)}
        className={`col-span-${widgetPosition?.size || 2} row-span-${widgetPosition?.height || 2}`}
        isLoading={loading}
        hasPadding={hasPadding}
      >
        <WidgetComponent
          id={widgetId}
          {...widgetProps}
          isEditMode={isCustomizing}
          onRemove={() => removeWidget(widgetId)}
        />
      </SmartWidgetWrapper>
    );
  }, [isCustomizing, removeWidget, stats, processedTrades, initialInvestment, spotWalletTotal, holdings, portfolioChartData, customWidgets, loading, dashboardStats, currentStreak, includeFeesInPnL, tradingDaysMode, totalCapitalAdditions, resizeWidget, positions, fetchStats]);

  return (
    <>
      <SEO
        title={pageMeta.dashboard.title}
        description={pageMeta.dashboard.description}
        keywords={pageMeta.dashboard.keywords}
        canonical={pageMeta.dashboard.canonical}
      />
      <AppLayout>
        {showOnboarding && !onboardingLoading && (
          <OnboardingFlow onComplete={completeOnboarding} />
        )}

        <LessonLearnedPopup />

        <div id="main-dashboard-content" className="space-y-6 mobile-safe animate-fade-in">
          {loading ? (
            <DashboardSkeleton />
          ) : stats && stats.total_trades === 0 ? (
            <PremiumCard className="p-8 text-center glass">
              <h3 className="text-xl font-semibold mb-2">{t('trades.trades')}</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first trades to activate the dashboard and see your performance metrics
              </p>
              <a href="/upload" className="text-primary hover:underline">
                {t('trades.addTrade')} →
              </a>
            </PremiumCard>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <TabsList className="glass rounded-2xl grid w-full grid-cols-5 h-auto p-1.5">
                  <TabsTrigger value="tradestation" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Trade Station</TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Command Center</TabsTrigger>
                  <TabsTrigger value="behavior" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">Behavior</TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('analytics.insights')}</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-xl transition-all">{t('trades.tradeHistory')}</TabsTrigger>
                </TabsList>

                <TabsContent value="tradestation" className="space-y-6">
                  <TradeStationView onControlsReady={setTradeStationControls} />
                </TabsContent>

                <TabsContent value="overview" className="space-y-6">
                  <DashboardHeader
                    dateRange={dateRange}
                    setDateRange={handleDateRangeChange}
                    clearDateRange={clearDateRange}
                    isCustomizing={isCustomizing}
                    onStartCustomize={handleStartCustomize}
                    onSaveLayout={handleSaveLayout}
                    onCancelCustomize={handleCancelCustomize}
                    onResetLayout={resetLayout}
                    canCustomizeDashboard={canCustomizeDashboard}
                    showUpgradePrompt={setShowUpgradePrompt}
                    // columnCount removed
                    canUndo={canUndo}
                    onUndoReset={undoReset}
                    onForceReset={handleForceResetLayout}
                    onAddWidget={() => setShowWidgetLibrary(true)}
                  />

                  <WidgetLibrary
                    open={showWidgetLibrary}
                    onClose={() => setShowWidgetLibrary(false)}
                    onAddWidget={addWidget}
                    onRemoveWidget={removeWidget}
                    activeWidgets={activeWidgets}
                  />

                  <UpgradePrompt
                    open={showUpgradePrompt}
                    onClose={() => setShowUpgradePrompt(false)}
                  />

                  <OverviewContent renderWidget={renderWidget} />
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4">
                  <BehaviorContent />
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <InsightsContent />
                </TabsContent>

                <TabsContent value="history" className="relative glass rounded-2xl p-6">
                  <HistoryContent />
                </TabsContent>
              </Tabs>
            </>
          )}

          <Suspense fallback={null}>
            <AIAssistant />
          </Suspense>

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

          <TourCTAButton />

          <UpgradePrompt
            open={showUpgradePrompt}
            onClose={() => setShowUpgradePrompt(false)}
            feature="dashboard customization"
          />
        </div>
      </AppLayout>
    </>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
