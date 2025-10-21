import { memo } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CapitalPeriod } from '@/utils/capitalCalculations';

interface WeightedROICardProps {
  overallROI: number;
  weightedROI: number;
  periods: CapitalPeriod[];
}

export const WeightedROICard = memo(({ overallROI, weightedROI, periods }: WeightedROICardProps) => {
  const difference = weightedROI - overallROI;
  const isDifferent = Math.abs(difference) > 0.01;

  return (
    <GlassCard>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Weighted ROI</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold">Capital-Weighted ROI</p>
                    <p className="text-sm mt-1">
                      Accounts for the timing and size of capital injections. 
                      More accurate than simple ROI when you've added capital over time.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formula: Σ(Period ROI × Period Capital) / Σ(Period Capital)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <AnimatedCounter 
                value={weightedROI} 
                suffix="%" 
                decimals={2} 
                className="text-3xl font-bold text-primary" 
              />
              {isDifferent && (
                <span className={`text-sm ${difference > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                  ({difference > 0 ? '+' : ''}{difference.toFixed(2)}% vs simple ROI)
                </span>
              )}
            </div>
          </div>
          <TrendingUp className="h-10 w-10 text-primary/50" />
        </div>

        {periods.length > 1 && (
          <div className="space-y-2 pt-4 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground">Performance by Period</p>
            <div className="space-y-1.5">
              {periods.slice(-3).map((period, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-muted-foreground">
                      (${period.startingCapital.toLocaleString()})
                    </span>
                  </div>
                  <span className={`font-mono font-semibold ${period.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {period.roi >= 0 ? '+' : ''}{period.roi.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            {periods.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Showing last 3 of {periods.length} periods
              </p>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
});

WeightedROICard.displayName = 'WeightedROICard';
