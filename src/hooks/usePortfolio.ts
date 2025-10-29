import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTokenPrices } from './useTokenPrices';
import { calculatePortfolioValue, findTopPerformers, calculatePortfolioSeries, type PortfolioHolding } from '@/utils/portfolioPerformance';
import type { TimeRange } from '@/utils/timeframeReturns';
import { getStartDateForRange } from '@/utils/timeframeReturns';

/**
 * Enhanced portfolio data hook with comprehensive metrics
 */
export const usePortfolio = (range: TimeRange = '1M') => {
  // Fetch holdings with category data from assets table
  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['spot_holdings'],
    queryFn: async () => {
      try {
        const { data: holdingsData, error } = await supabase
          .from('spot_holdings')
          .select('*')
          .order('token_symbol');
        
        if (error) {
          console.warn('usePortfolio: holdings fetch error', error);
          return [] as any[];
        }
        
        // Fetch asset metadata for each holding (tolerate missing assets)
        const enrichedHoldings = await Promise.all(
          (holdingsData || []).map(async (holding) => {
            const { data: assetData } = await supabase
              .from('assets')
              .select('primary_category, categories_json, coingecko_id')
              .eq('symbol', holding.token_symbol)
              .maybeSingle();
            
            return {
              ...holding,
              primary_category: assetData?.primary_category,
              categories_json: assetData?.categories_json,
              coingecko_id: assetData?.coingecko_id,
            };
          })
        );
        
        return enrichedHoldings;
      } catch (e) {
        console.warn('usePortfolio: unexpected holdings error', e);
        return [] as any[];
      }
    },
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['spot_transactions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('spot_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
        
        if (error) {
          console.warn('usePortfolio: transactions fetch error', error);
          return [] as any[];
        }
        return data || [];
      } catch (e) {
        console.warn('usePortfolio: unexpected transactions error', e);
        return [] as any[];
      }
    },
  });

  // Fetch portfolio settings
  const { data: settings } = useQuery({
    queryKey: ['portfolio_settings'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
  
        const { data, error } = await supabase
          .from('portfolio_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.warn('usePortfolio: settings fetch error', error);
          return null;
        }
        
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
          
          if (insertError) {
            console.warn('usePortfolio: settings insert error', insertError);
            return null;
          }
          return newSettings;
        }
        
        return data;
      } catch (e) {
        console.warn('usePortfolio: unexpected settings error', e);
        return null;
      }
    },
  });

  // Fetch realized P&L
  const { data: realizedPnL } = useQuery({
    queryKey: ['realized_pnl', range],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [] as any[];
  
        const { data, error } = await supabase
          .from('realized_pnl')
          .select('*')
          .eq('user_id', user.id)
          .order('realized_date', { ascending: false });
        
        if (error) {
          console.warn('usePortfolio: realized_pnl fetch error', error);
          return [] as any[];
        }
        return data || [];
      } catch (e) {
        console.warn('usePortfolio: unexpected realized_pnl error', e);
        return [] as any[];
      }
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

  // Generate portfolio timeseries data
  const startDate = getStartDateForRange(range);
  const endDate = new Date();
  
  // Create price history map from current prices (simplified - would need historical data)
  const priceHistory = new Map<string, Array<{ date: Date; price: number }>>();
  portfolioHoldings.forEach(holding => {
    priceHistory.set(holding.symbol, [
      { date: startDate, price: holding.cost_basis / holding.quantity }, // Start at cost basis
      { date: endDate, price: holding.current_price } // End at current price
    ]);
  });
  
  const timeseriesData = calculatePortfolioSeries(startDate, endDate, portfolioHoldings, priceHistory);
  
  // Extract deposits and withdrawals from transactions
  const deposits = transactions?.filter(tx => 
    tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in'
  ).map(tx => ({
    date: new Date(tx.transaction_date),
    amount: tx.total_value
  })) || [];
  
  const withdrawals = transactions?.filter(tx => 
    tx.transaction_type === 'withdrawal' || tx.transaction_type === 'transfer_out'
  ).map(tx => ({
    date: new Date(tx.transaction_date),
    amount: tx.total_value
  })) || [];

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
    timeseriesData,
    deposits,
    withdrawals,
    isLoading,
    baseCurrency: settings?.base_currency || 'USD',
    costMethod: settings?.cost_method || 'FIFO',
  };
};
