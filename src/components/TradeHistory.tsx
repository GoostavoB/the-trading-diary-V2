import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BlurToggleButton } from '@/components/ui/BlurToggleButton';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Trade } from '@/types/trade';
import { ShareTradeCard } from '@/components/ShareTradeCard';
import { TradeRowCard } from '@/components/trade-history/TradeRowCard';
import { TradeFilterPanel } from '@/components/trade-history/TradeFilterPanel';
import { DensityToggle } from '@/components/trade-history/DensityToggle';
import { useTradePagination } from '@/components/trade-history/useTradePagination';
import { PaginationControls } from '@/components/trade-history/PaginationControls';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeTagSelector } from '@/components/trades/TradeTagSelector';

type ColumnKey = 'date' | 'symbol' | 'setup' | 'broker' | 'type' | 'entry' | 'exit' | 'size' | 'pnl' | 'roi' | 'fundingFee' | 'tradingFee' | 'error';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'symbol', label: 'Symbol', visible: true },
  { key: 'setup', label: 'Setup', visible: true },
  { key: 'broker', label: 'Broker', visible: true },
  { key: 'type', label: 'Type', visible: true },
  { key: 'entry', label: 'Entry', visible: true },
  { key: 'exit', label: 'Exit', visible: true },
  { key: 'size', label: 'Size', visible: true },
  { key: 'pnl', label: 'P&L', visible: true },
  { key: 'roi', label: 'ROI', visible: true },
  { key: 'fundingFee', label: 'Funding Fee', visible: false },
  { key: 'tradingFee', label: 'Trading Fee', visible: false },
  { key: 'error', label: 'Error/Mistake', visible: true },
];

interface TradeHistoryProps {
  onTradesChange?: () => void;
}

