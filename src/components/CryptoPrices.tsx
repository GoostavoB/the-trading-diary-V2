import { useCryptoPrice } from '@/hooks/useCryptoPrice';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface CryptoPricesProps {
  className?: string;
  symbols?: string[];
}

export const CryptoPrices = ({ className = '', symbols }: CryptoPricesProps) => {
  const { prices, loading, error } = useCryptoPrice(symbols);

  if (loading) {
    return (
      <Card className={`p-4 bg-card/50 border-border ${className}`}>
        <p className="text-sm text-muted-foreground">Loading prices...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 bg-card/50 border-border ${className}`}>
        <p className="text-sm text-neon-red">{error}</p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-card/50 border-border ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="text-neon-green" size={20} />
        <h3 className="text-sm font-semibold">Live Prices (Binance)</h3>
      </div>
      <div className="flex flex-wrap gap-4">
        {prices.map((price) => (
          <div key={price.symbol} className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {price.displaySymbol}:
            </span>
            <span className="text-sm font-mono text-neon-green">
              ${price.price}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
