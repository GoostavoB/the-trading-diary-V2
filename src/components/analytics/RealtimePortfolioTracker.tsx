import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAnalytics } from '@/hooks/useWalletAnalytics';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';

export const RealtimePortfolioTracker = () => {
  const { holdings } = useSpotWallet();
  const symbols = holdings.map(h => h.token_symbol);
  const { prices } = useTokenPrices(symbols);
  const analytics = useWalletAnalytics(holdings, prices);

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Activity className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Live Portfolio Value</div>
              <div className="text-3xl font-bold">${analytics.totalValue.toFixed(2)}</div>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">24h Change</div>
            <div className={`text-xl font-bold flex items-center gap-2 ${analytics.totalChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {analytics.totalChange24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${Math.abs(analytics.totalChange24h).toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">24h Change %</div>
            <div className={`text-xl font-bold ${analytics.totalChangePercent24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {analytics.totalChangePercent24h >= 0 ? '+' : ''}{analytics.totalChangePercent24h.toFixed(2)}%
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">Unrealized P&L</div>
            <div className={`text-xl font-bold ${analytics.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
              ${analytics.unrealizedPnL.toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
            <div className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ${analytics.totalInvested.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.bestPerformer && (
          <Card className="p-6 bg-success/5 border-success/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Best Performer (24h)
            </h3>
            <div>
              <div className="text-2xl font-bold mb-1">{analytics.bestPerformer.symbol}</div>
              <div className="text-sm text-muted-foreground mb-3">{analytics.bestPerformer.name}</div>
              <div className="flex items-center justify-between">
                <span className="text-success text-xl font-bold">
                  +{analytics.bestPerformer.changePercent.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">
                  ${analytics.bestPerformer.value.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {analytics.worstPerformer && (
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Worst Performer (24h)
            </h3>
            <div>
              <div className="text-2xl font-bold mb-1">{analytics.worstPerformer.symbol}</div>
              <div className="text-sm text-muted-foreground mb-3">{analytics.worstPerformer.name}</div>
              <div className="flex items-center justify-between">
                <span className="text-destructive text-xl font-bold">
                  {analytics.worstPerformer.changePercent.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">
                  ${analytics.worstPerformer.value.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
        <div className="space-y-3">
          {analytics.allocation.slice(0, 5).map((asset, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{asset.symbol}</span>
                  <span className="text-sm text-muted-foreground">{asset.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${asset.percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${asset.value.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{asset.quantity.toFixed(4)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {recentTrades && recentTrades.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <div className="font-medium">{trade.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(trade.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
                    {trade.side}
                  </Badge>
                  <div className={`text-sm font-semibold mt-1 ${(trade.profit_loss || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {(trade.profit_loss || 0) >= 0 ? '+' : ''}${(trade.profit_loss || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
