import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Filter } from 'lucide-react';
import { TradeCard } from './TradeCard';
import { TradeSummaryBar } from './TradeSummaryBar';
import { TradeFilters } from './TradeFilters';
import { SaveConfirmationDialog } from './SaveConfirmationDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { PendingTradesDialog } from './PendingTradesDialog';
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

interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedTrade?: any;
  matchScore?: number;
}

interface TradeReviewEditorProps {
  trades: Trade[];
  maxSelectableTrades: number;
  creditsRequired: number;
  imagesProcessed: number;
  duplicateMap?: Map<number, DuplicateCheckResult>;
  onSave: (trades: Trade[]) => void;
  onCancel: () => void;
}

export function TradeReviewEditor({
  trades,
  maxSelectableTrades,
  creditsRequired,
  imagesProcessed,
  duplicateMap,
  onSave,
  onCancel,
}: TradeReviewEditorProps) {
  const [editedTrades, setEditedTrades] = useState<Trade[]>(trades.slice(0, maxSelectableTrades));
  const [approvedTrades, setApprovedTrades] = useState<Set<number>>(new Set());
  const [deletedTrades, setDeletedTrades] = useState<Set<number>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Session-level tag tracking
  const [sessionStrategies, setSessionStrategies] = useState<Set<string>>(new Set());
  const [sessionMistakes, setSessionMistakes] = useState<Set<string>>(new Set());

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

  // Count approved vs total trades
  const duplicateCount = duplicateMap?.size || 0;
  const approvedCount = approvedTrades.size;
  const totalTrades = trades.length;
  const deletedCount = deletedTrades.size;
  const validTradeCount = totalTrades - duplicateCount;

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
    setDeletedTrades(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    // Remove from approved if it was approved
    setApprovedTrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleRestore = (index: number) => {
    setDeletedTrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleDuplicate = (index: number) => {
    const tradeToDuplicate = { ...editedTrades[index] };
    const newTrades = [...editedTrades];
    newTrades.splice(index + 1, 0, tradeToDuplicate);
    setEditedTrades(newTrades);
  };

  const handleSave = () => {
    // Check for pending trades (not approved and not deleted)
    const pendingIndices = editedTrades
      .map((_, index) => index)
      .filter(index => !approvedTrades.has(index) && !deletedTrades.has(index));
    
    if (pendingIndices.length > 0) {
      setShowPendingDialog(true);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleConfirmSave = () => {
    const tradesToSave = editedTrades.filter((_, index) => 
      approvedTrades.has(index) && !deletedTrades.has(index)
    );
    setShowSaveDialog(false);
    onSave(tradesToSave);
  };

  const handleSelectAll = () => {
    // Count non-deleted trades
    const nonDeletedIndices = editedTrades
      .map((_, index) => index)
      .filter(index => !deletedTrades.has(index));
    
    const allNonDeletedApproved = nonDeletedIndices.every(index => approvedTrades.has(index));
    
    if (allNonDeletedApproved && nonDeletedIndices.length > 0) {
      // Deselect all non-deleted
      setApprovedTrades(new Set());
    } else {
      // Select all non-deleted
      setApprovedTrades(new Set(nonDeletedIndices));
    }
  };

  const handleBulkDelete = (indices: number[]) => {
    setDeletedTrades(prev => {
      const newSet = new Set(prev);
      indices.forEach(i => newSet.add(i));
      return newSet;
    });
    // Remove from approved if any were approved
    setApprovedTrades(prev => {
      const newSet = new Set(prev);
      indices.forEach(i => newSet.delete(i));
      return newSet;
    });
  };

  const handleNewStrategyCreated = (strategy: string) => {
    setSessionStrategies(prev => new Set(prev).add(strategy));
  };

  const handleNewMistakeCreated = (mistake: string) => {
    setSessionMistakes(prev => new Set(prev).add(mistake));
  };

  const handleQuickApprove = (index: number) => {
    setApprovedTrades(prev => new Set(prev).add(index));
    
    // Check if there are still pending trades after this approval
    setTimeout(() => {
      const stillPending = editedTrades
        .map((_, i) => i)
        .filter(i => !approvedTrades.has(i) && !deletedTrades.has(i) && i !== index);
      
      if (stillPending.length === 0) {
        setShowPendingDialog(false);
        setShowSaveDialog(true);
      }
    }, 0);
  };

  const handleQuickRemove = (index: number) => {
    setDeletedTrades(prev => new Set(prev).add(index));
    
    // Check if there are still pending trades after this removal
    setTimeout(() => {
      const stillPending = editedTrades
        .map((_, i) => i)
        .filter(i => !approvedTrades.has(i) && !deletedTrades.has(i) && i !== index);
      
      if (stillPending.length === 0) {
        setShowPendingDialog(false);
        setShowSaveDialog(true);
      }
    }, 0);
  };

  const handleEditPending = () => {
    setShowPendingDialog(false);
  };

  // Get pending trades for dialog
  const pendingTrades = useMemo(() => {
    return editedTrades
      .map((trade, index) => ({ trade, index }))
      .filter(({ index }) => !approvedTrades.has(index) && !deletedTrades.has(index));
  }, [editedTrades, approvedTrades, deletedTrades]);

  // Count non-deleted trades for display
  const activeTradesCount = editedTrades.filter((_, index) => !deletedTrades.has(index)).length;
  const approvedNonDeletedCount = Array.from(approvedTrades).filter(index => !deletedTrades.has(index)).length;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 py-6 pb-32">
      {/* Summary Bar */}
      <TradeSummaryBar
        totalTrades={activeTradesCount}
        approvedIndices={approvedTrades}
        trades={editedTrades}
      />

      {/* Pending Trades Dialog */}
      <PendingTradesDialog
        open={showPendingDialog}
        onOpenChange={setShowPendingDialog}
        pendingTrades={pendingTrades}
        onApproveAndSave={handleQuickApprove}
        onRemoveAndSave={handleQuickRemove}
        onEdit={handleEditPending}
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        approvedCount={approvedNonDeletedCount}
        deletedCount={deletedTrades.size}
        onConfirm={handleConfirmSave}
      />

      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        trades={editedTrades}
        onBulkDelete={handleBulkDelete}
      />

      {/* Select All Control */}
      {editedTrades.length > 0 && (
        <div 
          className="flex items-center justify-between p-4 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={approvedNonDeletedCount === activeTradesCount && activeTradesCount > 0}
              onCheckedChange={handleSelectAll}
              aria-label="Select all trades"
            />
            <span className="text-sm font-medium">
              {approvedNonDeletedCount === activeTradesCount && activeTradesCount > 0
                ? 'All trades selected'
                : 'Select all trades'
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              className="gap-2 border-[#2A3038] text-[#EAEFF4] hover:bg-[#1A1F28]"
            >
              <Filter className="h-3.5 w-3.5" />
              Remove Insignificant
            </Button>
            <span className="text-sm text-muted-foreground">
              {approvedNonDeletedCount} of {activeTradesCount} approved
              {deletedTrades.size > 0 && ` • ${deletedTrades.size} deleted`}
            </span>
          </div>
        </div>
      )}

      {/* Trade List */}
      {filteredTrades.length > 0 ? (
        <div className="space-y-6">
          {filteredTrades.map(({ trade, originalIndex }) => (
             <TradeCard
              key={originalIndex}
              trade={trade}
              index={originalIndex}
              isApproved={approvedTrades.has(originalIndex)}
              isDeleted={deletedTrades.has(originalIndex)}
              isDuplicate={duplicateMap?.has(originalIndex)}
              duplicateInfo={duplicateMap?.get(originalIndex)}
              onTradeChange={(field, value) => handleTradeChange(originalIndex, field, value)}
              onApprove={() => handleApprove(originalIndex)}
              onDelete={() => handleDelete(originalIndex)}
              onDuplicate={() => handleDuplicate(originalIndex)}
              onRestore={() => handleRestore(originalIndex)}
              sessionStrategies={sessionStrategies}
              sessionMistakes={sessionMistakes}
              onNewStrategyCreated={handleNewStrategyCreated}
              onNewMistakeCreated={handleNewMistakeCreated}
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

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 z-50">
        <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <p className="text-sm text-muted-foreground">
              {approvedNonDeletedCount} of {activeTradesCount} trades selected
              {deletedTrades.size > 0 && ` • ${deletedTrades.size} deleted`}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={approvedNonDeletedCount === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save {approvedNonDeletedCount} Trade{approvedNonDeletedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
