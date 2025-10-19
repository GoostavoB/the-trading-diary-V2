import { memo } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Eye, Share2, Undo } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trade } from '@/types/trade';
import { getFinancialColor } from '@/lib/utils';

type ColumnKey = 'date' | 'symbol' | 'setup' | 'broker' | 'type' | 'entry' | 'exit' | 'size' | 'pnl' | 'roi' | 'fundingFee' | 'tradingFee';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

interface TradeTableRowProps {
  trade: Trade;
  columns: ColumnConfig[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onShare: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onUndelete: (id: string) => void;
}

export const TradeTableRow = memo(({
  trade,
  columns,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onShare,
  onDelete,
  onUndelete,
}: TradeTableRowProps) => {
  const isDeleted = !!trade.deleted_at;

  return (
    <TableRow className={isDeleted ? 'opacity-50' : ''}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(trade.id)}
        />
      </TableCell>
      {columns.find(c => c.key === 'date')?.visible && (
        <TableCell>{format(new Date(trade.trade_date), 'MMM dd, yyyy')}</TableCell>
      )}
      {columns.find(c => c.key === 'symbol')?.visible && (
        <TableCell className="font-medium">{trade.symbol}</TableCell>
      )}
      {columns.find(c => c.key === 'setup')?.visible && (
        <TableCell>{trade.setup || '-'}</TableCell>
      )}
      {columns.find(c => c.key === 'broker')?.visible && (
        <TableCell>{trade.broker || '-'}</TableCell>
      )}
      {columns.find(c => c.key === 'type')?.visible && (
        <TableCell>
          <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
            {trade.side}
          </Badge>
        </TableCell>
      )}
      {columns.find(c => c.key === 'entry')?.visible && (
        <TableCell>${trade.entry_price?.toLocaleString()}</TableCell>
      )}
      {columns.find(c => c.key === 'exit')?.visible && (
        <TableCell>${trade.exit_price?.toLocaleString()}</TableCell>
      )}
      {columns.find(c => c.key === 'size')?.visible && (
        <TableCell>{trade.position_size?.toLocaleString()}</TableCell>
      )}
      {columns.find(c => c.key === 'pnl')?.visible && (
        <TableCell className={getFinancialColor(trade.pnl || 0)}>
          ${trade.pnl?.toFixed(2)}
        </TableCell>
      )}
      {columns.find(c => c.key === 'roi')?.visible && (
        <TableCell className={getFinancialColor(trade.roi || 0)}>
          {trade.roi?.toFixed(2)}%
        </TableCell>
      )}
      {columns.find(c => c.key === 'fundingFee')?.visible && (
        <TableCell>${trade.funding_fee?.toFixed(2)}</TableCell>
      )}
      {columns.find(c => c.key === 'tradingFee')?.visible && (
        <TableCell>${trade.trading_fee?.toFixed(2)}</TableCell>
      )}
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(trade)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!isDeleted && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(trade)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onShare(trade)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(trade.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {isDeleted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUndelete(trade.id)}
            >
              <Undo className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

TradeTableRow.displayName = 'TradeTableRow';
