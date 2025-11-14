import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { DuplicateCheckResult } from '@/utils/duplicateDetection';

interface Trade {
  symbol?: string;
  entry_date?: string;
  exit_date?: string;
  opened_at?: string;
  closed_at?: string;
  entry_price?: number;
  exit_price?: number;
  side?: string;
}

interface DuplicateReviewDialogProps {
  open: boolean;
  duplicates: Map<number, DuplicateCheckResult>;
  trades: Trade[];
  onConfirm: (keepIndices: Set<number>, removeIndices: Set<number>, dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export const DuplicateReviewDialog = ({
  open,
  duplicates,
  trades,
  onConfirm,
  onCancel,
}: DuplicateReviewDialogProps) => {
  const duplicateIndices = Array.from(duplicates.keys());
  const [selectedToKeep, setSelectedToKeep] = useState<Set<number>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const toggleKeep = (index: number) => {
    setSelectedToKeep(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleRemoveSelected = () => {
    const removeIndices = new Set(
      duplicateIndices.filter(idx => !selectedToKeep.has(idx))
    );
    onConfirm(selectedToKeep, removeIndices, dontShowAgain);
  };

  const handleKeepAll = () => {
    onConfirm(new Set(duplicateIndices), new Set(), dontShowAgain);
  };

  const handleRemoveAll = () => {
    onConfirm(new Set(), new Set(duplicateIndices), dontShowAgain);
  };

  const removeCount = duplicateIndices.length - selectedToKeep.size;
  const creditsSaved = (removeCount / 10).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {duplicateIndices.length} Duplicate Trade{duplicateIndices.length !== 1 ? 's' : ''} Detected
          </DialogTitle>
          <DialogDescription>
            These trades appear to already exist in your journal. Review them below and choose which to keep or remove.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {duplicateIndices.map(index => {
            const trade = trades[index];
            const match = duplicates.get(index);
            const isChecked = selectedToKeep.has(index);

            // Get date - prefer opened_at/closed_at, fallback to entry_date/exit_date
            const entryDate = trade.opened_at || trade.entry_date;
            const exitDate = trade.closed_at || trade.exit_date;

            return (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-colors ${
                  isChecked ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`duplicate-${index}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleKeep(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {trade.symbol || 'Unknown'}
                          <Badge variant="outline" className="text-xs">
                            {trade.side?.toUpperCase() || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ${trade.entry_price?.toFixed(2)} → ${trade.exit_price?.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Entry: {entryDate ? new Date(entryDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      >
                        {match?.matchScore}% match
                      </Badge>
                    </div>
                    
                    {match?.matchedTrade && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                        <div className="font-medium mb-1">Existing trade:</div>
                        <div>
                          {match.matchedTrade.symbol} • 
                          ${match.matchedTrade.entry_price?.toFixed(2)} → ${match.matchedTrade.exit_price?.toFixed(2)}
                          {match.matchedTrade.opened_at && (
                            <> • {new Date(match.matchedTrade.opened_at).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                    )}

                    {isChecked && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Will be kept (1 credit charged)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duplicates to remove:</span>
            <span className="font-semibold">{removeCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duplicates to keep:</span>
            <span className="font-semibold">{selectedToKeep.size}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Credits saved by removing duplicates:</span>
            <span className="font-semibold text-primary">{creditsSaved}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleKeepAll}
            className="w-full sm:w-auto"
          >
            Keep All
          </Button>
          <Button
            variant="outline"
            onClick={handleRemoveAll}
            className="w-full sm:w-auto"
          >
            Remove All
          </Button>
          <Button
            onClick={handleRemoveSelected}
            className="w-full sm:w-auto"
          >
            Continue ({removeCount} removed, {selectedToKeep.size} kept)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
