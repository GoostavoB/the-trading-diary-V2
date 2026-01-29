import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { PremiumTable, PremiumTableRow } from "@/components/ui/PremiumTable";
import { Trade } from "@/types/trade";
import { format } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface RecentTransactionsCardProps {
  trades: Trade[];
  className?: string;
}

export const RecentTransactionsCard = memo(({ trades, className }: RecentTransactionsCardProps) => {
  const { t } = useTranslation();

  // Add defensive check for trades
  const recentTrades = (trades || [])
    .sort((a, b) => new Date(b.opened_at || b.trade_date).getTime() - new Date(a.opened_at || a.trade_date).getTime())
    .slice(0, 5);

  return (
    <GlassCard className={className} role="article" aria-labelledby="recent-transactions-title">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h3 id="recent-transactions-title" className="text-lg font-semibold">{t('widgets.recentTransactions.title')}</h3>
          <a href="/journal" className="text-xs text-primary hover:underline">
            {t('widgets.recentTransactions.viewAll')}
          </a>
        </div>

        <PremiumTable density="compact">
          {recentTrades.length > 0 ? (
            recentTrades.map((trade) => {
              const isWin = (trade.profit_loss || 0) > 0;
              return (
                <PremiumTableRow
                  key={trade.id}
                  density="compact"
                  className="bg-muted/30 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg shrink-0 ${isWin ? 'bg-primary/10' : 'bg-secondary/10'
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
                        {format(new Date(trade.opened_at || trade.trade_date), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm whitespace-nowrap ${isWin ? 'text-primary' : 'text-secondary'
                      }`}>
                      <BlurredCurrency amount={trade.profit_loss || 0} />
                    </p>
                    <Badge
                      variant={trade.side === 'long' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {trade.side || 'N/A'}
                    </Badge>
                  </div>
                </PremiumTableRow>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              {t('widgets.recentTransactions.noTransactions')}
            </div>
          )}
        </PremiumTable>
      </div>
    </GlassCard>
  );
});

RecentTransactionsCard.displayName = 'RecentTransactionsCard';
