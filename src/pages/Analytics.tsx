import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractivePnLChart } from "@/components/charts/InteractivePnLChart";
import { AssetPerformanceRadar } from "@/components/charts/AssetPerformanceRadar";
import { WinsByHourChart } from "@/components/charts/WinsByHourChart";
import { SetupPerformanceChart } from "@/components/charts/SetupPerformanceChart";
import { TradeReplay } from "@/components/TradeReplay";
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
import { BarChart3, TrendingUp, Clock, Target, DollarSign, Percent, Shield, Brain } from "lucide-react";
import { useBadgeNotifications } from "@/hooks/useBadgeNotifications";

export default function Analytics() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);

  // Enable badge notifications
  useBadgeNotifications(trades);

  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("trade_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setTrades(data as Trade[] || []);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Memoize chart data to prevent recalculation on every render
  const pnlChartData = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      pnl: Math.random() * 1000 - 300,
      cumulative: (i + 1) * (Math.random() * 200 - 50)
    })),
    []
  );

  const assetData = useMemo(() => [
    { asset: "BTCUSDT", winRate: 65, avgProfit: 250, tradeCount: 45, roi: 15 },
    { asset: "ETHUSDT", winRate: 58, avgProfit: 180, tradeCount: 38, roi: 12 },
    { asset: "SOLUSDT", winRate: 72, avgProfit: 320, tradeCount: 28, roi: 22 },
  ], []);


  const setupData = useMemo(() => [
    { setup: "Breakout", winRate: 68, roi: 18, tradeCount: 32 },
    { setup: "Reversal", winRate: 55, roi: 12, tradeCount: 28 },
    { setup: "Scalp", winRate: 72, roi: 8, tradeCount: 45 },
    { setup: "Swing", winRate: 62, roi: 25, tradeCount: 18 },
  ], []);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your trading performance</p>
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full max-w-5xl grid-cols-4 md:grid-cols-7 glass">
            <TabsTrigger value="charts" className="gap-2 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 text-xs md:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2 text-xs md:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-2 text-xs md:text-sm">
              <Brain className="h-4 w-4" />
              <span className="hidden md:inline">Behavior</span>
            </TabsTrigger>
            <TabsTrigger value="capital" className="gap-2 text-xs md:text-sm">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Capital</span>
            </TabsTrigger>
            <TabsTrigger value="replay" className="gap-2 text-xs md:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline">Replay</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2 text-xs md:text-sm">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Compare</span>
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

          <TabsContent value="performance">
            <LazyChart height={400}>
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

          <TabsContent value="replay">
            {trades.length > 0 ? (
              <TradeReplay trade={trades[0]} />
            ) : (
              <p className="text-center text-muted-foreground p-8">
                No trades available for replay
              </p>
            )}
          </TabsContent>

          <TabsContent value="compare">
            <TradeComparison trades={selectedTrades.length > 0 ? selectedTrades : trades.slice(0, 3)} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
