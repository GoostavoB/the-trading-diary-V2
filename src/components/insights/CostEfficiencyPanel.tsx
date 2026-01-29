import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExchangeBadge } from '@/components/exchanges/ExchangeBadge';
import { formatCurrency } from '@/utils/formatNumber';
import { aggregateExchangeStats } from '@/utils/feeCalculations';
import { calculateFeeImpactMetrics } from '@/utils/insightCalculations';
import type { Trade } from '@/types/trade';
import { useTranslation } from '@/hooks/useTranslation';

interface CostEfficiencyPanelProps {
  trades: Trade[];
}

export const CostEfficiencyPanel = memo(({ trades }: CostEfficiencyPanelProps) => {
  const { t } = useTranslation();

  if (!trades || trades.length === 0) return null;

  const exchangeStats = aggregateExchangeStats(trades);
  const topExchanges = exchangeStats.slice(0, 3);
  const feeMetrics = calculateFeeImpactMetrics(trades);

  if (topExchanges.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <PremiumCard className="h-full bg-card border-border flex flex-col">
      <div className="p-3 flex flex-col h-full">
        {/* Compact header with link */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('insights.exchangeCostEfficiency')}</h3>
          </div>
          <Link to="/fee-analysis">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
              {t('insights.viewFullAnalysis')}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Horizontal exchange row */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {topExchanges.map((exchange, idx) => (
            <div
              key={exchange.broker}
              className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center text-center"
            >
              <span className="text-lg mb-1">{medals[idx]}</span>
              <div className="mb-1">
                <ExchangeBadge source={exchange.broker} />
              </div>
              <span className="text-sm font-bold font-mono">{exchange.avgFeePercent.toFixed(3)}%</span>
              <span className="text-[10px] text-muted-foreground">({exchange.tradeCount})</span>
            </div>
          ))}
        </div>

        {/* Summary metrics in single row */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 mt-auto">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">{t('insights.totalFeesPaid')}</span>
            <span className="text-xs font-bold text-loss">{formatCurrency(feeMetrics.totalFees)}</span>
          </div>
          <div className="text-center border-x border-border/50">
            <span className="text-[10px] text-muted-foreground block">{t('insights.feeImpactOnPnL')}</span>
            <span className="text-xs font-bold text-yellow-500">{feeMetrics.feeImpactOnPnL.toFixed(2)}%</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">{t('insights.effectiveFeeRate')}</span>
            <span className="text-xs font-bold font-mono">{feeMetrics.effectiveFeeRate.toFixed(3)}%</span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

CostEfficiencyPanel.displayName = 'CostEfficiencyPanel';
