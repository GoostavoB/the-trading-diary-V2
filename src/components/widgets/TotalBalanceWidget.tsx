import { memo } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface TotalBalanceWidgetProps extends WidgetProps {
  totalBalance: number;
  change24h?: number;
  changePercent24h?: number;
}

export const TotalBalanceWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  totalBalance,
  change24h = 0,
  changePercent24h = 0,
}: TotalBalanceWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = change24h >= 0;

  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{t('widgets.totalBalance.title')}</p>
          <div className="p-2 rounded-xl bg-primary/10">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold tracking-tight">
            <BlurredCurrency amount={totalBalance} />
          </div>
          
          {(change24h !== 0 || changePercent24h !== 0) && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-neon-green" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-neon-red" />
              )}
              <span className={`text-sm font-semibold ${
                isPositive ? 'text-neon-green' : 'text-neon-red'
              }`}>
                {isPositive ? '+' : ''}<BlurredCurrency amount={change24h} className="inline" /> ({formatPercent(changePercent24h)})
              </span>
              <span className="text-xs text-muted-foreground">24h</span>
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
