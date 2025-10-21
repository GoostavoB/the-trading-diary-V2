import { memo, useMemo, useState } from 'react';
import { ExchangeFeeStats } from '@/utils/feeCalculations';
import { classifyFee } from '@/utils/feeClassification';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EfficiencyBadge } from './EfficiencyBadge';
import { ExchangeBadge } from '@/components/exchanges/ExchangeBadge';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExchangeComparisonTableProps {
  exchangeStats: ExchangeFeeStats[];
}

type SortField = 'rank' | 'tradeCount' | 'totalVolume' | 'avgFeePercent' | 'feeImpactOnPnL';

export const ExchangeComparisonTable = memo(({ exchangeStats }: ExchangeComparisonTableProps) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const sortedStats = useMemo(() => {
    return [...exchangeStats].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * multiplier;
    });
  }, [exchangeStats, sortBy, sortOrder]);
  
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              onClick={() => handleSort('rank')} 
              className="cursor-pointer hover:bg-muted/50"
            >
              {t('feeAnalysis.rank')} <ArrowUpDown className="ml-1 h-3 w-3 inline" />
            </TableHead>
            <TableHead>{t('feeAnalysis.exchange')}</TableHead>
            <TableHead 
              onClick={() => handleSort('totalVolume')} 
              className="cursor-pointer text-right hover:bg-muted/50"
            >
              {t('feeAnalysis.totalVolume')} <ArrowUpDown className="ml-1 h-3 w-3 inline" />
            </TableHead>
            <TableHead 
              onClick={() => handleSort('tradeCount')} 
              className="cursor-pointer text-right hover:bg-muted/50"
            >
              {t('feeAnalysis.trades')} <ArrowUpDown className="ml-1 h-3 w-3 inline" />
            </TableHead>
            <TableHead className="text-right">{t('feeAnalysis.totalFees')}</TableHead>
            <TableHead 
              onClick={() => handleSort('avgFeePercent')} 
              className="cursor-pointer text-right hover:bg-muted/50"
            >
              {t('feeAnalysis.avgFeePercent')} <ArrowUpDown className="ml-1 h-3 w-3 inline" />
            </TableHead>
            <TableHead className="text-center">{t('feeAnalysis.efficiency')}</TableHead>
            <TableHead 
              onClick={() => handleSort('feeImpactOnPnL')} 
              className="cursor-pointer text-right hover:bg-muted/50"
            >
              {t('feeAnalysis.feeImpactOnPnL')} <ArrowUpDown className="ml-1 h-3 w-3 inline" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStats.map((stat) => (
            <TableRow key={stat.broker} className="hover:bg-muted/50">
              <TableCell>
                <Badge variant={stat.rank === 1 ? 'default' : 'secondary'}>
                  #{stat.rank}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <ExchangeBadge source={stat.broker} />
                  {stat.broker}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(stat.totalVolume)}</TableCell>
              <TableCell className="text-right">{stat.tradeCount}</TableCell>
              <TableCell className="text-right">{formatCurrency(stat.totalFees)}</TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "font-mono cursor-help",
                          stat.avgFeePercent < 0.05 ? "text-green-500" : 
                          stat.avgFeePercent < 0.10 ? "text-amber-500" : "text-red-500"
                        )}>
                          {stat.avgFeePercent.toFixed(3)}%
                        </span>
                        <Badge className={cn("text-xs", classifyFee(stat.avgFeePercent).bgColor, classifyFee(stat.avgFeePercent).color)}>
                          {classifyFee(stat.avgFeePercent).label}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{classifyFee(stat.avgFeePercent).label} Fee Tier</p>
                      <p className="text-sm mt-1">{classifyFee(stat.avgFeePercent).description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 {classifyFee(stat.avgFeePercent).recommendation}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center">
                <EfficiencyBadge score={stat.avgEfficiencyScore} />
              </TableCell>
              <TableCell className="text-right">
                <span className="text-amber-500">
                  {stat.feeImpactOnPnL.toFixed(2)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ExchangeComparisonTable.displayName = 'ExchangeComparisonTable';
