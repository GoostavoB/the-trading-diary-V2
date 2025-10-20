import { useState, useEffect } from 'react';

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChange7d?: number;
  priceChangePercentage7d?: number;
  priceChange30d?: number;
  priceChangePercentage30d?: number;
  marketCap?: number;
  volume24h?: number;
  icon?: string;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  LTC: 'litecoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
};

export const useTokenPrices = (symbols: string[], currency: string = 'usd') => {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbols.length) {
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        const ids = symbols
          .map(symbol => SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase())
          .join(',');

        const response = await fetch(
          `${COINGECKO_API}/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d`
        );

        if (!response.ok) throw new Error('Failed to fetch token prices');

        const data = await response.json();
        
        const priceMap: Record<string, TokenPrice> = {};
        
        data.forEach((token: any) => {
          const symbol = token.symbol.toUpperCase();
          priceMap[symbol] = {
            symbol,
            name: token.name,
            price: token.current_price,
            priceChange24h: token.price_change_24h || 0,
            priceChangePercentage24h: token.price_change_percentage_24h || 0,
            priceChangePercentage7d: token.price_change_percentage_7d_in_currency || 0,
            priceChangePercentage30d: token.price_change_percentage_30d_in_currency || 0,
            marketCap: token.market_cap,
            volume24h: token.total_volume,
            icon: token.image,
          };
        });

        setPrices(priceMap);
        setError(null);
      } catch (err) {
        console.error('Token price fetch error:', err);
        setError('Failed to fetch token prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [symbols.join(','), currency]);

  return { prices, loading, error };
};
