import { GlassCard } from "@/components/ui/glass-card";
import { TrendingDown } from "lucide-react";
import { formatPercent, formatCurrency } from "@/utils/formatNumber";

interface MaxDrawdownCardProps {
  value: number;
  percentage: number;
  className?: string;
}

export const MaxDrawdownCard = ({ value, percentage, className }: MaxDrawdownCardProps) => {
  return (
    <GlassCard hover className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
          <div className="p-2 rounded-xl bg-secondary/10">
            <TrendingDown className="h-4 w-4 text-secondary" />
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-secondary">
            {formatCurrency(value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPercent(percentage)} of peak
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
