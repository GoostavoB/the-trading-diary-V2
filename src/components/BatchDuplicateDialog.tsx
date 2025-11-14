import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DuplicateMatch {
  tradeIndex: number;
  trade: {
    symbol: string;
    opened_at: string;
    closed_at: string;
    profit_loss: number;
    roi: number;
    side: 'long' | 'short';
  };
  existing: {
    symbol: string;
    trade_date: string;
    opened_at?: string | null;
    pnl: number;
  };
}

interface BatchDuplicateDialogProps {
  open: boolean;
  duplicates: DuplicateMatch[];
  onRemoveDuplicates: (indicesToRemove: number[]) => void;
  onSaveAll: () => void;
  onCancel: () => void;
}

export function BatchDuplicateDialog({
  open,
  duplicates,
  onRemoveDuplicates,
  onSaveAll,
  onCancel,
}: BatchDuplicateDialogProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(duplicates.map(d => d.tradeIndex))
  );

  const handleToggle = (index: number) => {
    setSelectedIndices(prev => {
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
    const indicesToRemove = Array.from(selectedIndices);
    onRemoveDuplicates(indicesToRemove);
  };

  const handleSaveAll = () => {
    onSaveAll();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Duplicate Trades Detected</DialogTitle>
          </div>
          <DialogDescription>
            We found {duplicates.length} trade{duplicates.length > 1 ? 's' : ''} that appear to be duplicates of existing trades.
            Select the duplicates you want to remove before saving.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {duplicates.map((duplicate) => (
              <div
                key={duplicate.tradeIndex}
                className={`p-4 border rounded-lg ${
                  selectedIndices.has(duplicate.tradeIndex)
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`duplicate-${duplicate.tradeIndex}`}
                    checked={selectedIndices.has(duplicate.tradeIndex)}
                    onCheckedChange={() => handleToggle(duplicate.tradeIndex)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {duplicate.trade.symbol}
                        </span>
                        <Badge variant={duplicate.trade.side === "long" ? "default" : "secondary"}>
                          {duplicate.trade.side}
                        </Badge>
                      </div>
                      {selectedIndices.has(duplicate.tradeIndex) && (
                        <Badge variant="destructive" className="gap-1">
                          <Trash2 className="h-3 w-3" />
                          Will be removed
                        </Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {/* New Trade (from upload) */}
                      <div className="space-y-2 p-3 bg-background/50 rounded border">
                        <div className="font-medium text-muted-foreground mb-2">
                          📤 New Trade (Current Upload)
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Opened:</span>
                            <span className="font-medium">
                              {format(new Date(duplicate.trade.opened_at), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Closed:</span>
                            <span className="font-medium">
                              {format(new Date(duplicate.trade.closed_at), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">P&L:</span>
                            <span
                              className={`font-semibold ${
                                duplicate.trade.profit_loss >= 0 ? "text-neon-green" : "text-neon-red"
                              }`}
                            >
                              ${duplicate.trade.profit_loss.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ROI:</span>
                            <span className="font-medium">{duplicate.trade.roi.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Existing Trade (already in DB) */}
                      <div className="space-y-2 p-3 bg-primary/5 rounded border border-primary/20">
                        <div className="font-medium text-primary mb-2">
                          ✅ Existing Trade (Already Saved)
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">
                              {format(new Date(duplicate.existing.opened_at || duplicate.existing.trade_date), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">P&L:</span>
                            <span
                              className={`font-semibold ${
                                duplicate.existing.pnl >= 0 ? "text-neon-green" : "text-neon-red"
                              }`}
                            >
                              ${duplicate.existing.pnl.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Select the checkboxes to mark trades for removal, 
            or click "Save All Anyway" to keep all trades including duplicates.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            {selectedIndices.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleRemoveSelected}
                className="flex-1 sm:flex-initial gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove {selectedIndices.size} Duplicate{selectedIndices.size > 1 ? 's' : ''}
              </Button>
            )}
          </div>
          <Button onClick={handleSaveAll} className="gap-2">
            Save All Anyway ({duplicates.length} trades)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
