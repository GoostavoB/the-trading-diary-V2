import { memo } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Eye, Share2, Undo } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trade } from '@/types/trade';
import { getFinancialColor } from '@/lib/utils';
import { TokenIcon } from '@/components/TokenIcon';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

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
        <TableCell>{format(new Date(trade.opened_at || trade.trade_date), 'MMM dd, yyyy')}</TableCell>
      )}
      {columns.find(c => c.key === 'symbol')?.visible && (
        <TableCell>
          <div className="flex items-center gap-2">
            <TokenIcon symbol={trade.symbol} size="sm" />
            <span className="font-medium">{trade.symbol}</span>
          </div>
        </TableCell>
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
        <TableCell>
          <BlurredCurrency amount={trade.entry_price || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'exit')?.visible && (
        <TableCell>
          <BlurredCurrency amount={trade.exit_price || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'size')?.visible && (
        <TableCell>
          <BlurredCurrency amount={trade.position_size || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'pnl')?.visible && (
        <TableCell className={getFinancialColor(trade.profit_loss || 0)}>
          <BlurredCurrency amount={trade.profit_loss || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'roi')?.visible && (
        <TableCell className={getFinancialColor(trade.roi || 0)}>
          <BlurredPercent value={trade.roi || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'fundingFee')?.visible && (
        <TableCell>
          <BlurredCurrency amount={trade.funding_fee || 0} />
        </TableCell>
      )}
      {columns.find(c => c.key === 'tradingFee')?.visible && (
        <TableCell>
          <BlurredCurrency amount={trade.trading_fee || 0} />
        </TableCell>
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
