import { memo } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface TotalBalanceWidgetProps extends WidgetProps {
  totalBalance: number;
  change24h?: number;
  changePercent24h?: number;
  tradingDays?: number;
}

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('widgets.totalBalance.title')}</p>
        <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <DollarSign className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold tracking-tight gradient-text">
          <BlurredCurrency amount={totalBalance} />
        </div>

        {(change24h !== 0 || changePercent24h !== 0) && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
              }`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-bold">
                {formatPercent(changePercent24h)}
              </span>
            </div>
            <span className={`text-xs font-medium ${isPositive ? 'text-neon-green' : 'text-neon-red'
              }`}>
              {isPositive ? '+' : ''}<BlurredCurrency amount={change24h} className="inline" />
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{tradingDays}d</span>
          </div>
        )}
      </div>
    </div>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
