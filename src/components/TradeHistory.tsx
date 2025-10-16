import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Pencil, Trash2, Eye, Search } from 'lucide-react';
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
}

export const TradeHistory = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'roi'>('date');
  const [filterType, setFilterType] = useState<'all' | 'wins' | 'losses'>('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, [user]);

  useEffect(() => {
    filterAndSortTrades();
  }, [trades, searchTerm, sortBy, filterType]);

  const fetchTrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false });

    if (error) {
      toast.error('Failed to load trades');
    } else {
      setTrades((data || []).map(trade => ({
        ...trade,
        position_type: trade.position_type as 'long' | 'short' | undefined
      })));
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
    if (!confirm('Are you sure you want to delete this trade?')) return;

    const { error } = await supabase.from('trades').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete trade');
    } else {
      toast.success('Trade deleted');
      fetchTrades();
    }
  };

  const handleView = (trade: Trade) => {
    setSelectedTrade(trade);
    setViewDialogOpen(true);
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
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No trades found matching your filters
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Funding Fee</TableHead>
                <TableHead>Trading Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{format(new Date(trade.trade_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium">{trade.asset}</TableCell>
                  <TableCell>{trade.setup || '-'}</TableCell>
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
                  <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                  <TableCell>${trade.exit_price.toFixed(2)}</TableCell>
                  <TableCell>{trade.position_size}</TableCell>
                  <TableCell>
                    <span className={trade.pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}>
                      ${trade.pnl.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.roi >= 0 ? 'default' : 'destructive'}>
                      {trade.roi.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      ${(trade.funding_fee || 0).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      ${(trade.trading_fee || 0).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        onClick={() => window.location.href = `/upload?edit=${trade.id}`}
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
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedTrade.duration_minutes}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L</p>
                  <p className={`font-medium ${selectedTrade.pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    ${selectedTrade.pnl.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className={`font-medium ${selectedTrade.roi >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {selectedTrade.roi.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funding Fee</p>
                  <p className="font-medium">${(selectedTrade.funding_fee || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trading Fee</p>
                  <p className="font-medium">${(selectedTrade.trading_fee || 0).toFixed(2)}</p>
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
