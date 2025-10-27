import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ExtractedTrade } from "@/types/trade";
import { formatNumberInput } from "@/utils/numberFormatting";

interface CSVPreviewWithEditProps {
  trades: ExtractedTrade[];
  onTradesUpdate: (updatedTrades: ExtractedTrade[]) => void;
}

export const CSVPreviewWithEdit = ({ trades, onTradesUpdate }: CSVPreviewWithEditProps) => {
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ExtractedTrade } | null>(null);

  const validateTrade = (trade: ExtractedTrade): string[] => {
    const errors: string[] = [];
    if (!trade.symbol) errors.push('Missing symbol');
    if (!trade.entry_price || trade.entry_price <= 0) errors.push('Invalid entry price');
    if (!trade.exit_price || trade.exit_price <= 0) errors.push('Invalid exit price');
    if (!trade.position_size || trade.position_size <= 0) errors.push('Invalid position size');
    if (!trade.opened_at) errors.push('Missing open date');
    if (!trade.closed_at) errors.push('Missing close date');
    return errors;
  };

  const handleCellEdit = (rowIndex: number, field: keyof ExtractedTrade, value: any) => {
    const updatedTrades = [...trades];
    (updatedTrades[rowIndex] as any)[field] = value;
    onTradesUpdate(updatedTrades);
    setEditingCell(null);
  };

  const validTrades = trades.filter(t => validateTrade(t).length === 0);
  const invalidTrades = trades.filter(t => validateTrade(t).length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review & Validate Trades</h3>
          <p className="text-sm text-muted-foreground">
            Click any cell to edit. Fix errors before importing.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {validTrades.length} Valid
          </Badge>
          {invalidTrades.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {invalidTrades.length} Errors
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 10).map((trade, idx) => {
                const errors = validateTrade(trade);
                const hasErrors = errors.length > 0;

                return (
                  <TableRow key={idx} className={hasErrors ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    
                    <TableCell
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setEditingCell({ row: idx, field: 'symbol' })}
                    >
                      {editingCell?.row === idx && editingCell?.field === 'symbol' ? (
                        <Input
                          autoFocus
                          defaultValue={trade.symbol}
                          onBlur={(e) => handleCellEdit(idx, 'symbol', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(idx, 'symbol', e.currentTarget.value);
                            }
                          }}
                          className="h-8"
                        />
                      ) : (
                        <span className="font-mono">{trade.symbol || '-'}</span>
                      )}
                    </TableCell>

                    <TableCell
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setEditingCell({ row: idx, field: 'side' })}
                    >
                      {editingCell?.row === idx && editingCell?.field === 'side' ? (
                        <Select
                          defaultValue={trade.side}
                          onValueChange={(value) => handleCellEdit(idx, 'side', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
                          {trade.side}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {formatNumberInput(trade.entry_price?.toString() || '0')}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {formatNumberInput(trade.exit_price?.toString() || '0')}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {formatNumberInput(trade.position_size?.toString() || '0')}
                    </TableCell>

                    <TableCell className={trade.profit_loss >= 0 ? 'text-success' : 'text-destructive'}>
                      {trade.profit_loss > 0 ? '+' : ''}
                      {formatNumberInput(trade.profit_loss?.toString() || '0')}
                    </TableCell>

                    <TableCell className="text-xs">
                      {new Date(trade.opened_at).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      {hasErrors ? (
                        <div title={errors.join(', ')}>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {trades.length > 10 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            Showing 10 of {trades.length} trades. All will be imported.
          </div>
        )}
      </Card>
    </div>
  );
};
