import { useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Trade } from '@/types/trade';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import { calculateTradePnL } from '@/utils/pnl';

interface BrokerComparisonProps {
  trades: Trade[];
}

export const BrokerComparison = ({ trades }: BrokerComparisonProps) => {
  const brokerStats = useMemo(() => {
    const brokerMap: Record<string, {
      trades: Trade[];
      totalFees: number;
      avgSlippage: number;
      avgExecutionTime: number;
      winRate: number;
      totalPnL: number;
    }> = {};

    trades.forEach(trade => {
      const broker = trade.broker || 'Unknown';
      if (!brokerMap[broker]) {
        brokerMap[broker] = {
          trades: [],
          totalFees: 0,
          avgSlippage: 0,
          avgExecutionTime: 0,
          winRate: 0,
          totalPnL: 0,
        };
      }

      const stats = brokerMap[broker];
      stats.trades.push(trade);
      stats.totalFees += (trade.trading_fee || 0) + (trade.funding_fee || 0);
      stats.totalPnL += calculateTradePnL(trade, { includeFees: true });
    });

    return Object.entries(brokerMap).map(([broker, stats]) => {
      const winningTrades = stats.trades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
      return {
        broker,
        tradeCount: stats.trades.length,
        totalFees: stats.totalFees,
        avgFeePerTrade: stats.totalFees / stats.trades.length,
        winRate: (winningTrades.length / stats.trades.length) * 100,
        totalPnL: stats.totalPnL,
        avgPnL: stats.totalPnL / stats.trades.length,
        feeImpact: stats.totalFees / Math.abs(stats.totalPnL) * 100,
      };
    }).sort((a, b) => b.tradeCount - a.tradeCount);
  }, [trades]);

  const bestBroker = useMemo(() => {
    if (brokerStats.length === 0) return null;
    return brokerStats.reduce((best, current) => {
      const currentScore = current.winRate * 0.4 + (100 - current.feeImpact) * 0.6;
      const bestScore = best.winRate * 0.4 + (100 - best.feeImpact) * 0.6;
      return currentScore > bestScore ? current : best;
    });
  }, [brokerStats]);

  return (
    <div className="space-y-6">
      {bestBroker && (
        <PremiumCard className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Recommended Broker</div>
              <div className="text-2xl font-bold mb-2">{bestBroker.broker}</div>
              <div className="text-sm text-muted-foreground">
                Best overall performance based on fees and win rate
              </div>
            </div>
            <Badge variant="default" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Choice
            </Badge>
          </div>
        </PremiumCard>
      )}

      <PremiumCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Broker Performance Comparison</h3>

        {brokerStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No broker data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broker</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Avg P&L</TableHead>
                  <TableHead className="text-right">Total Fees</TableHead>
                  <TableHead className="text-right">Avg Fee</TableHead>
                  <TableHead className="text-right">Fee Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokerStats.map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {stat.broker}
                      {stat.broker === bestBroker?.broker && (
                        <Badge variant="outline" className="ml-2 gap-1">
                          <Zap className="h-3 w-3" />
                          Best
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{stat.tradeCount}</TableCell>
                    <TableCell className="text-right">
                      <span className={stat.winRate >= 50 ? 'text-success' : 'text-muted-foreground'}>
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={stat.avgPnL >= 0 ? 'text-success' : 'text-destructive'}>
                        ${stat.avgPnL.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      ${stat.totalFees.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${stat.avgFeePerTrade.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stat.feeImpact < 5 ? 'default' : stat.feeImpact < 10 ? 'secondary' : 'destructive'}>
                        {stat.feeImpact.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PremiumCard>

      <PremiumCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Fees Paid</span>
            </div>
            <div className="text-2xl font-bold text-destructive">
              ${brokerStats.reduce((sum, s) => sum + s.totalFees, 0).toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Avg Fee Per Trade</span>
            </div>
            <div className="text-2xl font-bold">
              ${(brokerStats.reduce((sum, s) => sum + s.avgFeePerTrade, 0) / brokerStats.length).toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Best Fee Impact</span>
            </div>
            <div className="text-2xl font-bold text-success">
              {Math.min(...brokerStats.map(s => s.feeImpact)).toFixed(1)}%
            </div>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
};
