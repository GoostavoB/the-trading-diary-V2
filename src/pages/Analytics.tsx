import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlurToggleButton } from "@/components/ui/BlurToggleButton";
import { InteractivePnLChart } from "@/components/charts/InteractivePnLChart";
import { AssetPerformanceRadar } from "@/components/charts/AssetPerformanceRadar";
import { WinsByHourChart } from "@/components/charts/WinsByHourChart";
import { SetupPerformanceChart } from "@/components/charts/SetupPerformanceChart";
import { TradeComparison } from "@/components/TradeComparison";
import { LazyChart } from "@/components/LazyChart";
import { CapitalManagement } from "@/components/CapitalManagement";
import { CapitalHistoryChart } from "@/components/CapitalHistoryChart";
import { PeriodBasedROI } from "@/components/PeriodBasedROI";
import { TradingJournal } from "@/components/TradingJournal";
import { RiskCalculator } from "@/components/RiskCalculator";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/types/trade";
import { BarChart3, TrendingUp, Clock, Target, DollarSign, Percent, Shield, Brain, X } from "lucide-react";
import { useBadgeNotifications } from "@/hooks/useBadgeNotifications";
import { SEO } from "@/components/SEO";
import { pageMeta } from "@/utils/seoHelpers";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useDateRange } from "@/contexts/DateRangeContext";
import { Button } from "@/components/ui/button";
import { layout, spacing, typography } from "@/styles/design-tokens";
import { SkipToContent } from "@/components/SkipToContent";

export default function Analytics() {
  const { dateRange, setDateRange, clearDateRange } = useDateRange();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);

  // Enable badge notifications
  useBadgeNotifications(trades);

  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      // Apply date filter if present
      if (dateRange?.from) {
        const fromDate = dateRange.from.toISOString();
        const toDate = dateRange.to ? dateRange.to.toISOString() : dateRange.from.toISOString();
        query = query.gte('trade_date', fromDate).lte('trade_date', toDate);
      }

      const { data, error } = await query
        .order("trade_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setTrades(data as Trade[] || []);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Derive real PnL chart from actual trades (sorted chronologically)
  const pnlChartData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sorted = [...trades].sort(
      (a, b) => new Date(a.trade_date ?? a.created_at).getTime() - new Date(b.trade_date ?? b.created_at).getTime()
    );
    let cumulative = 0;
    return sorted.map(trade => {
      const pnl = trade.profit_loss ?? 0;
      cumulative += pnl;
      return {
        date: new Date(trade.trade_date ?? trade.created_at).toLocaleDateString(),
        pnl: Math.round(pnl * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
      };
    });
  }, [trades]);

  // Derive real asset performance from actual trades
  const assetData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const byAsset: Record<string, { wins: number; total: number; profit: number }> = {};
    trades.forEach(trade => {
      const asset = trade.symbol || 'Unknown';
      if (!byAsset[asset]) byAsset[asset] = { wins: 0, total: 0, profit: 0 };
      byAsset[asset].total++;
      byAsset[asset].profit += trade.profit_loss ?? 0;
      if ((trade.profit_loss ?? 0) > 0) byAsset[asset].wins++;
    });
    return Object.entries(byAsset)
      .map(([asset, d]) => ({
        asset,
        winRate: Math.round((d.wins / d.total) * 100),
        avgProfit: Math.round(d.profit / d.total),
        tradeCount: d.total,
        roi: Math.round((d.profit / d.total) * 10) / 10,
      }))
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 8);
  }, [trades]);

  // Derive real setup performance from actual trades
  const setupData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const bySetup: Record<string, { wins: number; total: number; profit: number }> = {};
    trades.forEach(trade => {
      const setup = trade.setup || 'No Setup';
      if (!bySetup[setup]) bySetup[setup] = { wins: 0, total: 0, profit: 0 };
      bySetup[setup].total++;
      bySetup[setup].profit += trade.profit_loss ?? 0;
      if ((trade.profit_loss ?? 0) > 0) bySetup[setup].wins++;
    });
    return Object.entries(bySetup)
      .map(([setup, d]) => ({
        setup,
        winRate: Math.round((d.wins / d.total) * 100),
        roi: Math.round(d.profit / d.total),
        tradeCount: d.total,
      }))
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 8);
  }, [trades]);

  return (
    <AppLayout>
      <SEO
        title={pageMeta.analytics.title}
        description={pageMeta.analytics.description}
        keywords={pageMeta.analytics.keywords}
        canonical={pageMeta.analytics.canonical}
        noindex={true}
      />
      <SkipToContent />
      <main id="main-content" className={layout.container}>
        <div className={spacing.section}>
          <div className={layout.flex.between}>
            <header>
              <h1 className="text-3xl font-bold" id="analytics-heading">Advanced Analytics</h1>
              <p className="text-muted-foreground mt-1">Deep dive into your trading performance</p>
            </header>
            <div className="flex items-center gap-2">
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="h-9"
                  aria-label="Clear date range filter"
                >
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear Filter
                </Button>
              )}
              <BlurToggleButton />
            </div>
          </div>

          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-3 md:grid-cols-5 glass p-1">
              <TabsTrigger value="charts" className="gap-2 text-xs md:text-sm data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Charts</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2 text-xs md:text-sm data-[state=active]:shadow-sm">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden md:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-2 text-xs md:text-sm data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" />
                <span className="hidden md:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="behavior" className="gap-2 text-xs md:text-sm data-[state=active]:shadow-sm">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Behavior</span>
              </TabsTrigger>
              <TabsTrigger value="capital" className="gap-2 text-xs md:text-sm data-[state=active]:shadow-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline">Capital</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <LazyChart height={400}>
                <InteractivePnLChart data={pnlChartData} />
              </LazyChart>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LazyChart height={350}>
                  <AssetPerformanceRadar data={assetData} />
                </LazyChart>
                <LazyChart height={450}>
                  <WinsByHourChart trades={trades} />
                </LazyChart>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="glass-subtle p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Custom Setup Performance</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyze how each of your custom-tagged trading strategies performs across win rate and ROI metrics
                </p>
              </div>
              <LazyChart height={600}>
                <SetupPerformanceChart data={setupData} />
              </LazyChart>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <RiskCalculator />
              <ExpenseTracker />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <TradingJournal />
              <LazyChart height={450}>
                <WinsByHourChart trades={trades} />
              </LazyChart>
            </TabsContent>

            <TabsContent value="capital" className="space-y-6">
              <CapitalManagement />
              <CapitalHistoryChart />
              <PeriodBasedROI />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}
