import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TrendingUp, TrendingDown, DollarSign, Target, Flame, Eye, EyeOff, Info, GripVertical } from 'lucide-react';
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
import { MonthSummaryInsights } from '@/components/MonthSummaryInsights';
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
import { AccentColorPicker } from '@/components/AccentColorPicker';
import { AIAssistant } from '@/components/AIAssistant';
import { WinsByHourChart } from '@/components/charts/WinsByHourChart';
import { MaxDrawdownCard } from '@/components/MaxDrawdownCard';
import { TopAssetsByWinRate } from '@/components/TopAssetsByWinRate';
import { CurrentStreakCard } from '@/components/CurrentStreakCard';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatNumber';
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
  const [beastModeDays, setBeastModeDays] = useState(0); // Actually used for "Monstro Mode"
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<string>('insights');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const handleTabChange = (val: string) => {
    const container = tabsContainerRef.current?.closest('main') as HTMLElement | null;
    const prevScrollTop = container ? container.scrollTop : window.scrollY;
    setActiveTab(val);
    requestAnimationFrame(() => {
      if (container) container.scrollTop = prevScrollTop;
      else window.scrollTo({ top: prevScrollTop });
    });
  };
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

      // Calculate Monstro Mode days (days with >70% win rate)
      const tradesByDate = trades.reduce((acc, trade) => {
        const date = new Date(trade.trade_date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(trade);
        return acc;
      }, {} as Record<string, typeof trades>);

      const daysWithMonstroMode = Object.values(tradesByDate).filter(dayTrades => {
        const wins = dayTrades.filter(t => (t.pnl || 0) > 0).length;
        const winRate = (wins / dayTrades.length) * 100;
        return winRate > 70;
      }).length;

      setBeastModeDays(daysWithMonstroMode);

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

  const calculateCurrentStreak = (trades: Trade[]) => {
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
  };

  const calculateStreakType = (trades: Trade[]): 'winning' | 'losing' => {
    if (trades.length === 0) return 'winning';
    const sorted = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
    return sorted[0].pnl > 0 ? 'winning' : 'losing';
  };

  const getBestAsset = (trades: Trade[]) => {
    if (trades.length === 0) return 'N/A';
    const assetPnL: Record<string, number> = {};
    trades.forEach(t => {
      const symbol = t.symbol || 'Unknown';
      assetPnL[symbol] = (assetPnL[symbol] || 0) + (t.pnl || 0);
    });
    const best = Object.entries(assetPnL).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : 'N/A';
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
      <div className="space-y-6 mobile-safe animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h1>
              <p className="text-sm text-muted-foreground/80">Track your trading performance and analytics</p>
            </div>
            {beastModeDays > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-2 px-4 py-2.5 glass-strong rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-help"
                      style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      <Flame className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-primary tracking-wide">
                          Monstro Mode
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {beastModeDays} {beastModeDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs glass-strong">
                    <p className="font-semibold mb-1">Monstro Mode</p>
                    <p className="text-sm">Activates when your win rate and profit exceed target thresholds for 3+ consecutive days. Days shown: {beastModeDays}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AccentColorPicker />
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            {trades.length > 0 && (
              <ExportTradesDialog trades={filteredTrades.length > 0 ? filteredTrades : trades} />
            )}
          </div>
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
            {/* Statistics Overview - Flexible Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div className="glass rounded-2xl p-5 hover-lift cursor-default relative overflow-hidden">
                {/* Fees Toggle - Minimalistic */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <Label htmlFor="fees-toggle-grid" className="cursor-pointer text-[10px] text-muted-foreground/70 hidden lg:inline">
                    {includeFeesInPnL ? 'w/ Fees' : 'w/o Fees'}
                  </Label>
                  <Switch
                    id="fees-toggle-grid"
                    checked={includeFeesInPnL}
                    onCheckedChange={setIncludeFeesInPnL}
                    className="scale-75"
                  />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div className="text-xs lg:text-sm text-muted-foreground font-medium">Total P&L</div>
                </div>
                <div className={`text-2xl lg:text-3xl font-bold ${
                  stats && stats.total_pnl > 0 ? 'text-primary' : 
                  stats && stats.total_pnl < 0 ? 'text-secondary' : 'text-foreground'
                }`}>
                  <AnimatedCounter value={stats?.total_pnl || 0} prefix="$" decimals={2} />
                </div>
              </div>
              
              <div className="glass rounded-2xl p-5 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div className="text-xs lg:text-sm text-muted-foreground font-medium">Win Rate</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">
                  <AnimatedCounter value={stats?.win_rate || 0} suffix="%" decimals={1} />
                </div>
              </div>
              
              <div className="glass rounded-2xl p-5 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div className="text-xs lg:text-sm text-muted-foreground font-medium">Total Trades</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">
                  <AnimatedCounter value={stats?.total_trades || 0} decimals={0} />
                </div>
              </div>
              
              <div className="glass rounded-2xl p-5 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <div className="text-xs lg:text-sm text-muted-foreground font-medium">Avg Duration</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">
                  <AnimatedCounter value={Math.round(stats?.avg_duration || 0)} decimals={0} />
                  <span className="text-base ml-1 text-muted-foreground">m</span>
                </div>
              </div>
            </div>

            {/* Month Summary Insights */}
            {stats && stats.total_trades > 0 && (
              <div className="mb-6">
                <MonthSummaryInsights trades={filteredTrades.length > 0 ? filteredTrades : trades} />
              </div>
            )}

            {/* Trading Streaks */}
            {stats && stats.total_trades > 0 && (
              <div className="mb-6">
                <TradingStreaks trades={filteredTrades.length > 0 ? filteredTrades : trades} />
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
                  <DashboardCharts trades={filteredTrades.length > 0 ? filteredTrades : trades} chartType="cumulative" />
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
                  <DashboardCharts trades={filteredTrades.length > 0 ? filteredTrades : trades} chartType="winsLosses" />
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
                  <TradingHeatmap trades={filteredTrades.length > 0 ? filteredTrades : trades} />
                </div>
              </div>
            )}

            {/* Wins by Hour Chart */}
            {stats && stats.total_trades > 0 && (
              <div className="mb-6">
                <WinsByHourChart trades={filteredTrades.length > 0 ? filteredTrades : trades} />
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
                <MonthlyReport 
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
                <PerformanceInsights
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
                <StatisticsComparison 
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
              </TabsContent>

              <TabsContent value="history" className="relative glass rounded-2xl p-6">
                <TradeHistory onTradesChange={fetchStats} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 md:space-y-6 relative glass rounded-2xl p-6">
                {/* Additional Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <MaxDrawdownCard value={3500} percentage={12.5} />
                  <CurrentStreakCard 
                    streak={calculateCurrentStreak(filteredTrades.length > 0 ? filteredTrades : trades)}
                    type={calculateStreakType(filteredTrades.length > 0 ? filteredTrades : trades)}
                  />
                  <div className="p-5 glass rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-2">Best Asset</p>
                    <p className="text-2xl font-bold">{getBestAsset(filteredTrades.length > 0 ? filteredTrades : trades)}</p>
                  </div>
                </div>

                <DrawdownAnalysis
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  initialInvestment={initialInvestment}
                />
                <SetupManager
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
                <AdvancedAnalytics
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  initialInvestment={initialInvestment}
                  userId={user?.id || ''}
                  onInitialInvestmentUpdate={setInitialInvestment}
                />
              </TabsContent>

              <TabsContent value="weekly" className="glass rounded-2xl p-6">
                <WeeklyReview 
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
              </TabsContent>

              <TabsContent value="monthly" className="glass rounded-2xl p-6">
                <MonthlyReport 
                  trades={filteredTrades.length > 0 ? filteredTrades : trades}
                />
              </TabsContent>

              <TabsContent value="goals" className="space-y-4 md:space-y-6 glass rounded-2xl p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GoalsTracker 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                  <AchievementBadges 
                    trades={filteredTrades.length > 0 ? filteredTrades : trades}
                  />
                </div>
                <ExpenseTracker />
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
