import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PositionSizeCalculator } from "@/components/risk/PositionSizeCalculator";
import { StopLossCalculator } from "@/components/risk/StopLossCalculator";
import { LeverageCalculator } from "@/components/risk/LeverageCalculator";
import { DrawdownChart } from "@/components/risk/DrawdownChart";
import { LeverageStopWidget } from "@/components/leverage-stop/LeverageStopWidget";
import { LeverageTableModal } from "@/components/risk/LeverageTableModal";
import { RiskOverview } from "@/components/risk/RiskOverview";
import { useRiskCopilot } from "@/hooks/useRiskCopilot";
import { curvaDeCapital } from "@/lib/riskInsights";
import { BlurToggleButton } from "@/components/ui/BlurToggleButton";
import { Shield, Calculator, TrendingDown, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { pageMeta } from "@/utils/seoHelpers";

export default function RiskManagement() {
  const { user } = useAuth();
  const rc = useRiskCopilot();

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

  // A antiga aba Overview vivia daqui: um useEffect que montava a curva de
  // equity a partir de $10.000 fixos, e um calculateRiskMetrics com exposicao
  // diaria = media das perdas x 0,5, semanal = diaria x 3, mensal = diaria x 12
  // e "Open Positions Risk" = a constante 250. O proprio arquivo dizia
  // "Simulated calculations (in production, these would be more sophisticated)".
  //
  // Nada daquilo vinha dos dados do usuario, entao foi apagado em vez de
  // corrigido. O que substitui esta em lib/riskInsights.ts, coberto por teste,
  // e a regra la e: sem dado, a tela diz que nao sabe.

  const { data: aportes = [] } = useQuery({
    queryKey: ['risk-capital-log', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('capital_log')
        .select('log_date, amount_added')
        .order('log_date', { ascending: true });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Curva sobre o capital REAL, com aportes na data em que entraram.
  const curva = useMemo(
    () => (trades?.length ? curvaDeCapital(trades as never, aportes as never) : []),
    [trades, aportes],
  );

  return (
    <>
      <SEO
        title={pageMeta.riskManagement.title}
        description={pageMeta.riskManagement.description}
        keywords={pageMeta.riskManagement.keywords}
        canonical={pageMeta.riskManagement.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-space-200" />
            <div className="space-y-2">
              <h1 className="font-display text-3xl md:text-4xl text-gradient-electric-soft">Risk Management</h1>
              <p className="text-sm text-space-300">Monitor and control your trading risk exposure</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LeverageTableModal />
            <BlurToggleButton />
          </div>
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
            <RiskOverview />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <LeverageStopWidget />
            {/* Chegam preenchidas com o capital e o risco reais. Antes as tres
                pediam "Account Size" com placeholder 10000, e o usuario digitava
                na mao um numero que o app ja conhecia. */}
            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <PositionSizeCalculator capitalReal={rc.capitalBase} riscoPadraoPct={rc.authorizedStopPct} />
              <StopLossCalculator capitalReal={rc.capitalBase} riscoPadraoPct={rc.authorizedStopPct} />
            </div>
            <LeverageCalculator capitalReal={rc.capitalBase} riscoPadraoPct={rc.authorizedStopPct} />
          </TabsContent>

          <TabsContent value="drawdown">
            {curva.length > 0 ? (
              <DrawdownChart
                data={curva.map((p) => ({
                  date: p.data,
                  equity: p.capital,
                  peak: p.pico,
                  drawdown: p.quedaPct,
                }))}
                maxDrawdown={curva.reduce((pior, p) => Math.min(pior, p.quedaPct), 0)}
                currentDrawdown={curva[curva.length - 1].quedaPct}
              />
            ) : (
              <div className="text-center py-16 card-premium rounded-ios-card">
                <TrendingDown className="h-16 w-16 mx-auto mb-4 text-space-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-space-100">No Trade Data</h3>
                <p className="text-sm text-space-300">
                  Start trading to see your drawdown analysis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
    </>
  );
}
