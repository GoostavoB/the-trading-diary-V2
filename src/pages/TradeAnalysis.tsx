import AppLayout from "@/components/layout/AppLayout";
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeComparator } from "@/components/analysis/TradeComparator";
import { BacktestingSystem } from "@/components/analytics/BacktestingSystem";
import { CorrelationMatrix } from "@/components/analytics/CorrelationMatrix";
import { BrokerComparison } from "@/components/analytics/BrokerComparison";
import { MarketRegimeDetector } from "@/components/analytics/MarketRegimeDetector";
import { MonteCarloSimulator } from "@/components/analytics/MonteCarloSimulator";
import { TradeScreener } from "@/components/analytics/TradeScreener";
import { PerformanceAttributionChart } from "@/components/analytics/PerformanceAttributionChart";
import { RealtimePortfolioTracker } from "@/components/analytics/RealtimePortfolioTracker";
import { GitCompare, TestTube, Network, Building, TrendingUp, Dices, Filter, PieChart, Activity, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/types/trade";

export default function TradeAnalysis() {
  const { data: trades = [] } = useQuery({
    queryKey: ['trades-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .is('deleted_at', null)
        .order('opened_at', { ascending: false });
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  return (
    <>
      <SEO
        title={pageMeta.tradeAnalysis.title}
        description={pageMeta.tradeAnalysis.description}
        keywords={pageMeta.tradeAnalysis.keywords}
        canonical={pageMeta.tradeAnalysis.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Advanced Analytics & Market Intelligence</h1>

        <Tabs defaultValue="compare" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="compare" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="backtest" className="gap-2">
              <TestTube className="h-4 w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="correlation" className="gap-2">
              <Network className="h-4 w-4" />
              Correlation
            </TabsTrigger>
            <TabsTrigger value="broker" className="gap-2">
              <Building className="h-4 w-4" />
              Brokers
            </TabsTrigger>
            <TabsTrigger value="regime" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Regime
            </TabsTrigger>
            <TabsTrigger value="monte-carlo" className="gap-2">
              <Dices className="h-4 w-4" />
              Monte Carlo
            </TabsTrigger>
            <TabsTrigger value="screener" className="gap-2">
              <Filter className="h-4 w-4" />
              Screener
            </TabsTrigger>
            <TabsTrigger value="attribution" className="gap-2">
              <PieChart className="h-4 w-4" />
              Attribution
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <Activity className="h-4 w-4" />
              Live Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare">
            <TradeComparator />
          </TabsContent>

          <TabsContent value="backtest">
            <BacktestingSystem trades={trades} />
          </TabsContent>

          <TabsContent value="correlation">
            <CorrelationMatrix trades={trades} />
          </TabsContent>

          <TabsContent value="broker">
            <BrokerComparison trades={trades} />
          </TabsContent>

          <TabsContent value="regime">
            <MarketRegimeDetector trades={trades} />
          </TabsContent>

          <TabsContent value="monte-carlo">
            <MonteCarloSimulator trades={trades} />
          </TabsContent>

          <TabsContent value="screener">
            <TradeScreener trades={trades} />
          </TabsContent>

          <TabsContent value="attribution">
            <PerformanceAttributionChart trades={trades} />
          </TabsContent>

          <TabsContent value="portfolio">
            <RealtimePortfolioTracker />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
    </>
  );
}
