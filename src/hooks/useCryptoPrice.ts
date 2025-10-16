import { useState, useEffect } from 'react';

interface CryptoPrice {
  symbol: string;
  price: string;
  displaySymbol: string;
}

export const useCryptoPrice = (symbols: string[] = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'TRXUSDT', 'TONUSDT', 'ADAUSDT', 'AVAXUSDT'
]) => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const promises = symbols.map(async (symbol) => {
          const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          if (!response.ok) throw new Error('Failed to fetch price');
          const data = await response.json();
          return {
            symbol: data.symbol,
            price: parseFloat(data.price).toFixed(2),
            displaySymbol: symbol.replace('USDT', '')
          };
        });

        const results = await Promise.all(promises);
        setPrices(results);
        setError(null);
      } catch (err) {
        setError('Failed to fetch crypto prices');
        console.error('Crypto price fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return { prices, loading, error };
};
