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
  const defaultData: HomeInsightsResponse = {
    asOf: new Date().toISOString(),
    pair: 'BTCUSDT',
    timeframe: '1h',
    user_insights: [],
    market_insights: [],
  };

  const invokeWithTimeout = async (ms = 2500): Promise<HomeInsightsResponse> => {
    try {
      const timeoutPromise = new Promise<HomeInsightsResponse>((resolve) =>
        setTimeout(() => resolve(defaultData), ms)
      );

      const invokePromise = supabase.functions
        .invoke<HomeInsightsResponse>('ai-insights-home')
        .then(({ data, error }) => {
          if (error || !data) {
            console.error('ai-insights-home error:', error);
            return defaultData;
          }
          return data;
        })
        .catch((err) => {
          console.error('ai-insights-home invoke failed:', err);
          return defaultData;
        });

      return Promise.race([invokePromise, timeoutPromise]);
    } catch (e) {
      console.error('ai-insights-home exception:', e);
      return defaultData;
    }
  };

  return useQuery({
    queryKey: ['home-insights'],
    queryFn: () => invokeWithTimeout(),
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};
