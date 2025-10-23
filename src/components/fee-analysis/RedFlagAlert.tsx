import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BlurredPercent } from '@/components/ui/BlurredValue';

interface RedFlagAlertProps {
  totalFees: number;
  grossPnL: number;
  className?: string;
}

export const RedFlagAlert = memo(({ totalFees, grossPnL, className }: RedFlagAlertProps) => {
  // Calculate fee-to-profit ratio
  const absGrossPnL = Math.abs(grossPnL);
  if (absGrossPnL === 0) return null;
  
  const feeToExpectedProfitRatio = (totalFees / absGrossPnL) * 100;
  
  // Red flag if fees > 20% of expected profit
  const isRedFlag = feeToExpectedProfitRatio > 20;
  
  if (!isRedFlag) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="destructive" 
            className={cn("gap-1 cursor-help", className)}
          >
            <AlertTriangle className="h-3 w-3" />
            <BlurredPercent value={feeToExpectedProfitRatio} className="inline" /> of profit
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold text-destructive">⚠️ Excessive Fees Detected!</p>
          <p className="text-sm mt-1">
            Fees consumed <strong><BlurredPercent value={feeToExpectedProfitRatio} className="inline" /></strong> of your expected profit on this trade.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Industry best practice: Keep fees under 20% of profit target.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

RedFlagAlert.displayName = 'RedFlagAlert';
