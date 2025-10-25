import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InsightMetric {
  label: string;
  value: string | number;
  window: string;
}

export interface Insight {
  id: string;
  title: string;
  metric: InsightMetric;
  rule: string;
  action: string;
  confidence: number;
  score: number;
  source: string;
  detailUrl: string;
}

export interface HomeInsightsResponse {
  asOf: string;
  pair: string;
  timeframe: string;
  user_insights: Insight[];
  market_insights: Insight[];
}

export const useHomeInsights = (refreshInterval = 60000) => {
  return useQuery({
    queryKey: ['home-insights'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<HomeInsightsResponse>('ai-insights-home');
      if (error) throw error;
      return data;
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });
};
