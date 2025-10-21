import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, TrendingDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExchangeBadge } from '@/components/exchanges/ExchangeBadge';
import { EfficiencyBadge } from '@/components/fee-analysis/EfficiencyBadge';
import { formatCurrency } from '@/utils/formatNumber';
import { aggregateExchangeStats } from '@/utils/feeCalculations';
import { calculateFeeImpactMetrics } from '@/utils/insightCalculations';
import type { Trade } from '@/types/trade';
import { useTranslation } from '@/hooks/useTranslation';

interface CostEfficiencyPanelProps {
  trades: Trade[];
}

export const CostEfficiencyPanel = memo(({ trades }: CostEfficiencyPanelProps) => {
  if (!trades || trades.length === 0) return null;
  
  const { t } = useTranslation();
  const exchangeStats = aggregateExchangeStats(trades);
  const topExchanges = exchangeStats.slice(0, 3);
  const feeMetrics = calculateFeeImpactMetrics(trades);

  if (topExchanges.length === 0) return null;

  const mostEfficient = topExchanges[0];
  const leastEfficient = topExchanges[topExchanges.length - 1];
  const savingsVsWorst = leastEfficient.avgFeePercent - mostEfficient.avgFeePercent;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {t('insights.exchangeCostEfficiency')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('insights.compareTradingCosts')}
            </p>
          </div>
          <Link to="/fee-analysis">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('insights.viewFullAnalysis')}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Exchange Rankings */}
      <div className="space-y-3 mb-6">
        {topExchanges.map((exchange, idx) => (
          <Card 
            key={exchange.broker}
            className="p-4 bg-muted/20 border-border transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant={idx === 0 ? 'default' : 'secondary'} className="font-mono text-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </Badge>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <ExchangeBadge source={exchange.broker} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{exchange.broker}</p>
                    <p className="text-xs text-muted-foreground">
                      {exchange.tradeCount} {t('insights.trades')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono font-bold">
                  {exchange.avgFeePercent.toFixed(3)}%
                </p>
                <div className="flex justify-end">
                  <EfficiencyBadge score={exchange.avgEfficiencyScore} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Metrics */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('insights.totalFeesPaid')}:</span>
            <span className="font-bold text-loss">
              {formatCurrency(feeMetrics.totalFees)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('insights.feeImpactOnPnL')}:</span>
            <span className="font-bold text-yellow-500">
              {feeMetrics.feeImpactOnPnL.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('insights.effectiveFeeRate')}:</span>
            <span className="font-bold font-mono">
              {feeMetrics.effectiveFeeRate.toFixed(3)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Tip */}
      {savingsVsWorst > 0.01 && (
        <div className="mt-4 p-3 rounded-lg bg-profit/10 border border-profit/30">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-profit mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-profit">{t('insights.tip')}:</span> Trading on {mostEfficient.broker} saves you ~{savingsVsWorst.toFixed(3)}% vs {leastEfficient.broker}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
});

CostEfficiencyPanel.displayName = 'CostEfficiencyPanel';
