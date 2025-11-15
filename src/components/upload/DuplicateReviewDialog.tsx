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

  const handleSelectAll = () => {
    setSelectedToKeep(new Set(duplicateIndices));
  };

  const handleDeselectAll = () => {
    setSelectedToKeep(new Set());
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

        <div className="flex items-center justify-between py-2 px-1">
          <div className="text-sm text-muted-foreground">
            {selectedToKeep.size} of {duplicateIndices.length} selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="h-8 text-xs"
            >
              Deselect All
            </Button>
          </div>
        </div>

        <div className="space-y-2 py-2">{duplicateIndices.map(index => {
            const trade = trades[index];
            const match = duplicates.get(index);
            const isChecked = selectedToKeep.has(index);

            // Get date - prefer opened_at/closed_at, fallback to entry_date/exit_date
            const entryDate = trade.opened_at || trade.entry_date;
            const exitDate = trade.closed_at || trade.exit_date;

            return (
              <div
                key={index}
                onClick={() => toggleKeep(index)}
                className={`border rounded-lg p-3 transition-all cursor-pointer hover:border-primary/50 ${
                  isChecked ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`duplicate-${index}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleKeep(index)}
                    className="mt-0.5 pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate">{trade.symbol || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {trade.side?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                      {isChecked && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    
                    {/* New Trade Being Uploaded */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-2 mb-2">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                        ⬆️ Trade to Upload
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">${trade.entry_price?.toFixed(2)}</span>
                        <span className="mx-1 text-muted-foreground">→</span>
                        <span className="font-medium">${trade.exit_price?.toFixed(2)}</span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {entryDate ? new Date(entryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Existing Trade in Journal */}
                    {match?.matchedTrade && (
                      <div className="bg-muted/50 border border-border rounded-md p-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          📋 Existing in Journal
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">${match.matchedTrade.entry_price?.toFixed(2)}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-medium">${match.matchedTrade.exit_price?.toFixed(2)}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {match.matchedTrade.opened_at ? new Date(match.matchedTrade.opened_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">To remove:</span>
            <span className="font-semibold tabular-nums">{removeCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">To keep:</span>
            <span className="font-semibold tabular-nums">{selectedToKeep.size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dont-show-again"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Don't show this again
          </label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleKeepAll}
              className="flex-1 sm:flex-initial"
              size="sm"
            >
              Keep All
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveAll}
              className="flex-1 sm:flex-initial"
              size="sm"
            >
              Remove All
            </Button>
          </div>
          <Button
            onClick={handleRemoveSelected}
            className="w-full sm:w-auto sm:ml-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
