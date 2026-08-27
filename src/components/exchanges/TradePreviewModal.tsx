import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, invokeEdgeFunction } from '@/integrations/supabase/client';
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
import { SymbolLabel } from '@/components/common/SymbolLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatNumber } from '@/utils/formatNumber';
import { useSubAccount } from '@/contexts/SubAccountContext';

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

const getTradeTime = (tradeData: any): number => {
  const raw = tradeData?.closed_at ?? tradeData?.closedAt ?? tradeData?.timestamp ?? null;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export function TradePreviewModal({
  connectionId,
  isOpen,
  onClose,
  onImportComplete,
}: TradePreviewModalProps) {
  const { t } = useTranslation();
  const { activeSubAccount } = useSubAccount();
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
      const sorted = [...(data ?? [])].sort(
        (a, b) => getTradeTime(b?.trade_data) - getTradeTime(a?.trade_data)
      );
      return sorted as PendingTrade[];
    },
    enabled: isOpen && !!connectionId,
  });

  // Initialize selected trades when data loads
  useEffect(() => {
    if (isOpen && pendingTrades.length > 0) {
      const preSelectedIds = pendingTrades.filter((t) => t.is_selected).map((t) => t.id);
      setSelectedIds(new Set(preSelectedIds));
    }
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [pendingTrades, isOpen]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (tradeIds: string[]) => {
      const { data, error } = await invokeEdgeFunction<any>('fetch-exchange-trades', {
        body: {
          connectionId,
          mode: 'import',
          subAccountId: activeSubAccount?.id,
          selectedTradeIds: tradeIds,
        },
      });

      if (error) throw error;

      return data;
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

  const EXCHANGE_DISPLAY_NAMES: Record<string, string> = {
    binance: 'Binance', bingx: 'BingX', bybit: 'Bybit', coinbase: 'Coinbase',
    kraken: 'Kraken', bitfinex: 'Bitfinex', mexc: 'MEXC', kucoin: 'KuCoin',
    okx: 'OKX', gateio: 'Gate.io', bitstamp: 'Bitstamp',
  };
  const exchangeBroker = pendingTrades[0]?.trade_data?.broker as string | undefined;
  const exchangeName = exchangeBroker ? (EXCHANGE_DISPLAY_NAMES[exchangeBroker.toLowerCase()] ?? exchangeBroker) : '';

  const handleImport = () => {
    if (selectedIds.size === 0) return;
    if (!activeSubAccount?.id) {
      toast.error('No active trading account selected');
      return;
    }
    importMutation.mutate(Array.from(selectedIds));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[min(1600px,96vw)] w-[96vw] max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t('exchanges.preview.title', { exchange: exchangeName })}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('exchanges.preview.description')}
          </DialogDescription>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-md bg-muted/60 px-2.5 py-1 font-medium tabular-nums">
                {t('exchanges.preview.selected', { count: selectedIds.size, total: filteredTrades.length })}
              </span>
              {totalPnL !== 0 && (
                <span
                  className={`rounded-md px-2.5 py-1 font-medium tabular-nums ${
                    totalPnL > 0
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {t('exchanges.preview.totalPnL', { amount: formatNumber(totalPnL) })}
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
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-y bg-muted/20">
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
          <div className="flex items-center justify-center h-[55vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex items-center justify-center h-[55vh] text-muted-foreground">
            {t('exchanges.preview.noTrades')}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto px-6 py-2">
            <Table className="w-full min-w-[1180px]">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredTrades.length && filteredTrades.length > 0}
                      onCheckedChange={
                        selectedIds.size === filteredTrades.length ? handleDeselectAll : handleSelectAll
                      }
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">{t('exchanges.preview.date')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('exchanges.preview.symbol')}</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">{t('exchanges.preview.side')}</TableHead>
                  <TableHead className="whitespace-nowrap text-right">{t('exchanges.preview.size')}</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Entry</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Exit</TableHead>
                  <TableHead className="whitespace-nowrap text-right">{t('exchanges.preview.pnl')}</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Leverage</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Margin</TableHead>
                  <TableHead className="whitespace-nowrap text-right">ROI</TableHead>
                  <TableHead className="whitespace-nowrap text-right">{t('exchanges.preview.fee')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    data-state={selectedIds.has(trade.id) ? 'selected' : undefined}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => handleToggleTrade(trade.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(trade.id)}
                        onCheckedChange={() => handleToggleTrade(trade.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap tabular-nums text-muted-foreground">
                      {format(new Date(getTradeTime(trade.trade_data)), 'dd MMM · HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <SymbolLabel symbol={trade.trade_data.symbol} />
                    </TableCell>
                    <TableCell>
                      {trade.trade_data.already_imported ? (
                        <Badge
                          variant="outline"
                          className="whitespace-nowrap rounded-full border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {t('exchanges.preview.alreadyImported', 'Already imported')}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="whitespace-nowrap rounded-full border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success"
                        >
                          {t('exchanges.preview.new', 'New')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                          trade.trade_data.side === 'long'
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                        }`}
                      >
                        {trade.trade_data.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{trade.trade_data.position_size}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">${formatNumber(trade.trade_data.entry_price)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">${formatNumber(trade.trade_data.exit_price)}</TableCell>
                    <TableCell
                      className={`text-sm text-right tabular-nums font-medium ${
                        trade.trade_data.profit_loss > 0
                          ? 'text-success'
                          : trade.trade_data.profit_loss < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {trade.trade_data.profit_loss
                        ? `$${formatNumber(trade.trade_data.profit_loss)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {trade.trade_data.leverage ? `${trade.trade_data.leverage}x` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {trade.trade_data.margin ? `$${formatNumber(trade.trade_data.margin)}` : '—'}
                    </TableCell>
                    <TableCell
                      className={`text-sm text-right tabular-nums ${
                        trade.trade_data.roi > 0
                          ? 'text-success'
                          : trade.trade_data.roi < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {typeof trade.trade_data.roi === 'number' ? `${trade.trade_data.roi.toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      ${formatNumber(trade.trade_data.trading_fee || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
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
