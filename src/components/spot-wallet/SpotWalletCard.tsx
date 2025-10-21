import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatNumber';
import { useThemeMode } from '@/hooks/useThemeMode';

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
  const { colors } = useThemeMode();
  const isPositive = change24h >= 0;

  return (
    <Card 
      className="glass-card border-border/50 cursor-pointer hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10"
      onClick={() => navigate('/spot-wallet')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Spot Wallet Value</CardTitle>
        <div className="p-2 rounded-lg glass-subtle">
          <Wallet className="h-4 w-4 text-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        
        <div className="flex items-center gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4" style={{ color: colors.positive }} />
          ) : (
            <TrendingDown className="h-4 w-4" style={{ color: colors.negative }} />
          )}
          <span style={{ color: isPositive ? colors.positive : colors.negative }}>
            {isPositive ? '+' : ''}{changePercent24h.toFixed(2)}% (24h)
          </span>
        </div>

        {tokenCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {tokenCount} token{tokenCount !== 1 ? 's' : ''} tracked
            </p>
            {bestPerformer && (
              <p className="text-xs mt-1" style={{ color: colors.positive }}>
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
