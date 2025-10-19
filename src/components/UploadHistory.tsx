import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UploadBatch {
  id: string;
  created_at: string;
  trade_count: number;
  assets: string[];
  total_pnl?: number;
  trades?: BatchTrade[];
  position_types?: string[];
  brokers?: string[];
  most_recent_trade_date?: string;
}

interface BatchTrade {
  id: string;
  symbol: string;
  trade_date: string;
  side: 'long' | 'short' | null;
  entry_price: number;
  profit_loss: number;
}

export const UploadHistory = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchTrades, setBatchTrades] = useState<Record<string, BatchTrade[]>>({});
  const [newBatchId, setNewBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBatches();
      
      // Subscribe to new batches
      const channel = supabase
        .channel('upload-batches-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'upload_batches',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Refresh the entire list when a new batch is added
            fetchBatches();
            setNewBatchId(payload.new.id as string);
            
            // Remove the animation class after animation completes
            setTimeout(() => {
              setNewBatchId(null);
            }, 600);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchBatches = async () => {
    if (!user) return;

    setLoading(true);
    
    const { data, error } = await supabase
      .from('upload_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching batches:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      setBatches([]);
      setLoading(false);
      return;
    }

    // Fetch additional info for each batch
    const enrichedBatches = await Promise.all(
      data.map(async (batch) => {
        // Fetch trades for this batch (within 5 seconds of batch creation)
        const { data: trades } = await supabase
          .from('trades')
          .select('trade_date, side, broker, profit_loss')
          .eq('user_id', user.id)
          .gte('created_at', new Date(new Date(batch.created_at).getTime() - 5000).toISOString())
          .lte('created_at', new Date(new Date(batch.created_at).getTime() + 5000).toISOString())
          .order('trade_date', { ascending: false });

        // Get unique position types and brokers
        const positionTypes = trades ? [...new Set(trades.map(t => t.side).filter(Boolean))] : [];
        const brokers = trades ? [...new Set(trades.map(t => t.broker).filter(Boolean))] : [];
        
        // Calculate total P&L
        const totalPnl = trades ? trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) : 0;
        
        // Get most recent trade date
        const mostRecentTradeDate = trades && trades.length > 0 ? trades[0].trade_date : batch.created_at;

        return {
          ...batch,
          most_recent_trade_date: mostRecentTradeDate,
          position_types: positionTypes as string[],
          brokers: brokers as string[],
          total_pnl: totalPnl
        };
      })
    );

    // Sort by most recent trade date
    enrichedBatches.sort((a, b) => 
      new Date(b.most_recent_trade_date).getTime() - new Date(a.most_recent_trade_date).getTime()
    );

    setBatches(enrichedBatches.slice(0, 20));
    setLoading(false);
  };

  const fetchBatchTrades = async (batchId: string, createdAt: string) => {
    if (!user || batchTrades[batchId]) return;

    // Fetch trades created within 5 seconds of the batch
    const batchTime = new Date(createdAt);
    const startTime = new Date(batchTime.getTime() - 5000);
    const endTime = new Date(batchTime.getTime() + 5000);

    const { data, error } = await supabase
      .from('trades')
      .select('id, symbol, trade_date, side, entry_price, profit_loss')
      .eq('user_id', user.id)
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .order('trade_date', { ascending: false });

    if (!error && data) {
      setBatchTrades(prev => ({ ...prev, [batchId]: data as BatchTrade[] }));
    }
  };

  const toggleExpand = (batchId: string, createdAt: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
    } else {
      setExpandedBatch(batchId);
      fetchBatchTrades(batchId, createdAt);
    }
  };

  const handleDeleteBatch = async (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this upload batch? This will not delete the trades.')) return;

    const { error } = await supabase
      .from('upload_batches')
      .delete()
      .eq('id', batchId);

    if (error) {
      toast.error('Failed to delete batch');
    } else {
      setBatches(prev => prev.filter(b => b.id !== batchId));
      toast.success('Batch deleted');
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!user) return;
    
    if (!confirm('Delete entire upload history? This will not delete the trades themselves.')) return;

    const { error } = await supabase
      .from('upload_batches')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete history');
    } else {
      setBatches([]);
      toast.success('All history deleted');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Upload History</h3>
        <Card className="p-4 border-border">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-muted-foreground">Loading upload history...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload History</h3>
        {batches.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAllHistory}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All History
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {batches.map((batch) => {
          const isExpanded = expandedBatch === batch.id;
          const isNew = newBatchId === batch.id;
          
          return (
            <Card
              key={batch.id}
              className={`group glass backdrop-blur-[12px] rounded-2xl p-5 cursor-pointer hover-lift transition-all shadow-sm ${
                isNew ? 'animate-slide-in-top' : ''
              }`}
              onClick={() => toggleExpand(batch.id, batch.created_at)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-foreground">
                    {format(new Date(batch.created_at), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-muted/50">
                    {format(new Date(batch.created_at), 'HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-primary transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground transition-colors" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                    onClick={(e) => handleDeleteBatch(batch.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2.5">
                {batch.brokers && batch.brokers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Broker:</span>
                    <span className="text-sm font-medium text-foreground">{batch.brokers.join(', ')}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                    {batch.trade_count} {batch.trade_count === 1 ? 'trade' : 'trades'}
                  </Badge>
                  {batch.position_types && batch.position_types.length > 0 && (
                    <>
                      {batch.position_types.map((type) => (
                        <Badge
                          key={type}
                          className={`text-xs font-semibold px-2.5 py-0.5 ${
                            type === 'long'
                              ? 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green/20'
                              : 'bg-neon-red/10 text-neon-red border-neon-red/30 hover:bg-neon-red/20'
                          }`}
                        >
                          {type.toUpperCase()}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>

                {batch.assets && batch.assets.length > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Assets:</span>{' '}
                    <span className="font-medium text-foreground break-words">
                      {batch.assets.join(', ')}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 mt-3 border-t border-border/30">
                  <div>
                    <span className="text-xs text-muted-foreground">Total P&L: </span>
                    <span className={`text-lg font-bold ${(batch.total_pnl || 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      ${(batch.total_pnl || 0).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Uploaded {format(new Date(batch.created_at), 'MM/dd/yyyy')} at {format(new Date(batch.created_at), 'HH:mm')}
                  </span>
                </div>
              </div>
              
              {isExpanded && batchTrades[batch.id] && (
                <div className="mt-4 pt-4 border-t border-border/30 space-y-2 animate-fade-in">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                    Trade Details ({batchTrades[batch.id].length})
                  </div>
                  {batchTrades[batch.id].map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl glass-subtle hover:glass transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 flex-wrap">
                        <span className="font-semibold text-foreground text-sm min-w-[80px]">{trade.symbol}</span>
                        <span className="text-xs text-muted-foreground font-medium">${trade.entry_price.toFixed(2)}</span>
                        <Badge
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            trade.side === 'long'
                              ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                              : 'bg-neon-red/10 text-neon-red border-neon-red/30'
                          }`}
                        >
                          {trade.side?.toUpperCase()}
                        </Badge>
                      </div>
                      <span
                        className={`font-bold text-sm ${
                          trade.profit_loss >= 0 ? 'text-neon-green' : 'text-neon-red'
                        }`}
                      >
                        ${trade.profit_loss.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
