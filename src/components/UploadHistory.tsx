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
  asset: string;
  trade_date: string;
  position_type: 'long' | 'short';
  entry_price: number;
  profit_loss: number;
}

export const UploadHistory = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchTrades, setBatchTrades] = useState<Record<string, BatchTrade[]>>({});
  const [newBatchId, setNewBatchId] = useState<string | null>(null);

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

    const { data, error } = await supabase
      .from('upload_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching batches:', error);
      return;
    }

    if (!data) {
      setBatches([]);
      return;
    }

    // Fetch additional info for each batch
    const enrichedBatches = await Promise.all(
      data.map(async (batch) => {
        // Fetch trades for this batch (within 5 seconds of batch creation)
        const { data: trades } = await supabase
          .from('trades')
          .select('trade_date, position_type, broker, profit_loss')
          .eq('user_id', user.id)
          .gte('created_at', new Date(new Date(batch.created_at).getTime() - 5000).toISOString())
          .lte('created_at', new Date(new Date(batch.created_at).getTime() + 5000).toISOString())
          .order('trade_date', { ascending: false });

        // Get unique position types and brokers
        const positionTypes = trades ? [...new Set(trades.map(t => t.position_type).filter(Boolean))] : [];
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
  };

  const fetchBatchTrades = async (batchId: string, createdAt: string) => {
    if (!user || batchTrades[batchId]) return;

    // Fetch trades created within 5 seconds of the batch
    const batchTime = new Date(createdAt);
    const startTime = new Date(batchTime.getTime() - 5000);
    const endTime = new Date(batchTime.getTime() + 5000);

    const { data, error } = await supabase
      .from('trades')
      .select('id, asset, trade_date, position_type, entry_price, profit_loss')
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
              className={`p-4 border-border cursor-pointer hover:border-foreground/20 transition-all ${
                isNew ? 'animate-slide-in-top' : ''
              }`}
              onClick={() => toggleExpand(batch.id, batch.created_at)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(batch.created_at), 'MMM dd, yyyy • HH:mm')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {batch.trade_count} {batch.trade_count === 1 ? 'trade' : 'trades'}
                      </Badge>
                      {batch.position_types && batch.position_types.length > 0 && (
                        <div className="flex gap-1">
                          {batch.position_types.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className={`text-xs ${
                                type === 'long'
                                  ? 'border-neon-green text-neon-green'
                                  : 'border-neon-red text-neon-red'
                              }`}
                            >
                              {type.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteBatch(batch.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assets: </span>
                      <span className="font-medium">{batch.assets.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total P&L: </span>
                      <span className={`font-medium ${(batch.total_pnl || 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        ${(batch.total_pnl || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {batch.brokers && batch.brokers.length > 0 && (
                        <span>
                          <span className="text-muted-foreground">Broker: </span>
                          <span className="font-medium">{batch.brokers.join(', ')}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Uploaded: {format(new Date(batch.created_at), 'MM/dd/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {isExpanded && batchTrades[batch.id] && (
                <div className="mt-4 pt-4 border-t border-border space-y-2 animate-fade-in">
                  {batchTrades[batch.id].map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium min-w-[100px]">{trade.asset}</span>
                        <span className="text-muted-foreground">${trade.entry_price.toFixed(2)}</span>
                        <Badge
                          variant="outline"
                          className={
                            trade.position_type === 'long'
                              ? 'border-neon-green text-neon-green'
                              : 'border-neon-red text-neon-red'
                          }
                        >
                          {trade.position_type.toUpperCase()}
                        </Badge>
                      </div>
                      <span
                        className={`font-medium ${
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
