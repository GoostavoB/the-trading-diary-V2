import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface FeeBreakdownTooltipProps {
  tradingFee: number;
  fundingFee: number;
  slippageCost?: number;
  spreadCost?: number;
  totalFees: number;
}

export const FeeBreakdownTooltip = memo(({ 
  tradingFee, 
  fundingFee, 
  slippageCost = 0, 
  spreadCost = 0,
  totalFees 
}: FeeBreakdownTooltipProps) => {
  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toFixed(2)}`;
  };

  const hasAdditionalCosts = slippageCost !== 0 || spreadCost !== 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Fee Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span>Exchange Fee:</span>
                <span className="font-mono text-red-500">{formatCurrency(tradingFee)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Funding Fee:</span>
                <span className={`font-mono ${fundingFee >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fundingFee >= 0 ? '+' : ''}{formatCurrency(fundingFee)}
                </span>
              </div>
              {hasAdditionalCosts && (
                <>
                  {slippageCost !== 0 && (
                    <div className="flex justify-between gap-4">
                      <span>Slippage:</span>
                      <span className="font-mono text-orange-500">{formatCurrency(slippageCost)}</span>
                    </div>
                  )}
                  {spreadCost !== 0 && (
                    <div className="flex justify-between gap-4">
                      <span>Spread:</span>
                      <span className="font-mono text-orange-500">{formatCurrency(spreadCost)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="pt-1 border-t border-border flex justify-between gap-4 font-semibold">
                <span>Total Cost:</span>
                <span className="font-mono text-red-500">{formatCurrency(totalFees)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Total fees include all costs incurred during the trade execution.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

FeeBreakdownTooltip.displayName = 'FeeBreakdownTooltip';
