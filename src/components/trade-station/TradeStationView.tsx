import { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, rectIntersection, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTradeStationLayout, TradeStationWidgetPosition } from '@/hooks/useTradeStationLayout';
// Use unified widget catalog that includes all widgets
import { TRADE_STATION_WIDGET_CATALOG } from '@/config/tradeStationWidgetCatalog';
import { SortableWidget } from '@/components/widgets/SortableWidget';
import { DropZone } from '@/components/widgets/DropZone';
import { CustomizeDashboardControls } from '@/components/CustomizeDashboardControls';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { Trade } from '@/types/trade';

interface TradeStationViewProps {
  onControlsReady?: (controls: {
    isCustomizing: boolean;
    hasChanges: boolean;
    handleStartCustomize: () => void;
    handleSave: () => void;
    handleCancel: () => void;
    handleReset: () => void;
    handleAddWidget: () => void;
    handleAddWidgetDirect: (widgetId: string) => void;  // Direct add for parent WidgetLibrary
    handleRemoveWidgetDirect: (widgetId: string) => void;  // Direct remove for parent WidgetLibrary
    columnCount: number;
    handleColumnCountChange: (count: number) => void;
    widgetCount: number;
    canUndo: boolean;
    handleUndoReset: () => void;
    activeWidgets: string[];  // Expose active widgets for parent
  }) => void;
}

