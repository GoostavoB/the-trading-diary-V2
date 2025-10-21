import { memo } from 'react';
import { EnhancedTradeMetrics } from '@/utils/feeCalculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { RedFlagAlert } from './RedFlagAlert';
import { FeeBreakdownTooltip } from './FeeBreakdownTooltip';
import { getStrategyFeeTarget } from '@/utils/feeClassification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';

interface TradeDetailsTableProps {
  trades: EnhancedTradeMetrics[];
}

export const TradeDetailsTable = memo(({ trades }: TradeDetailsTableProps) => {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '' : '-'}${Math.abs(value).toFixed(2)}%`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('feeAnalysis.pair')}</TableHead>
            <TableHead>{t('feeAnalysis.exchange')}</TableHead>
            <TableHead className="text-right">{t('feeAnalysis.margin')}</TableHead>
            <TableHead className="text-center">{t('feeAnalysis.leverage')}</TableHead>
            <TableHead className="text-right">{t('feeAnalysis.grossPnLPercent')}</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                Fee % of Margin
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Fees as % of your actual capital (margin), not the leveraged position size.
                        This is the true cost to your account.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
            <TableHead className="text-right">{t('feeAnalysis.netPnLPercent')}</TableHead>
            <TableHead className="text-right">{t('feeAnalysis.feeDollar')}</TableHead>
            <TableHead className="text-right">{t('feeAnalysis.fundingDollar')}</TableHead>
            <TableHead className="text-center">Red Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const strategyTarget = getStrategyFeeTarget(trade.setup);
            const exceedsTarget = trade.feePercentOfMargin > strategyTarget.maxFee;
            
            return (
              <TableRow key={trade.tradeId}>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span>{trade.broker}</span>
                    {trade.setup && (
                      <span className="text-xs text-muted-foreground">{trade.setup}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(trade.margin)}</TableCell>
                <TableCell className="text-center">{trade.leverage}x</TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  trade.grossReturnPercent >= 0 ? "text-profit" : "text-loss"
                )}>
                  {formatPercent(trade.grossReturnPercent)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  exceedsTarget ? "text-red-500 font-bold" : "text-amber-500"
                )}>
                  <div className="flex items-center justify-end gap-2">
                    {trade.feePercentOfMargin.toFixed(3)}%
                    <FeeBreakdownTooltip
                      tradingFee={trade.tradingFee}
                      fundingFee={trade.fundingFee}
                      slippageCost={trade.slippageCost}
                      spreadCost={trade.spreadCost}
                      totalFees={trade.totalFees}
                    />
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-semibold",
                  trade.effectiveReturnOnMargin >= 0 ? "text-profit" : "text-loss"
                )}>
                  {formatPercent(trade.effectiveReturnOnMargin)}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  {formatCurrency(trade.tradingFee)}
                </TableCell>
                <TableCell className={cn(
                  "text-right",
                  trade.fundingFee >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {trade.fundingFee >= 0 ? '+' : ''}{formatCurrency(trade.fundingFee)}
                </TableCell>
                <TableCell className="text-center">
                  <RedFlagAlert 
                    totalFees={trade.totalFees} 
                    grossPnL={trade.grossPnL} 
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

TradeDetailsTable.displayName = 'TradeDetailsTable';
