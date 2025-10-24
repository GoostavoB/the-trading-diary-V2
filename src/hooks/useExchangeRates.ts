import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRates {
  timestamp: string;
  crypto: {
    bitcoin: { usd: number };
    ethereum: { usd: number };
  };
  fiat: Record<string, number>;
}

interface CachedRates {
  id: string;
  rates: ExchangeRates;
  updated_at: string;
}

/**
 * Hook to fetch real-time exchange rates
 * Updates every 5 minutes from cache, cache refreshes every 10 minutes
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRates> => {
      // First try to get cached rates
      const { data: cached, error } = await supabase
        .from('exchange_rates_cache')
        .select('*')
        .eq('id', 'latest')
        .maybeSingle();

      // If cache exists and is less than 10 minutes old, use it
      if (cached && !error) {
        const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
        const tenMinutes = 10 * 60 * 1000;
        
        if (cacheAge < tenMinutes) {
          console.log('Using cached exchange rates');
          return cached.rates as unknown as ExchangeRates;
        }
      }

      // Cache is stale or doesn't exist, fetch fresh data
      console.log('Fetching fresh exchange rates...');
      const { data, error: fetchError } = await supabase.functions.invoke<{ success: boolean; data: ExchangeRates }>('fetch-exchange-rates');

      if (fetchError) {
        console.error('Error fetching exchange rates:', fetchError);
        // Return cached data if available, even if stale
        if (cached) {
          console.log('Using stale cache due to fetch error');
          return cached.rates as unknown as ExchangeRates;
        }
        throw fetchError;
      }

      if (!data?.data) {
        throw new Error('Invalid response from exchange rates API');
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
  });
}