export const TradeStationView = ({ onControlsReady }: TradeStationViewProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalPositions, setOriginalPositions] = useState<TradeStationWidgetPosition[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Data state for widgets
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [capitalLog, setCapitalLog] = useState<any[]>([]);
  const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  
  const {
    positions,
    columnCount,
    isLoading,
    addWidget,
    removeWidget,
    saveLayout,
    updateColumnCount,
    resetLayout,
    undoReset,
    canUndo,
  } = useTradeStationLayout(user?.id);

  // Spot wallet and prices
  const { holdings, isLoading: isSpotWalletLoading } = useSpotWallet();
  const { prices } = useTokenPrices(holdings.map(h => h.token_symbol));

  // Process trades with fees
  const processedTrades = useMemo(() => 
    trades.map(trade => ({
      ...trade,
      profit_loss: includeFeesInPnL 
        ? (trade.profit_loss || 0) - Math.abs(trade.funding_fee || 0) - Math.abs(trade.trading_fee || 0)
        : (trade.profit_loss || 0)
    })),
    [trades, includeFeesInPnL]
  );

  // Calculate dashboard stats
  const dashboardStats = useDashboardStats(processedTrades, capitalLog);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Active widgets for library
  const activeWidgets = useMemo(() => positions.map(p => p.id), [positions]);
  
  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    if (!isCustomizing || originalPositions.length === 0) return false;
    
    if (positions.length !== originalPositions.length) return true;
    
    return positions.some(pos => {
      const original = originalPositions.find(o => o.id === pos.id);
      return !original || original.column !== pos.column || original.row !== pos.row;
    });
  }, [isCustomizing, positions, originalPositions]);
  
  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activePos = positions.find(p => p.id === activeId);
    if (!activePos) {
      console.error('Active widget not found:', activeId);
      setActiveId(null);
      return;
    }

    let updatedPositions: TradeStationWidgetPosition[];

    // Handle drop on another widget - swap positions
    const overPos = positions.find(p => p.id === overId);
    if (overPos) {
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

    // Validate
    const originalIds = new Set(positions.map(p => p.id));
    const updatedIds = new Set(updatedPositions.map(p => p.id));
    
    if (originalIds.size !== updatedIds.size) {
      console.error('Widget count mismatch!');
      toast.error('Layout update failed');
      setActiveId(null);
      return;
    }

    // Save immediately
    saveLayout(updatedPositions);
    setActiveId(null);
  }, [positions, saveLayout]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);
  
  // Helper function to calculate current streak
  const calculateCurrentStreak = useCallback((trades: Trade[]): { type: 'win' | 'loss'; count: number } => {
    if (trades.length === 0) return { type: 'win', count: 0 };
    
    const sorted = [...trades].sort((a, b) => 
      new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
    );
    
    const latestTrade = sorted[0];
    const streakType: 'win' | 'loss' = (latestTrade.profit_loss || 0) > 0 ? 'win' : 'loss';
    let count = 0;
    
    for (const trade of sorted) {
      const isWin = (trade.profit_loss || 0) > 0;
      if ((streakType === 'win' && isWin) || (streakType === 'loss' && !isWin)) {
        count++;
      } else {
        break;
      }
    }
    
    return { type: streakType, count };
  }, []);

  // Data fetching functions
  const fetchCapitalLog = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('capital_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (data) {
      setCapitalLog(data);
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

  const fetchStats = async () => {
    if (!user) return;
    setDataLoading(true);

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
      
      // Calculate P&L with and without fees
      const totalPnlWithoutFees = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const totalPnlWithFees = trades.reduce((sum, t) => {
        const pnl = t.profit_loss || 0;
        const fundingFee = t.funding_fee || 0;
        const tradingFee = t.trading_fee || 0;
        return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
      }, 0);
      
      const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
      const avgDuration = trades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (trades.length || 1);

      // Calculate total calendar days from first to last trade (based on when trades were opened)
      let tradingDaySpan = 0;
      if (trades.length > 0) {
        const tradeDates = trades.map(t => new Date(t.opened_at || t.trade_date).getTime());
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
      
      // Calculate total added capital from capital_log
      const totalAddedCapital = capitalLog.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
      const baseCapital = totalAddedCapital > 0 ? totalAddedCapital : initialInvestment;
      
      // Calculate current balance
      const currentBalance = baseCapital + (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees);
      
      // Calculate current ROI
      let currentROI = 0;
      if (baseCapital > 0) {
        currentROI = ((currentBalance - baseCapital) / baseCapital) * 100;
      }
      
      // Calculate weighted average ROI: total P&L divided by total capital invested
      // Calculate capital invested per trade using available data
      const totalCapitalInvested = trades.reduce((sum, t) => {
        // Priority 1: Use margin if available
        if (t.margin && t.margin > 0) return sum + t.margin;
        
        // Priority 2: Calculate from position_size and entry_price
        if (t.position_size && t.entry_price && t.position_size > 0 && t.entry_price > 0) {
          const notionalValue = t.position_size * t.entry_price;
          const leverage = t.leverage && t.leverage > 0 ? t.leverage : 1;
          return sum + (notionalValue / leverage);
        }
        
        // Priority 3: Reverse calculate from ROI if available
        if (t.roi && t.roi !== 0 && t.profit_loss) {
          return sum + Math.abs(t.profit_loss / (t.roi / 100));
        }
        
        // Priority 4: Use position_size as approximation
        if (t.position_size && t.position_size > 0) {
          const leverage = t.leverage && t.leverage > 0 ? t.leverage : 1;
          return sum + (t.position_size / leverage);
        }
        
        return sum;
      }, 0);
      
      const avgROIPerTrade = totalCapitalInvested > 0
        ? ((includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / totalCapitalInvested) * 100
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
    setDataLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    if (user) {
      fetchCapitalLog();
      fetchInitialInvestment();
      fetchStats();
    }
    
    // Set up realtime subscriptions
    const tradesChannel = supabase
      .channel('trades-changes-tradestation')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
        () => fetchStats()
      )
      .subscribe();
    
    const capitalChannel = supabase
      .channel('capital-changes-tradestation')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'capital_log', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchCapitalLog().then(() => fetchStats());
        }
      )
      .subscribe();
    
    return () => {
      tradesChannel.unsubscribe();
      capitalChannel.unsubscribe();
    };
  }, [user]);
  
  // Widget renderer for regular widgets
  const renderWidget = useCallback((widgetId: string) => {
    const widgetConfig = TRADE_STATION_WIDGET_CATALOG[widgetId];
    if (!widgetConfig) return null;
    
    const WidgetComponent = widgetConfig.component;
    
    // Build widget props based on widget requirements
    const widgetProps: any = {
      id: widgetId,
      isEditMode: isCustomizing,
      onRemove: () => removeWidget(widgetId),
    };
    
    // Calculate common values
    const totalCapitalAdditions = capitalLog.reduce((sum, entry) => 
      sum + (entry.amount_added || 0), 0);
    const totalInvestedCapital = totalCapitalAdditions > 0 
      ? totalCapitalAdditions : initialInvestment;
    const spotWalletTotal = holdings.reduce((sum, h) => {
      const price = Number(prices[h.token_symbol]) || 0;
      return sum + (h.quantity * price);
    }, 0);
    const currentStreak = calculateCurrentStreak(processedTrades);
    
    // Add data based on widget type
    switch (widgetId) {
      case 'totalBalance':
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
        widgetProps.totalValue = spotWalletTotal;
        widgetProps.change24h = 0;
        widgetProps.changePercent24h = 0;
        widgetProps.tokenCount = holdings?.length || 0;
        break;
      case 'avgPnLPerTrade':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'avgPnLPerDay':
        widgetProps.avgPnLPerDay = stats?.avg_pnl_per_day || 0;
        widgetProps.tradingDays = stats?.trading_days || 0;
        break;
      case 'currentROI':
        widgetProps.currentROI = stats?.current_roi || 0;
        widgetProps.initialInvestment = totalInvestedCapital;
        widgetProps.currentBalance = totalInvestedCapital + (stats?.total_pnl || 0);
        break;
      case 'avgROIPerTrade':
        widgetProps.avgROIPerTrade = stats?.avg_roi_per_trade || 0;
        widgetProps.totalTrades = stats?.total_trades || 0;
        break;
      case 'capitalGrowth':
        widgetProps.chartData = [];
        widgetProps.initialInvestment = totalInvestedCapital;
        widgetProps.totalCapitalAdditions = 0;
        widgetProps.currentBalance = totalInvestedCapital + (stats?.total_pnl || 0);
        break;
      case 'topMovers':
      case 'aiInsights':
      case 'recentTransactions':
      case 'behaviorAnalytics':
      case 'costEfficiency':
      case 'heatmap':
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
      case 'rollingTarget':
        widgetProps.trades = processedTrades;
        widgetProps.initialInvestment = totalInvestedCapital;
        break;
      case 'combinedPnLROI':
        widgetProps.avgPnLPerTrade = stats?.avg_pnl_per_trade || 0;
        break;
      case 'activeGoals':
        widgetProps.compact = false;
        break;
      case 'emotionMistakeCorrelation':
        // This widget fetches its own data
        break;
      // Trade Station specific widgets - manage their own data
      case 'errorReflection':
      case 'riskCalculator':
      case 'dailyLossLock':
      case 'simpleLeverage':
        break;
    }
    
    return (
      <SortableWidget
        id={widgetId}
        isEditMode={isCustomizing}
        onRemove={() => removeWidget(widgetId)}
      >
        <WidgetComponent {...widgetProps} />
      </SortableWidget>
    );
  }, [isCustomizing, removeWidget, processedTrades, stats, holdings, prices, capitalLog, initialInvestment, dashboardStats, calculateCurrentStreak]);
  
  // Render spanning widget (full width) - no extra wrapper
  const renderSpanningWidget = useCallback((widgetId: string) => {
    const widgetConfig = TRADE_STATION_WIDGET_CATALOG[widgetId];
    if (!widgetConfig) return null;
    
    const WidgetComponent = widgetConfig.component;
    
    // Build widget props similar to renderWidget
    const widgetProps: any = {
      id: widgetId,
      isEditMode: isCustomizing,
      onRemove: () => removeWidget(widgetId),
    };
    
    // Add data for spanning widgets
    const totalCapitalAdditions = capitalLog.reduce((sum, entry) => 
      sum + (entry.amount_added || 0), 0);
    const totalInvestedCapital = totalCapitalAdditions > 0 
      ? totalCapitalAdditions : initialInvestment;
    
    switch (widgetId) {
      case 'rollingTarget':
        widgetProps.trades = processedTrades;
        widgetProps.initialInvestment = totalInvestedCapital;
        break;
    }
    
    return (
      <SortableWidget
        id={widgetId}
        isEditMode={isCustomizing}
        onRemove={() => removeWidget(widgetId)}
      >
        <WidgetComponent {...widgetProps} />
      </SortableWidget>
    );
  }, [isCustomizing, removeWidget, processedTrades, capitalLog, initialInvestment]);

  // Handle customize actions
  const handleStartCustomize = useCallback(() => {
    setOriginalPositions([...positions]);
    setIsCustomizing(true);
  }, [positions]);

  const handleSaveLayout = useCallback(() => {
    setIsCustomizing(false);
    setOriginalPositions([]);
    toast.success('Trade Station layout saved');
  }, []);

  const handleCancelCustomize = useCallback(() => {
    if (originalPositions.length > 0) {
      saveLayout(originalPositions);
    }
    setIsCustomizing(false);
    setOriginalPositions([]);
  }, [originalPositions, saveLayout]);

  // Expose controls to parent via callback - parent Dashboard will handle widget library
  const controls = useMemo(() => ({
    isCustomizing,
    hasChanges,
    handleStartCustomize,
    handleSave: handleSaveLayout,
    handleCancel: handleCancelCustomize,
    handleReset: resetLayout,
    handleAddWidget: () => {
      // This will be intercepted by parent to open its global widget library
      console.log('[TradeStation] Add widget requested');
    },
    handleAddWidgetDirect: addWidget,  // Direct add function for parent WidgetLibrary
    handleRemoveWidgetDirect: removeWidget,  // Direct remove function for parent WidgetLibrary
    columnCount,
    handleColumnCountChange: updateColumnCount,
    widgetCount: positions.length,
    canUndo,
    handleUndoReset: undoReset,
    activeWidgets,  // Expose active widgets for parent WidgetLibrary
  }), [isCustomizing, hasChanges, handleStartCustomize, handleSaveLayout, handleCancelCustomize, resetLayout, columnCount, updateColumnCount, positions.length, canUndo, undoReset, addWidget, removeWidget, activeWidgets]);

  // Notify parent when controls are ready
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady(controls);
    }
  }, [controls, onControlsReady]);

  if (isLoading || dataLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 relative">
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Trade Station Layout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your Trade Station to the default layout. Your current layout will be saved and you can undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              resetLayout();
              setShowResetDialog(false);
            }}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dynamic Grid with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={rectIntersection}
      >
        <SortableContext
          items={positions.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          {/* Single grid container - spanning widgets will use col-span-full */}
          <div 
            className="grid gap-4"
            style={{ 
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            }}
          >
            {/* Sort all positions by row, then column */}
            {[...positions]
              .sort((a, b) => {
                const ar = a.row ?? 0;
                const br = b.row ?? 0;
                if (ar !== br) return ar - br;
                const ac = a.column ?? 0;
                const bc = b.column ?? 0;
                return ac - bc;
              })
              .map((pos) => {
                const isSpanning = pos.id === 'rollingTarget';
                
                return (
                  <div
                    key={pos.id}
                    className={isSpanning ? 'col-span-full' : ''}
                    style={
                      isSpanning
                        ? undefined
                        : {
                            gridColumn: (pos.column ?? 0) + 1,
                            gridRow: (pos.row ?? 0) + 1,
                          }
                    }
                  >
                    {isSpanning ? renderSpanningWidget(pos.id) : renderWidget(pos.id)}
                  </div>
                );
              })}
            
            {/* Drop zones for customization */}
            {isCustomizing &&
              Array.from({ length: columnCount }, (_, colIdx) => {
                const maxRow = Math.max(
                  0,
                  ...positions.filter(p => (p.column ?? -1) === colIdx).map(p => (p.row ?? 0))
                );
                return (
                  <div
                    key={`dropzone-${colIdx}`}
                    style={{
                      gridColumn: colIdx + 1,
                      gridRow: maxRow + 2,
                    }}
                  >
                    <DropZone id={`dropzone-${colIdx}-${maxRow + 1}`} />
                  </div>
                );
              })}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Widget Library - Removed from here, handled by parent Dashboard */}
    </div>
  );
};
