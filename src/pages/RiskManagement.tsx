import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskMetricsCard } from "@/components/risk/RiskMetricsCard";
import { PositionSizeCalculator } from "@/components/risk/PositionSizeCalculator";
import { StopLossCalculator } from "@/components/risk/StopLossCalculator";
import { LeverageCalculator } from "@/components/risk/LeverageCalculator";
import { DrawdownChart } from "@/components/risk/DrawdownChart";
import { LeverageStopWidget } from "@/components/leverage-stop/LeverageStopWidget";
import { BlurToggleButton } from "@/components/ui/BlurToggleButton";
import { Shield, Calculator, TrendingDown, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function RiskManagement() {
  const { user } = useAuth();
  const [drawdownData, setDrawdownData] = useState<any[]>([]);

  const { data: trades } = useQuery({
    queryKey: ['trades-risk', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (trades && trades.length > 0) {
      // Calculate drawdown data
      let equity = 10000; // Starting equity
      let peak = equity;
      const data = [];

      for (const trade of trades) {
        equity += trade.pnl;
        if (equity > peak) peak = equity;
        const drawdown = ((equity - peak) / peak) * 100;
        
        data.push({
          date: new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          equity,
          peak,
          drawdown
        });
      }

      setDrawdownData(data);
    }
  }, [trades]);

  // Calculate risk metrics
  const calculateRiskMetrics = () => {
    if (!trades || trades.length === 0) {
      return {
        dailyRisk: 0,
        weeklyRisk: 0,
        monthlyRisk: 0,
        openPositionsRisk: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        varValue: 0
      };
    }

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const losses = trades.filter(t => t.pnl < 0);
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
    
    // Simulated calculations (in production, these would be more sophisticated)
    const dailyRisk = avgLoss * 0.5; // Estimated daily risk
    const weeklyRisk = dailyRisk * 3;
    const monthlyRisk = dailyRisk * 12;
    const openPositionsRisk = 250; // Simulated open positions risk
    
    // Calculate max drawdown
    let equity = 10000;
    let peak = equity;
    let maxDrawdown = 0;
    let currentDrawdown = 0;

    trades.forEach(trade => {
      equity += trade.pnl;
      if (equity > peak) {
        peak = equity;
      }
      const dd = ((equity - peak) / peak) * 100;
      if (dd < maxDrawdown) maxDrawdown = dd;
    });

    currentDrawdown = ((equity - peak) / peak) * 100;

    // Value at Risk (95% confidence)
    const sortedLosses = losses.map(t => t.pnl).sort((a, b) => a - b);
    const varIndex = Math.floor(sortedLosses.length * 0.05);
    const varValue = sortedLosses[varIndex] || 0;

    return {
      dailyRisk,
      weeklyRisk,
      monthlyRisk,
      openPositionsRisk,
      maxDrawdown,
      currentDrawdown,
      varValue: Math.abs(varValue)
    };
  };

  const metrics = calculateRiskMetrics();

  const getRiskStatus = (value: number, maxValue: number): "safe" | "warning" | "danger" => {
    const percentage = (value / maxValue) * 100;
    if (percentage < 50) return "safe";
    if (percentage < 80) return "warning";
    return "danger";
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Risk Management</h1>
              <p className="text-muted-foreground">Monitor and control your trading risk exposure</p>
            </div>
          </div>
          <BlurToggleButton />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="h-4 w-4" />
              Calculators
            </TabsTrigger>
            <TabsTrigger value="drawdown" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Drawdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <RiskMetricsCard
                title="Daily Risk Exposure"
                value={metrics.dailyRisk}
                maxValue={300}
                status={getRiskStatus(metrics.dailyRisk, 300)}
                description="Maximum acceptable loss per day"
                unit="$"
                learnMoreHref="/user-guide#daily-risk"
              />
              <RiskMetricsCard
                title="Weekly Risk Exposure"
                value={metrics.weeklyRisk}
                maxValue={1000}
                status={getRiskStatus(metrics.weeklyRisk, 1000)}
                description="Cumulative risk over 7 days"
                unit="$"
                learnMoreHref="/user-guide#weekly-risk"
              />
              <RiskMetricsCard
                title="Monthly Risk Exposure"
                value={metrics.monthlyRisk}
                maxValue={3000}
                status={getRiskStatus(metrics.monthlyRisk, 3000)}
                description="Total risk for current month"
                unit="$"
                learnMoreHref="/user-guide#monthly-risk"
              />
              <RiskMetricsCard
                title="Open Positions Risk"
                value={metrics.openPositionsRisk}
                maxValue={500}
                status={getRiskStatus(metrics.openPositionsRisk, 500)}
                description="Total risk from active positions"
                unit="$"
              />
              <RiskMetricsCard
                title="Current Drawdown"
                value={Math.abs(metrics.currentDrawdown)}
                maxValue={20}
                status={getRiskStatus(Math.abs(metrics.currentDrawdown), 20)}
                description="Distance from equity peak"
                unit="%"
                learnMoreHref="/user-guide#current-drawdown"
              />
              <RiskMetricsCard
                title="Value at Risk (95%)"
                value={metrics.varValue}
                maxValue={500}
                status={getRiskStatus(metrics.varValue, 500)}
                description="Maximum expected loss (95% confidence)"
                unit="$"
                learnMoreHref="/user-guide#var"
              />
            </div>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <LeverageStopWidget />
            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <PositionSizeCalculator />
              <StopLossCalculator />
            </div>
            <LeverageCalculator />
          </TabsContent>

          <TabsContent value="drawdown">
            {drawdownData.length > 0 ? (
              <DrawdownChart
                data={drawdownData}
                maxDrawdown={metrics.maxDrawdown}
                currentDrawdown={metrics.currentDrawdown}
              />
            ) : (
              <div className="text-center py-16">
                <TrendingDown className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Trade Data</h3>
                <p className="text-sm text-muted-foreground">
                  Start trading to see your drawdown analysis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
