import { memo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col h-full min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-auto">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {t('widgets.totalBalance.title')}
          </span>
        </div>
      </div>

      {/* Main Balance - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
          <BlurredCurrency amount={totalBalance} className="text-5xl md:text-6xl font-black" />
        </div>
        
        {/* Change Info - Below Balance */}
        {(change24h !== 0 || changePercent24h !== 0) && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {/* Percentage Badge */}
            <div 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm transition-all",
                isPositive 
                  ? 'bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30' 
                  : 'bg-neon-red/15 text-neon-red ring-1 ring-neon-red/30'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-bold">
                {formatPercent(changePercent24h)}
              </span>
            </div>
            
            {/* Amount Change */}
            <div className={cn(
              "text-lg font-bold",
              isPositive ? 'text-neon-green' : 'text-neon-red'
            )}>
              {isPositive ? '+' : ''}<BlurredCurrency amount={change24h} className="text-lg font-bold inline" />
            </div>
          </div>
        )}
      </div>

      {/* Footer - Period indicator */}
      {tradingDays > 0 && (
        <div className="flex items-center justify-center pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary/60" />
            <span>Last <span className="font-semibold text-foreground">{tradingDays}</span> trading days</span>
          </div>
        </div>
      )}
    </div>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
