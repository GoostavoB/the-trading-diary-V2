import { useCryptoPrice } from '@/hooks/useCryptoPrice';
import { TrendingUp } from 'lucide-react';

interface CryptoPricesProps {
  className?: string;
  symbols?: string[];
}

const cryptoColors: Record<string, string> = {
  'BTC': 'text-orange-400/80',
  'ETH': 'text-slate-300',
  'BNB': 'text-yellow-300/80',
  'SOL': 'text-purple-400/80',
  'XRP': 'text-gray-300',
  'ADA': 'text-blue-400/80',
};

export const CryptoPrices = ({ className = '', symbols }: CryptoPricesProps) => {
  const { prices, loading, error } = useCryptoPrice(symbols);

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
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-shrink-0">
            <TrendingUp className="text-emerald-500/60" size={24} />
            <span className="text-base font-semibold text-muted-foreground">LIVE (24h):</span>
          </div>
          {prices.map((price) => {
            const priceColor = price.priceChangePercent >= 0 ? 'text-emerald-500/70' : 'text-red-500/70';
            const changeSign = price.priceChangePercent >= 0 ? '+' : '';
            return (
              <div key={price.symbol} className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-base font-semibold ${cryptoColors[price.displaySymbol] || 'text-foreground/60'}`}>
                  {price.displaySymbol}
                </span>
                <span className={`text-base font-mono ${priceColor}`}>
                  ${price.price}
                </span>
                <span className={`text-xs font-mono ${priceColor} opacity-70`}>
                  ({changeSign}{price.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
