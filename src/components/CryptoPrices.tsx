import { useCryptoPrice } from '@/hooks/useCryptoPrice';
import { TrendingUp } from 'lucide-react';

interface CryptoPricesProps {
  className?: string;
  symbols?: string[];
}

export const CryptoPrices = ({ className = '', symbols }: CryptoPricesProps) => {
  const { prices, loading, error } = useCryptoPrice(symbols);

  if (loading) {
    return (
      <div className={`bg-card/30 backdrop-blur-sm border-b border-border ${className}`}>
        <div className="container mx-auto px-6 py-2">
          <p className="text-xs text-muted-foreground">Loading prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show error bar at top
  }

  return (
    <div className={`bg-card/30 backdrop-blur-sm border-b border-border ${className}`}>
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <TrendingUp className="text-neon-green" size={16} />
            <span className="text-xs font-semibold text-muted-foreground">LIVE:</span>
          </div>
          {prices.map((price) => (
            <div key={price.symbol} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-semibold text-foreground">
                {price.displaySymbol}
              </span>
              <span className="text-xs font-mono text-neon-green">
                ${price.price}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
