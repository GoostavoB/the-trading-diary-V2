import { memo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { cn } from '@/lib/utils';

interface TotalBalanceWidgetProps extends WidgetProps {
  totalBalance: number;
  change24h?: number;
  changePercent24h?: number;
  tradingDays?: number;
}

/**
 * Total Balance Widget - Compact responsive design
 */
export const TotalBalanceWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  totalBalance,
  change24h = 0,
  changePercent24h = 0,
  tradingDays = 0,
}: TotalBalanceWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = change24h >= 0;

  return (
    <div className="flex flex-col h-full p-3 gap-2 justify-center">
      {/* Header Row */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Wallet className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
          {t('widgets.totalBalance.title')}
        </span>
      </div>

      {/* Main Balance Value */}
      <div className="flex-1 flex items-center min-h-0">
        <BlurredCurrency 
          amount={totalBalance} 
          className="text-2xl font-bold tracking-tight text-foreground truncate" 
        />
      </div>

      {/* P&L Change Row */}
      {(change24h !== 0 || changePercent24h !== 0) && (
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
            isPositive 
              ? "bg-neon-green/10 text-neon-green" 
              : "bg-neon-red/10 text-neon-red"
          )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="tabular-nums">
              {isPositive ? '+' : ''}{formatPercent(changePercent24h)}
            </span>
          </div>
          <BlurredCurrency 
            amount={Math.abs(change24h)} 
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-neon-green" : "text-neon-red"
            )}
          />
        </div>
      )}

      {/* Trading days indicator */}
      {tradingDays > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Sparkles className="h-3 w-3 text-primary/60" />
          <span>{tradingDays} trading days</span>
        </div>
      )}
    </div>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
