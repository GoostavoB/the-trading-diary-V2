import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatNumber } from '@/utils/formatNumber';

interface TradePreviewModalProps {
  connectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface PendingTrade {
  id: string;
  trade_data: any;
  is_selected: boolean;
  fetched_at: string;
}

export function TradePreviewModal({
  connectionId,
  isOpen,
  onClose,
  onImportComplete,
}: TradePreviewModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    symbol: 'all',
    side: 'all',
    profitableOnly: false,
  });
  const queryClient = useQueryClient();

  // Fetch pending trades
  const { data: pendingTrades = [], isLoading } = useQuery({
    queryKey: ['pending-trades', connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      
      const { data, error } = await supabase
        .from('exchange_pending_trades')
        .select('*')
        .eq('connection_id', connectionId)
        .order('fetched_at', { ascending: false });

      if (error) throw error;
      return data as PendingTrade[];
    },
    enabled: isOpen && !!connectionId,
  });

  // Initialize selected trades when data loads
  useEffect(() => {
    if (pendingTrades.length > 0 && selectedIds.size === 0) {
      const allIds = pendingTrades.map((t) => t.id);
      setSelectedIds(new Set(allIds));
    }
  }, [pendingTrades]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (tradeIds: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-exchange-trades`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            connectionId,
            mode: 'import',
            selectedTradeIds: tradeIds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(
        `Imported ${data.tradesImported} trades${data.tradesSkipped > 0 ? ` (${data.tradesSkipped} duplicates skipped)` : ''}`
      );
      queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      onImportComplete();
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  // Filter trades
  const filteredTrades = useMemo(() => {
    return pendingTrades.filter((trade) => {
      const data = trade.trade_data;

      if (filters.symbol !== 'all' && data.symbol !== filters.symbol) {
        return false;
      }

      if (filters.side !== 'all' && data.side !== filters.side) {
        return false;
      }

      if (filters.profitableOnly && (data.profit_loss || 0) <= 0) {
        return false;
      }

      return true;
    });
  }, [pendingTrades, filters]);

  // Get unique symbols
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(pendingTrades.map((t) => t.trade_data.symbol));
    return Array.from(symbols).sort();
  }, [pendingTrades]);

  // Calculate summary
  const selectedTrades = filteredTrades.filter((t) => selectedIds.has(t.id));
  const totalPnL = selectedTrades.reduce((sum, t) => sum + (t.trade_data.profit_loss || 0), 0);

  // Handlers
  const handleSelectAll = () => {
    const filteredIds = filteredTrades.map((t) => t.id);
    setSelectedIds(new Set(filteredIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleTrade = (tradeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const handleImport = () => {
    if (selectedIds.size === 0) return;
    importMutation.mutate(Array.from(selectedIds));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('exchanges.preview.title')}</DialogTitle>
          <DialogDescription>
            {t('exchanges.preview.description')}
          </DialogDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {t('exchanges.preview.selected', { count: selectedIds.size, total: filteredTrades.length })}
              {totalPnL !== 0 && (
                <span className={totalPnL > 0 ? 'text-success' : 'text-destructive'}>
                  {' • '}{t('exchanges.preview.totalPnL')}: ${formatNumber(totalPnL)}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={
                selectedIds.size === filteredTrades.length ? handleDeselectAll : handleSelectAll
              }
            >
              {selectedIds.size === filteredTrades.length ? t('exchanges.preview.deselectAll') : t('exchanges.preview.selectAll')}
            </Button>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 py-4 border-y">
          <Select value={filters.symbol} onValueChange={(value) => setFilters({ ...filters, symbol: value })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('exchanges.preview.symbol')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('exchanges.preview.allSymbols')}</SelectItem>
              {uniqueSymbols.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.side} onValueChange={(value) => setFilters({ ...filters, side: value })}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('exchanges.preview.side')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('exchanges.preview.allSides')}</SelectItem>
              <SelectItem value="long">{t('exchanges.preview.long')}</SelectItem>
              <SelectItem value="short">{t('exchanges.preview.short')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={filters.profitableOnly}
              onCheckedChange={(checked) =>
                setFilters({ ...filters, profitableOnly: checked === true })
              }
              id="profitable"
            />
            <label htmlFor="profitable" className="text-sm cursor-pointer">
              {t('exchanges.preview.profitableOnly')}
            </label>
          </div>
        </div>

        {/* Trade Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            {t('exchanges.preview.noTrades')}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredTrades.length && filteredTrades.length > 0}
                      onCheckedChange={
                        selectedIds.size === filteredTrades.length ? handleDeselectAll : handleSelectAll
                      }
                    />
                  </TableHead>
                  <TableHead>{t('exchanges.preview.date')}</TableHead>
                  <TableHead>{t('exchanges.preview.symbol')}</TableHead>
                  <TableHead>{t('exchanges.preview.side')}</TableHead>
                  <TableHead>{t('exchanges.preview.size')}</TableHead>
                  <TableHead>{t('exchanges.preview.price')}</TableHead>
                  <TableHead>{t('exchanges.preview.pnl')}</TableHead>
                  <TableHead>{t('exchanges.preview.fee')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleTrade(trade.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(trade.id)}
                        onCheckedChange={() => handleToggleTrade(trade.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(trade.trade_data.opened_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{trade.trade_data.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.trade_data.side === 'long' ? 'default' : 'destructive'}>
                        {trade.trade_data.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{trade.trade_data.position_size}</TableCell>
                    <TableCell className="text-sm">${formatNumber(trade.trade_data.entry_price)}</TableCell>
                    <TableCell
                      className={
                        trade.trade_data.profit_loss > 0
                          ? 'text-success font-medium'
                          : trade.trade_data.profit_loss < 0
                          ? 'text-destructive font-medium'
                          : ''
                      }
                    >
                      {trade.trade_data.profit_loss
                        ? `$${formatNumber(trade.trade_data.profit_loss)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      ${formatNumber(trade.trade_data.trading_fee || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exchanges.preview.importing')}
              </>
            ) : (
              t('exchanges.preview.importSelected', { count: selectedIds.size })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
