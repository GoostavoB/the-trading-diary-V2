import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import { Pencil, Trash2, Eye, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
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

interface Trade {
  id: string;
  asset: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  roi: number;
  setup: string;
  broker: string;
  emotional_tag: string;
  notes: string;
  duration_minutes: number;
  trade_date: string;
  screenshot_url: string | null;
  position_type?: 'long' | 'short';
  funding_fee?: number;
  trading_fee?: number;
  leverage?: number;
}

type ColumnKey = 'date' | 'asset' | 'setup' | 'broker' | 'type' | 'entry' | 'exit' | 'size' | 'pnl' | 'roi' | 'fundingFee' | 'tradingFee';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'asset', label: 'Asset', visible: true },
  { key: 'setup', label: 'Setup', visible: true },
  { key: 'broker', label: 'Broker', visible: true },
  { key: 'type', label: 'Type', visible: true },
  { key: 'entry', label: 'Entry', visible: true },
  { key: 'exit', label: 'Exit', visible: true },
  { key: 'size', label: 'Size', visible: true },
  { key: 'pnl', label: 'P&L', visible: true },
  { key: 'roi', label: 'ROI', visible: true },
  { key: 'fundingFee', label: 'Funding Fee', visible: true },
  { key: 'tradingFee', label: 'Trading Fee', visible: true },
];

interface TradeHistoryProps {
  onTradesChange?: () => void;
}

export const TradeHistory = ({ onTradesChange }: TradeHistoryProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'roi'>('date');
  const [filterType, setFilterType] = useState<'all' | 'wins' | 'losses'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
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
  const [userBrokers, setUserBrokers] = useState<string[]>([]);

  useEffect(() => {
    fetchTrades();
    fetchUserSetups();
    fetchUserBrokers();
  }, [user, showDeleted]);

  useEffect(() => {
    filterAndSortTrades();
  }, [trades, searchTerm, sortBy, filterType]);

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
          position_type: trade.position_type as 'long' | 'short' | undefined
        };
      }));
      
      setTrades(tradesWithSignedUrls);
    }
    setLoading(false);
  };

  const filterAndSortTrades = () => {
    let filtered = [...trades];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.setup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.broker?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'wins') {
      filtered = filtered.filter((t) => t.pnl > 0);
    } else if (filterType === 'losses') {
      filtered = filtered.filter((t) => t.pnl <= 0);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
      } else if (sortBy === 'pnl') {
        return b.pnl - a.pnl;
      } else if (sortBy === 'roi') {
        return b.roi - a.roi;
      }
      return 0;
    });

    setFilteredTrades(filtered);
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

  const fetchUserBrokers = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('trades')
      .select('broker')
      .eq('user_id', user.id)
      .not('broker', 'is', null);
    
    if (data) {
      const uniqueBrokers = [...new Set(data.map(t => t.broker).filter(Boolean))];
      setUserBrokers(uniqueBrokers as string[]);
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
      if (broker && !userBrokers.includes(broker)) {
        setUserBrokers([...userBrokers, broker]);
      }
      
      setTrades(trades.map(t => t.id === tradeId ? { ...t, broker } : t));
      toast.success('Broker updated');
      setEditingBroker(null);
      setBrokerSearch('');
      onTradesChange?.();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading trades...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search by asset, setup, or broker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="pnl">Sort by P&L</SelectItem>
            <SelectItem value="roi">Sort by ROI</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="wins">Wins Only</SelectItem>
            <SelectItem value="losses">Losses Only</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showDeleted ? "default" : "outline"}
          onClick={() => {
            setShowDeleted(!showDeleted);
            setSelectedTradeIds(new Set());
          }}
        >
          {showDeleted ? "Show Active" : "Show Deleted"}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-card border-border z-50">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Customize Columns</h4>
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
                {isColumnVisible('asset') && <TableHead>Asset</TableHead>}
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
                  {isColumnVisible('asset') && (
                    <TableCell className="font-medium">{trade.asset}</TableCell>
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
                          <PopoverContent className="w-[200px] p-0 bg-card border-border z-50" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search or add broker..." 
                                value={brokerSearch}
                                onValueChange={setBrokerSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                                    onClick={() => {
                                      if (brokerSearch.trim()) {
                                        handleBrokerUpdate(trade.id, brokerSearch.trim());
                                      }
                                    }}
                                  >
                                    + Add "{brokerSearch}"
                                  </button>
                                </CommandEmpty>
                                {userBrokers.filter(b => 
                                  b.toLowerCase().includes(brokerSearch.toLowerCase())
                                ).length > 0 && (
                                  <CommandGroup heading="Existing Brokers">
                                    {userBrokers
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
                      {trade.position_type ? (
                        <Badge 
                          variant="outline" 
                          className={trade.position_type === 'long' ? 'border-neon-green text-neon-green' : 'border-neon-red text-neon-red'}
                        >
                          {trade.position_type.toUpperCase()}
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
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/upload?edit=${trade.id}`)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trade.id)}
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
                  <p className="text-sm text-muted-foreground">Asset</p>
                  <p className="font-medium">{selectedTrade.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position Type</p>
                  <p className="font-medium">
                    {selectedTrade.position_type ? (
                      <Badge 
                        variant="outline" 
                        className={selectedTrade.position_type === 'long' ? 'border-neon-green text-neon-green' : 'border-neon-red text-neon-red'}
                      >
                        {selectedTrade.position_type.toUpperCase()}
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
    </div>
  );
};
