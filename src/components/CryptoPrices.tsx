import { useCryptoPrice } from '@/hooks/useCryptoPrice';
import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CryptoPricesProps {
  className?: string;
  symbols?: string[];
}

const cryptoColors: Record<string, string> = {
  'BTC': 'orange',
  'ETH': 'slate',
  'BNB': 'yellow',
  'SOL': 'purple',
  'XRP': 'gray',
  'ADA': 'blue',
};

export const CryptoPrices = ({ className = '', symbols }: CryptoPricesProps) => {
  const { prices, loading, error } = useCryptoPrice(symbols);
  const [neonIntensity, setNeonIntensity] = useState(50);

  useEffect(() => {
    const saved = localStorage.getItem('crypto-neon-intensity');
    if (saved) setNeonIntensity(parseInt(saved));
  }, []);

  const handleIntensityChange = (value: number) => {
    setNeonIntensity(value);
    localStorage.setItem('crypto-neon-intensity', value.toString());
  };

  // Calculate opacity based on intensity (0-100 -> 0.3-1.0)
  const getOpacity = (baseOpacity: number) => {
    return baseOpacity * (0.3 + (neonIntensity / 100) * 0.7);
  };

  const getTickerColor = (symbol: string) => {
    const colorBase = cryptoColors[symbol] || 'gray';
    const opacity = getOpacity(0.8);
    return `text-${colorBase}-400`;
  };

  const getPriceColor = (isPositive: boolean) => {
    const opacity = getOpacity(0.7);
    return isPositive ? 'text-emerald-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-card/30 backdrop-blur-sm border-b border-border ${className}`}>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Loading prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show error bar at top
  }

  return (
    <div className={`bg-card/30 backdrop-blur-sm border-b border-border ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left side - Ticker prices */}
          <div className="flex items-center gap-6 flex-wrap flex-1">
            <div className="flex items-center gap-3 flex-shrink-0">
              <TrendingUp className="text-emerald-500" size={24} style={{ opacity: getOpacity(0.6) }} />
              <span className="text-base font-semibold text-muted-foreground">LIVE (24h):</span>
            </div>
            {prices.map((price) => {
              const isPositive = price.priceChangePercent >= 0;
              const priceColor = getPriceColor(isPositive);
              const changeSign = isPositive ? '+' : '';
              return (
                <div key={price.symbol} className="flex items-center gap-2 flex-shrink-0">
                  <span 
                    className={`text-base font-semibold ${getTickerColor(price.displaySymbol)}`}
                    style={{ opacity: getOpacity(0.8) }}
                  >
                    {price.displaySymbol}
                  </span>
                  <span 
                    className={`text-base font-mono ${priceColor}`}
                    style={{ opacity: getOpacity(0.7) }}
                  >
                    ${price.price}
                  </span>
                  <span 
                    className={`text-xs font-mono ${priceColor}`}
                    style={{ opacity: getOpacity(0.5) }}
                  >
                    ({changeSign}{price.priceChangePercent.toFixed(2)}%)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right side - Neon intensity slider */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Neon:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="range"
                min="0"
                max="100"
                value={neonIntensity}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary 
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
              />
              <span className="text-xs text-muted-foreground">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
