import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingDown } from "lucide-react";
import { formatPercent } from "@/utils/formatNumber";
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MaxDrawdownCardProps {
  value: number;
  percentage: number;
  className?: string;
}

const MaxDrawdownCardComponent = ({ value, percentage, className }: MaxDrawdownCardProps) => {
  const { formatAmount } = useCurrency();
  
  return (
    <GlassCard 
      hover 
      className={className}
      role="article"
      aria-labelledby="max-drawdown-title"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="max-drawdown-title" className="text-sm font-medium text-muted-foreground">
            Max Drawdown
          </h3>
          <div className="p-2 rounded-xl bg-secondary/10" aria-hidden="true">
            <TrendingDown className="h-4 w-4 text-secondary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p 
            className="text-3xl font-bold tracking-tight text-secondary"
            aria-label={`Max drawdown value: ${formatAmount(value)}`}
          >
            <BlurredCurrency amount={value} />
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPercent(percentage)} of peak
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export const MaxDrawdownCard = memo(MaxDrawdownCardComponent);
