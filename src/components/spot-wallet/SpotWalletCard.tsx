import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatNumber';

interface SpotWalletCardProps {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  tokenCount: number;
  bestPerformer?: {
    symbol: string;
    changePercent: number;
  } | null;
}

export const SpotWalletCard = ({
  totalValue,
  change24h,
  changePercent24h,
  tokenCount,
  bestPerformer,
}: SpotWalletCardProps) => {
  const navigate = useNavigate();
  const isPositive = change24h >= 0;

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/5 transition-colors"
      onClick={() => navigate('/spot-wallet')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Spot Wallet Value</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        
        <div className="flex items-center gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-neon-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-neon-red" />
          )}
          <span className={isPositive ? 'text-neon-green' : 'text-neon-red'}>
            {isPositive ? '+' : ''}{changePercent24h.toFixed(2)}% (24h)
          </span>
        </div>

        {tokenCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {tokenCount} token{tokenCount !== 1 ? 's' : ''} tracked
            </p>
            {bestPerformer && (
              <p className="text-xs text-neon-green mt-1">
                Top: {bestPerformer.symbol} +{bestPerformer.changePercent.toFixed(2)}%
              </p>
            )}
          </div>
        )}

        {tokenCount === 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            No spot assets tracked yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};
