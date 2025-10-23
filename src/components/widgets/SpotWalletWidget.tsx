import { memo } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface SpotWalletWidgetProps extends WidgetProps {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  tokenCount: number;
}

export const SpotWalletWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  totalValue,
  change24h,
  changePercent24h,
  tokenCount,
}: SpotWalletWidgetProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isPositive = change24h >= 0;

  return (
    <WidgetWrapper
      id={id}
      title={t('widgets.spotWallet.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
      headerActions={
        !isEditMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/spot-wallet')}
            className="h-7"
          >
            {t('widgets.viewAll')} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">
              <BlurredCurrency amount={totalValue} className="inline" />
            </p>
            <p className="text-sm text-muted-foreground mt-1">{tokenCount} {t('widgets.tokens')}</p>
          </div>
          <Wallet className="h-8 w-8 text-primary/60" />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-neon-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-neon-red" />
          )}
          <span className={`text-sm font-semibold ${
            isPositive ? 'text-neon-green' : 'text-neon-red'
          }`}>
            {isPositive ? '+' : ''}<BlurredCurrency amount={change24h} className="inline" /> ({formatPercent(changePercent24h)})
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>
      </div>
    </WidgetWrapper>
  );
});

SpotWalletWidget.displayName = 'SpotWalletWidget';
