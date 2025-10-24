import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/types/trade";
import { format } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useTranslation } from '@/hooks/useTranslation';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { useCurrency } from '@/contexts/CurrencyContext';

interface RecentTransactionsCardProps {
  trades: Trade[];
  className?: string;
}

export const RecentTransactionsCard = memo(({ trades, className }: RecentTransactionsCardProps) => {
  const { t } = useTranslation();
  const { openWithPrompt } = useAIAssistant();
  const { convertAmount, formatAmount } = useCurrency();
  const recentTrades = trades
    .sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime())
    .slice(0, 5);

  return (
    <GlassCard className={className} role="article" aria-labelledby="recent-transactions-title">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h3 id="recent-transactions-title" className="text-lg font-semibold">{t('widgets.recentTransactions.title')}</h3>
          <div className="flex items-center gap-2">
            <ExplainMetricButton 
              metricName="Recent Transactions"
              metricValue={`${recentTrades.length} trades`}
              context={recentTrades.length > 0 ? `Latest: ${recentTrades[0].symbol} (${formatAmount(recentTrades[0].pnl || 0)})` : ''}
              onExplain={openWithPrompt}
            />
            <a href="/dashboard" className="text-xs text-primary hover:underline">
              {t('widgets.recentTransactions.viewAll')}
            </a>
          </div>
        </div>
        
        <ul className="space-y-2" role="list" aria-label="Recent trading activity">
          {recentTrades.length > 0 ? (
            recentTrades.map((trade) => {
              const isWin = (trade.pnl || 0) > 0;
              return (
                <li 
                  key={trade.id} 
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isWin ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      {isWin ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{trade.symbol || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(trade.trade_date), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm whitespace-nowrap ${
                      isWin ? 'text-primary' : 'text-secondary'
                    }`}>
                      <BlurredCurrency amount={trade.pnl || 0} />
                    </p>
                    <Badge 
                      variant={trade.side === 'long' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {trade.side || 'N/A'}
                    </Badge>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-muted-foreground text-center py-4">
              {t('widgets.recentTransactions.noTransactions')}
            </li>
          )}
        </ul>
      </div>
    </GlassCard>
  );
});

RecentTransactionsCard.displayName = 'RecentTransactionsCard';
