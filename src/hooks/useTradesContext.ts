import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Trade } from '@/types/trade';

export interface TradesContext {
  totalTrades: number;
  winRate: number;
  avgRoi: number;
  totalPnL: number;
  uniqueSetups: string[];
  uniqueSymbols: string[];
  uniqueBrokers: string[];
  dateRange: { first: string; last: string } | null;
  favoriteSetup: string | null;
  bestSetup: string | null;
  worstSetup: string | null;
  hasEmotionalTags: boolean;
  avgTradeDuration: number | null;
  longVsShort: { long: number; short: number };
}

export const useTradesContext = () => {
  return useQuery({
    queryKey: ['trades-context'],
    queryFn: async (): Promise<TradesContext> => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .is('deleted_at', null)
        .order('trade_date', { ascending: false });

      if (error) throw error;

      if (!trades || trades.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          avgRoi: 0,
          totalPnL: 0,
          uniqueSetups: [],
          uniqueSymbols: [],
          uniqueBrokers: [],
          dateRange: null,
          favoriteSetup: null,
          bestSetup: null,
          worstSetup: null,
          hasEmotionalTags: false,
          avgTradeDuration: null,
          longVsShort: { long: 0, short: 0 },
        };
      }

      const typedTrades = trades as Trade[];
      
      // Calculate stats
      const winningTrades = typedTrades.filter(t => (t.pnl || 0) > 0);
      const winRate = (winningTrades.length / typedTrades.length) * 100;
      
      const totalPnL = typedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgRoi = typedTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / typedTrades.length;
      
      const uniqueSetups = [...new Set(typedTrades.map(t => t.setup).filter(Boolean))] as string[];
      const uniqueSymbols = [...new Set(typedTrades.map(t => t.symbol).filter(Boolean))] as string[];
      const uniqueBrokers = [...new Set(typedTrades.map(t => t.broker).filter(Boolean))] as string[];
      
      const dateRange = {
        first: typedTrades[typedTrades.length - 1]?.trade_date || '',
        last: typedTrades[0]?.trade_date || '',
      };
      
      // Find favorite setup (most used)
      const setupCounts = typedTrades.reduce((acc, t) => {
        if (t.setup) {
          acc[t.setup] = (acc[t.setup] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const favoriteSetup = Object.entries(setupCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      
      // Find best setup (highest avg ROI)
      const setupRois = typedTrades.reduce((acc, t) => {
        if (t.setup) {
          if (!acc[t.setup]) acc[t.setup] = [];
          acc[t.setup].push(t.roi || 0);
        }
        return acc;
      }, {} as Record<string, number[]>);
      const setupAvgRois = Object.entries(setupRois).map(([setup, rois]) => ({
        setup,
        avgRoi: rois.reduce((a, b) => a + b, 0) / rois.length
      }));
      const bestSetup = setupAvgRois.sort((a, b) => b.avgRoi - a.avgRoi)[0]?.setup || null;
      const worstSetup = setupAvgRois.sort((a, b) => a.avgRoi - b.avgRoi)[0]?.setup || null;
      
      const hasEmotionalTags = typedTrades.some(t => t.emotional_tag);
      
      const durationsInMinutes = typedTrades
        .map(t => t.duration_minutes)
        .filter((d): d is number => d !== null && d !== undefined);
      const avgTradeDuration = durationsInMinutes.length > 0
        ? durationsInMinutes.reduce((a, b) => a + b, 0) / durationsInMinutes.length
        : null;
      
      const longTrades = typedTrades.filter(t => t.side?.toLowerCase() === 'long').length;
      const shortTrades = typedTrades.filter(t => t.side?.toLowerCase() === 'short').length;
      
      return {
        totalTrades: typedTrades.length,
        winRate,
        avgRoi,
        totalPnL,
        uniqueSetups,
        uniqueSymbols,
        uniqueBrokers,
        dateRange,
        favoriteSetup,
        bestSetup,
        worstSetup,
        hasEmotionalTags,
        avgTradeDuration,
        longVsShort: { long: longTrades, short: shortTrades },
      };
    },
    staleTime: 30000, // 30 seconds
  });
};