export const TradeHistory = memo(({ onTradesChange }: TradeHistoryProps = {}) => {
  const { user } = useAuth();
  const { dateRange, setDateRange, clearDateRange } = useDateRange();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'roi'>('date');
  const [filterType, setFilterType] = useState<'all' | 'wins' | 'losses'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [tradeToShare, setTradeToShare] = useState<Trade | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    const saved = localStorage.getItem('tradeHistoryDensity');
    return (saved as 'comfortable' | 'compact') || 'comfortable';
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter and sort trades with memoization
  const filterAndSortTrades = useCallback(() => {
    let filtered = [...trades];

    // Filter by date range
    if (dateRange?.from) {
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.trade_date);
        const from = dateRange.from!;
        const to = dateRange.to || dateRange.from!;
        
        return tradeDate >= from && tradeDate <= to;
      });
    }

    // Filter by deleted status
    if (showDeleted) {
      filtered = filtered.filter(t => t.deleted_at !== null);
    } else {
      filtered = filtered.filter(t => t.deleted_at === null);
    }

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          t.setup?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          t.broker?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'wins') {
      filtered = filtered.filter((t) => (t.profit_loss || 0) > 0);
    } else if (filterType === 'losses') {
      filtered = filtered.filter((t) => (t.profit_loss || 0) <= 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        // Use opened_at (actual trade date) for chronological sorting
        comparison = new Date(a.opened_at || a.trade_date || 0).getTime() - 
                     new Date(b.opened_at || b.trade_date || 0).getTime();
      } else if (sortBy === 'pnl') {
        comparison = (b.profit_loss || 0) - (a.profit_loss || 0);
      } else if (sortBy === 'roi') {
        comparison = (b.roi || 0) - (a.roi || 0);
      }
      
      return comparison;
    });

    return filtered;
  }, [trades, debouncedSearchTerm, filterType, sortBy, showDeleted, dateRange]);

  // Memoized filtered trades
  const filteredTrades = useMemo(() => filterAndSortTrades(), [filterAndSortTrades]);

  // Pagination
  const pagination = useTradePagination(filteredTrades.length);
  const paginatedTrades = useMemo(() => 
    filteredTrades.slice(pagination.startIndex, pagination.endIndex),
    [filteredTrades, pagination.startIndex, pagination.endIndex]
  );

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user, showDeleted]);

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
  }, [debouncedSearchTerm, filterType, sortBy, showDeleted, dateRange]);

  useEffect(() => {
    localStorage.setItem('tradeHistoryDensity', density);
  }, [density]);

  const toggleTradeSelection = (tradeId: string) => {
    setSelectedTradeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const toggleAllTrades = () => {
    if (selectedTradeIds.size === filteredTrades.length) {
      setSelectedTradeIds(new Set());
    } else {
      setSelectedTradeIds(new Set(filteredTrades.map(t => t.id)));
    }
  };

  const toggleRowExpand = (tradeId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedTradeIds.size === 0) return;

    if (showDeleted) {
      // Permanently delete
      if (!confirm(`Are you sure you want to permanently delete ${selectedTradeIds.size} trade(s)? This cannot be undone.`)) {
        return;
      }

      const { error } = await supabase
        .from('trades')
        .delete()
        .in('id', Array.from(selectedTradeIds));

      if (error) {
        toast.error('Failed to delete trades');
      } else {
        toast.success(`${selectedTradeIds.size} trade(s) permanently deleted`);
        setSelectedTradeIds(new Set());
        fetchTrades();
        onTradesChange?.();
      }
    } else {
      // Soft delete
      if (!confirm(`Are you sure you want to delete ${selectedTradeIds.size} trade(s)? You can recover them within 48 hours.`)) {
        return;
      }

      const { error } = await supabase
        .from('trades')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', Array.from(selectedTradeIds));

      if (error) {
        toast.error('Failed to delete trades');
      } else {
        toast.success(`${selectedTradeIds.size} trade(s) deleted successfully`);
        setSelectedTradeIds(new Set());
        fetchTrades();
        onTradesChange?.();
      }
    }
  };

  const handleBulkUndelete = async () => {
    if (selectedTradeIds.size === 0) return;

    const { error } = await supabase
      .from('trades')
      .update({ deleted_at: null })
      .in('id', Array.from(selectedTradeIds));

    if (error) {
      toast.error('Failed to restore trades');
    } else {
      toast.success(`${selectedTradeIds.size} trade(s) restored successfully`);
      setSelectedTradeIds(new Set());
      fetchTrades();
      onTradesChange?.();
    }
  };

  const fetchTrades = async () => {
    if (!user) return;

    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);

    // Filter by deleted status
    if (showDeleted) {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
    }

    query = query.order('trade_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load trades');
    } else {
      // Load signed URLs for screenshots
      const tradesWithSignedUrls = await Promise.all((data || []).map(async (trade) => {
        let signedUrl = trade.screenshot_url;
        
        if (trade.screenshot_url && user) {
          // Extract file name from URL or construct it
          const fileName = `${user.id}/${trade.id}.${trade.screenshot_url.split('.').pop()}`;
          
          const { data: urlData } = await supabase.storage
            .from('trade-screenshots')
            .createSignedUrl(fileName, 3600); // 1 hour expiry
          
          if (urlData) {
            signedUrl = urlData.signedUrl;
          }
        }
        
        return {
          ...trade,
          screenshot_url: signedUrl,
          side: trade.side as 'long' | 'short' | null
        };
      }));
      
      setTrades(tradesWithSignedUrls);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (showDeleted) {
      if (!confirm('Are you sure you want to permanently delete this trade? This cannot be undone.')) return;
      
      const { error } = await supabase.from('trades').delete().eq('id', id);

      if (error) {
        toast.error('Failed to delete trade');
      } else {
        toast.success('Trade permanently deleted');
        fetchTrades();
        onTradesChange?.();
      }
    } else {
      if (!confirm('Are you sure you want to delete this trade? You can recover it within 48 hours.')) return;

      const { error } = await supabase
        .from('trades')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete trade');
      } else {
        toast.success('Trade deleted');
        fetchTrades();
        onTradesChange?.();
      }
    }
  };

  const handleUndelete = async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      toast.error('Failed to restore trade');
    } else {
      toast.success('Trade restored');
      fetchTrades();
      onTradesChange?.();
    }
  };

  const handleView = (trade: Trade) => {
    setSelectedTrade(trade);
    setViewDialogOpen(true);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade({ ...trade });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTrade || !user) return;

    const entry = editingTrade.entry_price;
    const exit = editingTrade.exit_price;
    const size = editingTrade.position_size;
    
    const pnl = (exit - entry) * size;
    const roi = ((exit - entry) / entry) * 100;

    const { error } = await supabase
      .from('trades')
      .update({
        symbol: editingTrade.symbol,
        entry_price: entry,
        exit_price: exit,
        position_size: size,
        side: editingTrade.side,
        leverage: editingTrade.leverage || 1,
        funding_fee: editingTrade.funding_fee || 0,
        trading_fee: editingTrade.trading_fee || 0,
        setup: editingTrade.setup || null,
        broker: editingTrade.broker || null,
        emotional_tag: editingTrade.emotional_tag || null,
        emotion_tags: editingTrade.emotion_tags || [],
        error_tags: editingTrade.error_tags || [],
        notes: editingTrade.notes || null,
        pnl,
        roi,
        profit_loss: pnl
      })
      .eq('id', editingTrade.id);

    if (error) {
      toast.error('Failed to update trade');
    } else {
      toast.success('Trade updated successfully');
      setEditDialogOpen(false);
      setEditingTrade(null);
      fetchTrades();
      onTradesChange?.();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Trade History</h1>
        <div className="flex items-center gap-2">
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
          />
          {dateRange?.from && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <BlurToggleButton />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by symbol, setup, or broker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select 
          value={sortBy} 
          onValueChange={(value) => setSortBy(value as 'date' | 'pnl' | 'roi')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-sm">
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="pnl">Sort by P&L</SelectItem>
            <SelectItem value="roi">Sort by ROI</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Panel */}
        <TradeFilterPanel
          filterType={filterType}
          onFilterChange={setFilterType}
        />

        {/* Density Toggle */}
        <DensityToggle
          density={density}
          onDensityChange={setDensity}
        />

        {/* Export */}
        {!showDeleted && trades.length > 0 && (
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}

        {/* Deleted toggle */}
        <Button
          variant={showDeleted ? 'default' : 'outline'}
          onClick={() => setShowDeleted(!showDeleted)}
          className="ml-auto"
        >
          {showDeleted ? 'Show Active' : 'Show Deleted'}
        </Button>
      </div>

      {/* Deleted warning banner */}
      {showDeleted && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ <strong>Deleted Trades:</strong> These trades are available for recovery for 48 hours. 
            After that, they will be permanently removed from the system.
          </p>
        </div>
      )}

      {/* Bulk selection toolbar */}
      {filteredTrades.length > 0 && (
        <div 
          className="flex items-center justify-between p-4 rounded-xl"
          style={{
            background: 'rgba(17, 20, 24, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedTradeIds.size === filteredTrades.length && filteredTrades.length > 0}
              onCheckedChange={toggleAllTrades}
              aria-label="Select all trades"
            />
            <span className="text-sm text-muted-foreground">
              {selectedTradeIds.size > 0 
                ? `${selectedTradeIds.size} trade(s) selected`
                : 'Select all'
              }
            </span>
          </div>
          {selectedTradeIds.size > 0 && (
            <div className="flex gap-2">
              {showDeleted ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkUndelete}
                  >
                    Restore Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    Delete Permanently
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trade list */}
      {filteredTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            No trades found matching your filters
          </p>
          {!showDeleted && (
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or import trades to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTrades.map((trade) => (
            <TradeRowCard
              key={trade.id}
              trade={trade}
              isSelected={selectedTradeIds.has(trade.id)}
              isExpanded={expandedRows.has(trade.id)}
              density={density}
              onSelect={toggleTradeSelection}
              onToggleExpand={toggleRowExpand}
              onView={handleView}
              onEdit={handleEdit}
              onShare={(trade) => {
                setTradeToShare(trade);
                setShareDialogOpen(true);
              }}
              onDelete={handleDelete}
              onUndelete={handleUndelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredTrades.length > 0 && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          totalItems={filteredTrades.length}
          itemsPerPage={pagination.itemsPerPage}
        />
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
            <DialogDescription>
              {selectedTrade && format(new Date(selectedTrade.opened_at || selectedTrade.trade_date), 'MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Symbol</p>
                  <p className="font-medium">{selectedTrade.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position Type</p>
                  <p className="font-medium">
                    {selectedTrade.side ? (
                      <Badge 
                        variant="outline" 
                        className={selectedTrade.side === 'long' ? 'border-neon-green text-neon-green' : 'border-neon-red text-neon-red'}
                      >
                        {selectedTrade.side.toUpperCase()}
                      </Badge>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setup</p>
                  <p className="font-medium">{selectedTrade.setup || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Broker</p>
                  <p className="font-medium">{selectedTrade.broker || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emotional Tag</p>
                  <p className="font-medium">{selectedTrade.emotional_tag || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Price</p>
                  <p className="font-medium">{selectedTrade.entry_price != null ? `$${selectedTrade.entry_price.toFixed(2)}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exit Price</p>
                  <p className="font-medium">{selectedTrade.exit_price != null ? `$${selectedTrade.exit_price.toFixed(2)}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position Size</p>
                  <p className="font-medium">{selectedTrade.position_size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leverage</p>
                  <p className="font-medium">{selectedTrade.leverage || 1}x</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedTrade.duration_minutes}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L</p>
                  {selectedTrade.pnl != null ? (
                    <p className={`font-medium ${(selectedTrade.pnl ?? 0) === 0 ? 'text-foreground' : (selectedTrade.pnl ?? 0) > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      ${selectedTrade.pnl.toFixed(2)}
                    </p>
                  ) : <p className="font-medium">-</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  {selectedTrade.roi != null ? (
                    <p className={`font-medium ${(selectedTrade.roi ?? 0) === 0 ? 'text-foreground' : (selectedTrade.roi ?? 0) > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {selectedTrade.roi.toFixed(2)}%
                    </p>
                  ) : <p className="font-medium">-</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funding Fee</p>
                  <p className={`font-medium ${
                    (selectedTrade.funding_fee || 0) === 0 
                      ? 'text-foreground' 
                      : (selectedTrade.funding_fee || 0) > 0 
                      ? 'text-neon-green' 
                      : 'text-neon-red'
                  }`}>
                    ${(selectedTrade.funding_fee || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trading Fee</p>
                  <p className={`font-medium ${
                    (selectedTrade.trading_fee || 0) === 0 
                      ? 'text-foreground' 
                      : (selectedTrade.trading_fee || 0) > 0 
                      ? 'text-neon-green' 
                      : 'text-neon-red'
                  }`}>
                    ${(selectedTrade.trading_fee || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {selectedTrade.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedTrade.notes}</p>
                </div>
              )}
              {selectedTrade.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                  <img
                    src={selectedTrade.screenshot_url}
                    alt="Trade screenshot"
                    className="w-full rounded-md border border-border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
            <DialogDescription>
              Update the trade details below
            </DialogDescription>
          </DialogHeader>
          {editingTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Symbol *</Label>
                  <Input
                    value={editingTrade.symbol}
                    onChange={(e) => setEditingTrade({ ...editingTrade, symbol: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Position Type *</Label>
                  <Select
                    value={editingTrade.side || 'long'}
                    onValueChange={(value: 'long' | 'short') => 
                      setEditingTrade({ ...editingTrade, side: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Entry Price *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={editingTrade.entry_price ?? ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, entry_price: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Exit Price *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={editingTrade.exit_price ?? ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, exit_price: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Position Size *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={editingTrade.position_size ?? ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, position_size: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Leverage</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editingTrade.leverage ?? 1}
                    onChange={(e) => setEditingTrade({ ...editingTrade, leverage: e.target.value ? parseFloat(e.target.value) : 1 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Funding Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTrade.funding_fee || 0}
                    onChange={(e) => setEditingTrade({ ...editingTrade, funding_fee: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Trading Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTrade.trading_fee || 0}
                    onChange={(e) => setEditingTrade({ ...editingTrade, trading_fee: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Setup</Label>
                  <Input
                    value={editingTrade.setup || ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, setup: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Broker</Label>
                  <Input
                    value={editingTrade.broker || ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, broker: e.target.value })}
                    className="mt-1"
                  />
                </div>

              </div>

              <TradeTagSelector
                emotionTags={editingTrade.emotion_tags || []}
                errorTags={editingTrade.error_tags || []}
                onEmotionTagsChange={(tags) => setEditingTrade({ ...editingTrade, emotion_tags: tags })}
                onErrorTagsChange={(tags) => setEditingTrade({ ...editingTrade, error_tags: tags })}
              />

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingTrade.notes || ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, notes: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Trade Card Dialog */}
      <ShareTradeCard
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        trade={tradeToShare}
      />

      {/* Export Trades Dialog */}
      <ExportTradesDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        trades={filteredTrades}
      />
    </div>
  );
});

TradeHistory.displayName = 'TradeHistory';
