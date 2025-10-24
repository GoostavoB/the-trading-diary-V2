import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useRequestCache } from '@/hooks/useRequestCache';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Eye, Search, Settings2, X, Share2, Download } from 'lucide-react';
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
import { TradeFilters } from '@/components/trade-history/TradeFilters';
import { TradeTableRow } from '@/components/trade-history/TradeTableRow';
import { BulkActionsToolbar } from '@/components/trade-history/BulkActionsToolbar';
import { useTradePagination } from '@/components/trade-history/useTradePagination';
import { PaginationControls } from '@/components/trade-history/PaginationControls';
import { useBrokerPreferences } from '@/hooks/useBrokerPreferences';
import { ExportTradesDialog } from '@/components/ExportTradesDialog';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDateRange } from '@/contexts/DateRangeContext';

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
  const { sortedBrokers, incrementUsage: incrementBrokerUsage } = useBrokerPreferences();
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
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('tradeHistoryColumns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [userSetups, setUserSetups] = useState<string[]>([]);
  const [editingSetup, setEditingSetup] = useState<string | null>(null);
  const [setupSearch, setSetupSearch] = useState('');
  const [setupPopoverOpen, setSetupPopoverOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<string | null>(null);
  const [brokerSearch, setBrokerSearch] = useState('');
  const [brokerPopoverOpen, setBrokerPopoverOpen] = useState(false);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [errorPopoverOpen, setErrorPopoverOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [tradeToShare, setTradeToShare] = useState<Trade | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
      filtered = filtered.filter((t) => (t.pnl || 0) > 0);
    } else if (filterType === 'losses') {
      filtered = filtered.filter((t) => (t.pnl || 0) <= 0);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
      } else if (sortBy === 'pnl') {
        return (b.pnl || 0) - (a.pnl || 0);
      } else if (sortBy === 'roi') {
        return (b.roi || 0) - (a.roi || 0);
      }
      return 0;
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
      fetchUserSetups();
    }
  }, [user, showDeleted]);

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
  }, [debouncedSearchTerm, filterType, sortBy, showDeleted, dateRange]);

  useEffect(() => {
    localStorage.setItem('tradeHistoryColumns', JSON.stringify(columns));
  }, [columns]);

  const toggleColumn = (key: ColumnKey) => {
    setColumns(cols => cols.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };

  const isColumnVisible = (key: ColumnKey) => {
    return columns.find(col => col.key === key)?.visible ?? true;
  };

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

  const fetchUserSetups = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_setups')
      .select('name')
      .eq('user_id', user.id);
    
    if (data) {
      setUserSetups(data.map(s => s.name));
    }
  };


  const handleSetupUpdate = async (tradeId: string, setup: string) => {
    const { error } = await supabase
      .from('trades')
      .update({ setup })
      .eq('id', tradeId);

    if (error) {
      toast.error('Failed to update setup');
    } else {
      // Check if setup exists in user_setups, if not create it
      if (setup && !userSetups.includes(setup)) {
        const { error: setupError } = await supabase
          .from('user_setups')
          .insert({ user_id: user?.id, name: setup });
        
        if (!setupError) {
          setUserSetups([...userSetups, setup]);
        }
      }
      
      setTrades(trades.map(t => t.id === tradeId ? { ...t, setup } : t));
      toast.success('Setup updated');
      setEditingSetup(null);
      setSetupSearch('');
      onTradesChange?.();
    }
  };

  const handleBrokerUpdate = async (tradeId: string, broker: string) => {
    const { error } = await supabase
      .from('trades')
      .update({ broker })
      .eq('id', tradeId);

    if (error) {
      toast.error('Failed to update broker');
    } else {
      // Track usage of this broker
      incrementBrokerUsage(broker);
      
      setTrades(trades.map(t => t.id === tradeId ? { ...t, broker } : t));
      toast.success('Broker updated');
      setEditingBroker(null);
      setBrokerSearch('');
      onTradesChange?.();
    }
  };

  const handleErrorUpdate = async (tradeId: string, error_description: string) => {
    // Note: error_description field needs to be added to trades table schema
    // Temporarily disabled until migration is run
    toast.info('Error field feature coming soon - database migration pending');
    setEditingError(null);
    setErrorText('');
    setErrorPopoverOpen(false);
    return;
    
    /* Uncomment after adding error_description column to trades table
    const { error } = await supabase
      .from('trades')
      .update({ error_description })
      .eq('id', tradeId);

    if (error) {
      toast.error('Failed to update error field');
    } else {
      setTrades(trades.map(t => t.id === tradeId ? { ...t, error_description } : t));
      toast.success('Error field updated');
      setEditingError(null);
      setErrorText('');
      setErrorPopoverOpen(false);
      onTradesChange?.();
    }
    */
  };

  if (loading) {
    return <div className="text-center py-8">Loading trades...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Trade History</h2>
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
              className="h-9"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <BlurToggleButton />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <TradeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterType={filterType}
          onFilterChange={setFilterType}
          showDeleted={showDeleted}
          onShowDeletedChange={setShowDeleted}
          columns={columns}
          onColumnsChange={(newColumns) => {
            setColumns(newColumns);
            localStorage.setItem('tradeHistoryColumns', JSON.stringify(newColumns));
          }}
        />
        {!showDeleted && trades.length > 0 && (
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            className="md:ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {showDeleted && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ <strong>Deleted Trades:</strong> These trades are available for recovery for 48 hours. 
            After that, they will be permanently removed from the system.
          </p>
        </div>
      )}

      {selectedTradeIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedTradeIds.size} trade(s) selected
          </span>
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No trades found matching your filters
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTradeIds.size === filteredTrades.length && filteredTrades.length > 0}
                    onCheckedChange={toggleAllTrades}
                  />
                </TableHead>
                {isColumnVisible('date') && <TableHead>Date</TableHead>}
                {isColumnVisible('symbol') && <TableHead>Symbol</TableHead>}
                {isColumnVisible('setup') && <TableHead>Setup</TableHead>}
                {isColumnVisible('broker') && <TableHead>Broker</TableHead>}
                {isColumnVisible('type') && <TableHead>Type</TableHead>}
                {isColumnVisible('entry') && <TableHead>Entry</TableHead>}
                {isColumnVisible('exit') && <TableHead>Exit</TableHead>}
                {isColumnVisible('size') && <TableHead>Size</TableHead>}
                {isColumnVisible('pnl') && <TableHead>P&L</TableHead>}
                {isColumnVisible('roi') && <TableHead>ROI</TableHead>}
                {isColumnVisible('fundingFee') && <TableHead>Funding Fee</TableHead>}
                {isColumnVisible('tradingFee') && <TableHead>Trading Fee</TableHead>}
                {isColumnVisible('error') && <TableHead>Error/Mistake</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTradeIds.has(trade.id)}
                      onCheckedChange={() => toggleTradeSelection(trade.id)}
                    />
                  </TableCell>
                  {isColumnVisible('date') && (
                    <TableCell>{format(new Date(trade.trade_date), 'MMM dd, yyyy')}</TableCell>
                  )}
                  {isColumnVisible('symbol') && (
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                  )}
                  {isColumnVisible('setup') && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{trade.setup || '-'}</span>
                        <Popover 
                          open={setupPopoverOpen && editingSetup === trade.id} 
                          onOpenChange={(open) => {
                            setSetupPopoverOpen(open);
                            if (!open) {
                              setEditingSetup(null);
                              setSetupSearch('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingSetup(trade.id);
                                setSetupSearch(trade.setup || '');
                                setSetupPopoverOpen(true);
                              }}
                            >
                              <Pencil size={12} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0 bg-card border-border z-50" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search or add setup..." 
                                value={setupSearch}
                                onValueChange={setSetupSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                                    onClick={() => {
                                      if (setupSearch.trim()) {
                                        handleSetupUpdate(trade.id, setupSearch.trim());
                                      }
                                    }}
                                  >
                                    + Add "{setupSearch}"
                                  </button>
                                </CommandEmpty>
                                {userSetups.filter(s => 
                                  s.toLowerCase().includes(setupSearch.toLowerCase())
                                ).length > 0 && (
                                  <CommandGroup heading="Existing Setups">
                                    {userSetups
                                      .filter(s => s.toLowerCase().includes(setupSearch.toLowerCase()))
                                      .map(setup => (
                                        <CommandItem
                                          key={setup}
                                          onSelect={() => handleSetupUpdate(trade.id, setup)}
                                        >
                                          {setup}
                                        </CommandItem>
                                      ))
                                    }
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  )}
                  {isColumnVisible('broker') && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{trade.broker || '-'}</span>
                        <Popover 
                          open={brokerPopoverOpen && editingBroker === trade.id} 
                          onOpenChange={(open) => {
                            setBrokerPopoverOpen(open);
                            if (!open) {
                              setEditingBroker(null);
                              setBrokerSearch('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingBroker(trade.id);
                                setBrokerSearch(trade.broker || '');
                                setBrokerPopoverOpen(true);
                              }}
                            >
                              <Pencil size={12} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[240px] p-0 bg-card border-border z-50" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search or add broker..." 
                                value={brokerSearch}
                                onValueChange={setBrokerSearch}
                              />
                              <CommandList>
                                <CommandGroup>
                                  {sortedBrokers
                                    .filter(b => b.toLowerCase().includes(brokerSearch.toLowerCase()))
                                    .map(broker => (
                                      <CommandItem
                                        key={broker}
                                        onSelect={() => handleBrokerUpdate(trade.id, broker)}
                                      >
                                        {broker}
                                      </CommandItem>
                                    ))
                                  }
                                </CommandGroup>
                                {brokerSearch && !sortedBrokers.some(b => b.toLowerCase() === brokerSearch.toLowerCase()) && (
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        if (brokerSearch.trim()) {
                                          handleBrokerUpdate(trade.id, brokerSearch.trim());
                                        }
                                      }}
                                      className="text-primary"
                                    >
                                      + Add "{brokerSearch}"
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  )}
                  {isColumnVisible('type') && (
                    <TableCell>
                      {trade.side ? (
                        <Badge 
                          variant="outline" 
                          className={trade.side === 'long' ? 'border-neon-green text-neon-green' : 'border-neon-red text-neon-red'}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                  )}
                  {isColumnVisible('entry') && (
                    <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                  )}
                  {isColumnVisible('exit') && (
                    <TableCell>${trade.exit_price.toFixed(2)}</TableCell>
                  )}
                  {isColumnVisible('size') && (
                    <TableCell>{trade.position_size}</TableCell>
                  )}
                  {isColumnVisible('pnl') && (
                    <TableCell>
                      <span className={trade.pnl === 0 ? 'text-foreground' : trade.pnl > 0 ? 'text-neon-green' : 'text-neon-red'}>
                        ${trade.pnl.toFixed(2)}
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible('roi') && (
                    <TableCell>
                      <span className={trade.roi === 0 ? 'text-foreground' : trade.roi > 0 ? 'text-neon-green' : 'text-neon-red'}>
                        {trade.roi.toFixed(2)}%
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible('fundingFee') && (
                    <TableCell>
                      <span className={
                        (trade.funding_fee || 0) === 0 
                          ? 'text-foreground' 
                          : (trade.funding_fee || 0) > 0 
                          ? 'text-neon-green' 
                          : 'text-neon-red'
                      }>
                        ${(trade.funding_fee || 0).toFixed(2)}
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible('tradingFee') && (
                    <TableCell>
                      <span className={
                        (trade.trading_fee || 0) === 0 
                          ? 'text-foreground' 
                          : (trade.trading_fee || 0) > 0 
                          ? 'text-neon-green' 
                          : 'text-neon-red'
                      }>
                        ${(trade.trading_fee || 0).toFixed(2)}
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible('error') && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm truncate max-w-[200px]" title={trade.error_description || ''}>
                          {trade.error_description || '-'}
                        </span>
                        <Popover 
                          open={errorPopoverOpen && editingError === trade.id} 
                          onOpenChange={(open) => {
                            setErrorPopoverOpen(open);
                            if (!open) {
                              setEditingError(null);
                              setErrorText('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingError(trade.id);
                                setErrorText(trade.error_description || '');
                                setErrorPopoverOpen(true);
                              }}
                            >
                              <Pencil size={12} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-4 bg-card border-border z-50" align="start">
                            <div className="space-y-3">
                              <Label htmlFor="error-input">Error/Mistake</Label>
                              <Textarea 
                                id="error-input"
                                placeholder="Describe what went wrong..." 
                                value={errorText}
                                onChange={(e) => setErrorText(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingError(null);
                                    setErrorText('');
                                    setErrorPopoverOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleErrorUpdate(trade.id, errorText)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {showDeleted ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(trade)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUndelete(trade.id)}
                          >
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(trade.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(trade)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setTradeToShare(trade);
                              setShareDialogOpen(true);
                            }}
                            title="Share Trade"
                          >
                            <Share2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(trade)}
                            title="Edit Trade"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trade.id)}
                            title="Delete Trade"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
              {selectedTrade && format(new Date(selectedTrade.trade_date), 'MMMM dd, yyyy')}
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
                  <p className="font-medium">${selectedTrade.entry_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exit Price</p>
                  <p className="font-medium">${selectedTrade.exit_price.toFixed(2)}</p>
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
                  <p className={`font-medium ${selectedTrade.pnl === 0 ? 'text-foreground' : selectedTrade.pnl > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    ${selectedTrade.pnl.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className={`font-medium ${selectedTrade.roi === 0 ? 'text-foreground' : selectedTrade.roi > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {selectedTrade.roi.toFixed(2)}%
                  </p>
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
                    value={editingTrade.entry_price}
                    onChange={(e) => setEditingTrade({ ...editingTrade, entry_price: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Exit Price *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={editingTrade.exit_price}
                    onChange={(e) => setEditingTrade({ ...editingTrade, exit_price: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Position Size *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={editingTrade.position_size}
                    onChange={(e) => setEditingTrade({ ...editingTrade, position_size: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Leverage</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editingTrade.leverage || 1}
                    onChange={(e) => setEditingTrade({ ...editingTrade, leverage: parseFloat(e.target.value) })}
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

                <div>
                  <Label>Emotional Tag</Label>
                  <Input
                    value={editingTrade.emotional_tag || ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, emotional_tag: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

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
