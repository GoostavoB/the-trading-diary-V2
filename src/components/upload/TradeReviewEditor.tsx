import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { TradeCard } from './TradeCard';
import { TradeSummaryBar } from './TradeSummaryBar';
import { TradeFilters } from './TradeFilters';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { useDebounce } from '@/hooks/useDebounce';

interface Trade {
  symbol?: string;
  symbol_temp?: string;
  side?: 'long' | 'short';
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  profit_loss?: number;
  roi_percent?: number;
  opened_at?: string;
  closed_at?: string;
  strategy?: string;
  notes?: string;
  broker?: string;
  [key: string]: any;
}

interface TradeReviewEditorProps {
  trades: Trade[];
  maxSelectableTrades: number;
  creditsRequired: number;
  imagesProcessed: number;
  onSave: (trades: Trade[]) => void;
  onCancel: () => void;
}

export function TradeReviewEditor({
  trades,
  maxSelectableTrades,
  creditsRequired,
  imagesProcessed,
  onSave,
  onCancel,
}: TradeReviewEditorProps) {
  const [editedTrades, setEditedTrades] = useState<Trade[]>(trades.slice(0, maxSelectableTrades));
  const [approvedTrades, setApprovedTrades] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Get unique brokers
  const availableBrokers = useMemo(() => {
    const brokers = new Set<string>();
    editedTrades.forEach(trade => {
      if (trade.broker) brokers.add(trade.broker);
    });
    return Array.from(brokers);
  }, [editedTrades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    return editedTrades.filter((trade, index) => {
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        const symbol = (trade.symbol || trade.symbol_temp || '').toLowerCase();
        const broker = (trade.broker || '').toLowerCase();
        const notes = (trade.notes || '').toLowerCase();
        if (!symbol.includes(search) && !broker.includes(search) && !notes.includes(search)) {
          return false;
        }
      }

      // Broker filter
      if (brokerFilter !== 'all' && trade.broker !== brokerFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const symbol = trade.symbol || trade.symbol_temp || 'UNKNOWN';
        const hasRequiredFields = symbol && symbol !== 'UNKNOWN' && trade.side && 
          trade.entry_price && trade.exit_price && trade.opened_at && trade.closed_at;
        const status = approvedTrades.has(index) ? 'approved' : hasRequiredFields ? 'ready' : 'needs_fields';
        
        if (status !== statusFilter) {
          return false;
        }
      }

      return true;
    }).map((trade, filteredIndex) => ({
      trade,
      originalIndex: editedTrades.indexOf(trade),
      filteredIndex
    }));
  }, [editedTrades, debouncedSearch, brokerFilter, statusFilter, approvedTrades]);


  const handleTradeChange = (index: number, field: string, value: any) => {
    const newTrades = [...editedTrades];
    newTrades[index] = { ...newTrades[index], [field]: value };
    setEditedTrades(newTrades);
  };

  const handleApprove = (index: number) => {
    setApprovedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleDelete = (index: number) => {
    const newTrades = editedTrades.filter((_, idx) => idx !== index);
    setEditedTrades(newTrades);
    
    // Update approved trades indices
    const newApproved = new Set<number>();
    approvedTrades.forEach(approvedIdx => {
      if (approvedIdx < index) {
        newApproved.add(approvedIdx);
      } else if (approvedIdx > index) {
        newApproved.add(approvedIdx - 1);
      }
    });
    setApprovedTrades(newApproved);
  };

  const handleDuplicate = (index: number) => {
    const tradeToDuplicate = { ...editedTrades[index] };
    const newTrades = [...editedTrades];
    newTrades.splice(index + 1, 0, tradeToDuplicate);
    setEditedTrades(newTrades);
  };

  const handleSave = () => {
    const tradesToSave = editedTrades.filter((_, index) => approvedTrades.has(index));
    onSave(tradesToSave);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 py-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-6 -mt-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#EAEFF4]">Review and edit your trades</h1>
              <p className="text-sm text-[#A6B1BB] mt-1">
                {imagesProcessed} images processed • {editedTrades.length} trades found • {creditsRequired} credits required
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={approvedTrades.size === 0}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Save {approvedTrades.size} approved {approvedTrades.size === 1 ? 'trade' : 'trades'}
          </Button>
        </div>

        <TradeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          brokerFilter={brokerFilter}
          onBrokerFilterChange={setBrokerFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          availableBrokers={availableBrokers}
        />
      </div>

      {/* Summary Bar */}
      <TradeSummaryBar
        totalTrades={editedTrades.length}
        approvedIndices={approvedTrades}
        trades={editedTrades}
      />

      {/* Trade List */}
      {filteredTrades.length > 0 ? (
        <div className="space-y-6 pb-12">
          {filteredTrades.map(({ trade, originalIndex }) => (
            <TradeCard
              key={originalIndex}
              trade={trade}
              index={originalIndex}
              isApproved={approvedTrades.has(originalIndex)}
              onTradeChange={(field, value) => handleTradeChange(originalIndex, field, value)}
              onApprove={() => handleApprove(originalIndex)}
              onDelete={() => handleDelete(originalIndex)}
              onDuplicate={() => handleDuplicate(originalIndex)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#A6B1BB]">
            {debouncedSearch || brokerFilter !== 'all' || statusFilter !== 'all' 
              ? 'No trades found. Clear filters or upload more.' 
              : 'No trades to review.'}
          </p>
        </div>
      )}
    </div>
  );
}
