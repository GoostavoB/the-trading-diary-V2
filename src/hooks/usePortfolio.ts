import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTokenPrices } from './useTokenPrices';
import { calculatePortfolioValue, findTopPerformers, type PortfolioHolding } from '@/utils/portfolioPerformance';
import type { TimeRange } from '@/utils/timeframeReturns';

/**
 * Enhanced portfolio data hook with comprehensive metrics
 */
export const usePortfolio = (range: TimeRange = '1M') => {
  // Fetch holdings
  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['spot_holdings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spot_holdings')
        .select('*')
        .order('token_symbol');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['spot_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spot_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch portfolio settings
  const { data: settings } = useQuery({
    queryKey: ['portfolio_settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('portfolio_settings')
          .insert({
            user_id: user.id,
            base_currency: 'USD',
            cost_method: 'FIFO',
            blur_sensitive: false,
            category_split_mode: false,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
  });

  // Fetch realized P&L
  const { data: realizedPnL } = useQuery({
    queryKey: ['realized_pnl', range],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('realized_pnl')
        .select('*')
        .eq('user_id', user.id)
        .order('realized_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get live prices
  const symbols = holdings?.map(h => h.token_symbol) || [];
  const { prices, loading: pricesLoading } = useTokenPrices(symbols, settings?.base_currency || 'usd');

  // Calculate portfolio metrics
  const portfolioHoldings: PortfolioHolding[] = holdings?.map(h => ({
    symbol: h.token_symbol,
    quantity: h.quantity,
    cost_basis: h.quantity * (h.purchase_price || 0),
    current_price: prices[h.token_symbol]?.price || h.purchase_price || 0,
  })) || [];

  const metrics = calculatePortfolioValue(portfolioHoldings);
  
  // Add realized P&L to metrics
  const totalRealizedPnL = realizedPnL?.reduce((sum, pnl) => sum + (pnl.realized_pnl || 0), 0) || 0;
  const enhancedMetrics = {
    ...metrics,
    realized_pnl: totalRealizedPnL,
    total_pnl: metrics.unrealized_pnl + totalRealizedPnL,
    total_roi: metrics.total_cost_basis > 0 
      ? ((metrics.unrealized_pnl + totalRealizedPnL) / metrics.total_cost_basis) * 100 
      : 0,
  };

  // Find best and worst performers
  const { best, worst } = findTopPerformers(portfolioHoldings, 3);

  const isLoading = holdingsLoading || transactionsLoading || pricesLoading;

  return {
    holdings,
    transactions,
    settings,
    realizedPnL,
    prices,
    metrics: enhancedMetrics,
    bestPerformers: best,
    worstPerformers: worst,
    isLoading,
    baseCurrency: settings?.base_currency || 'USD',
    costMethod: settings?.cost_method || 'FIFO',
  };
};
