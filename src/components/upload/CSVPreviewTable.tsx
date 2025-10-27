import { ExtractedTrade } from '@/types/trade';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumberInput } from '@/utils/numberFormatting';
import { getFinancialColor } from '@/lib/utils';
import { format } from 'date-fns';

interface CSVPreviewTableProps {
  trades: ExtractedTrade[];
}

export const CSVPreviewTable = ({ trades }: CSVPreviewTableProps) => {
  return (
    <Card className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>
                  <Badge
                    variant={trade.side === 'long' ? 'default' : 'secondary'}
                    className={trade.side === 'long' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-red/20 text-neon-red'}
                  >
                    {trade.side.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${formatNumberInput(trade.entry_price)}
                </TableCell>
                <TableCell className="text-right">
                  ${formatNumberInput(trade.exit_price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumberInput(trade.position_size)}
                </TableCell>
                <TableCell className={`text-right font-medium ${getFinancialColor(trade.profit_loss)}`}>
                  ${formatNumberInput(trade.profit_loss)}
                </TableCell>
                <TableCell className={`text-right font-medium ${getFinancialColor(trade.roi)}`}>
                  {trade.roi.toFixed(2)}%
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(trade.closed_at), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
