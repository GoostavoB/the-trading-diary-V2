import { memo, useMemo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercent } from "@/utils/formatNumber";
import { Trade } from "@/types/trade";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { TokenIcon } from "@/components/TokenIcon";
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AssetMover {
  symbol: string;
  pnl: number;
  change: number;
  trades: number;
}

interface TopMoversCardProps {
  trades: Trade[];
  className?: string;
}

const TopMoversCardComponent = ({ trades, className }: TopMoversCardProps) => {
  const { openWithPrompt } = useAIAssistant();
  const { convertAmount, formatAmount } = useCurrency();
  
  const topMovers = useMemo(() => {
    // Add defensive check for trades
    if (!trades || trades.length === 0) return [];
    
    // Calculate top movers by total P&L
    const assetData: Record<string, AssetMover> = {};
    
    trades.forEach(trade => {
      const symbol = trade.symbol || 'Unknown';
      if (!assetData[symbol]) {
        assetData[symbol] = { symbol, pnl: 0, change: 0, trades: 0 };
      }
      assetData[symbol].pnl += trade.profit_loss || 0;
      assetData[symbol].trades += 1;
    });

    // Calculate percentage change (simplified)
    Object.values(assetData).forEach(asset => {
      asset.change = asset.pnl / (asset.trades * 100) * 100;
    });

    return Object.values(assetData)
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 5);
  }, [trades]);

  return (
    <GlassCard className={className} role="region" aria-labelledby="top-movers-title">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h3 id="top-movers-title" className="text-lg font-semibold">Top Movers</h3>
          <ExplainMetricButton 
            metricName="Top Movers"
            metricValue={`${topMovers.length} assets`}
            context={topMovers.length > 0 ? `Biggest mover: ${topMovers[0].symbol} at ${formatAmount(topMovers[0].pnl)}` : ''}
            onExplain={openWithPrompt}
          />
        </div>
        
        <ul className="space-y-2" role="list">
          {topMovers.length > 0 ? (
            topMovers.map((asset) => {
              const isPositive = asset.pnl >= 0;
              return (
                <li 
                  key={asset.symbol} 
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  role="listitem"
                  aria-label={`${asset.symbol}: ${formatAmount(asset.pnl)}, ${isPositive ? 'up' : 'down'} ${formatPercent(Math.abs(asset.change))}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isPositive ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}
                      aria-hidden="true"
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-primary" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-secondary" />
                      )}
                    </div>
                    <TokenIcon symbol={asset.symbol} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{asset.trades} trades</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm whitespace-nowrap ${
                      isPositive ? 'text-primary' : 'text-secondary'
                    }`}>
                      <BlurredCurrency amount={asset.pnl} />
                    </p>
                    <p className={`text-xs whitespace-nowrap ${
                      isPositive ? 'text-primary/70' : 'text-secondary/70'
                    }`}>
                      {isPositive ? '+' : ''}{formatPercent(asset.change)}
                    </p>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-muted-foreground text-center py-4" role="status">
              No data available
            </li>
          )}
        </ul>
      </div>
    </GlassCard>
  );
};

export const TopMoversCard = memo(TopMoversCardComponent);
