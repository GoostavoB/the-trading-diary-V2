import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, RotateCcw } from "lucide-react";

interface Trade {
  profit_loss?: number;
  [key: string]: any;
}

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: Trade[];
  onBulkDelete: (indices: number[]) => void;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  trades,
  onBulkDelete,
}: BulkDeleteDialogProps) {
  const [negativePnl, setNegativePnl] = useState<number>(0);
  const [positivePnl, setPositivePnl] = useState<number>(0);

  // Calculate which trades fall within the selected range
  const { affectedIndices, affectedCount } = useMemo(() => {
    const indices: number[] = [];
    trades.forEach((trade, index) => {
      const pnl = trade.profit_loss || 0;
      if (pnl >= negativePnl && pnl <= positivePnl) {
        indices.push(index);
      }
    });
    return { affectedIndices: indices, affectedCount: indices.length };
  }, [trades, negativePnl, positivePnl]);

  const handleConfirm = () => {
    onBulkDelete(affectedIndices);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1F28] border-[#2A3038]">
        <DialogHeader>
          <DialogTitle className="text-[#EAEFF4]">Remove Insignificant Trades</DialogTitle>
          <DialogDescription className="text-[#A6B1BB]">
            Select a P&L range to automatically delete trades with minimal impact.
            This helps you focus on reviewing your most significant trades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-[#EAEFF4]">P&L Range</Label>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-[#EAEFF4]">
                  ${negativePnl.toFixed(2)} to ${positivePnl.toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNegativePnl(0);
                    setPositivePnl(0);
                  }}
                  className="h-7 px-2 text-[#A6B1BB] hover:text-[#EAEFF4]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Bidirectional Range Slider */}
            <div className="space-y-2">
              <div className="relative pnl-bidir-slider">
                <Slider
                  min={-100}
                  max={100}
                  step={0.5}
                  value={[negativePnl, positivePnl]}
                  onValueChange={(values) => {
                    const [neg, pos] = values;
                    setNegativePnl(Math.min(0, neg));
                    setPositivePnl(Math.max(0, pos));
                  }}
                  className="w-full"
                >
                  <SliderPrimitive.Thumb
                    aria-label="Negative P&L"
                    className="block h-5 w-5 rounded-full border-2 border-red-500 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  />
                  <SliderPrimitive.Thumb
                    aria-label="Positive P&L"
                    className="block h-5 w-5 rounded-full border-2 border-green-500 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  />
                </Slider>
                <style>{`
                  .pnl-bidir-slider [data-radix-slider-track] {
                    background: linear-gradient(to right, #ef4444 0%, #fca5a5 50%, #86efac 50%, #22c55e 100%) !important;
                  }
                  .pnl-bidir-slider [data-radix-slider-range] {
                    background: transparent !important;
                  }
                `}</style>
              </div>
              <div className="flex items-center justify-between text-xs text-[#A6B1BB]">
                <span className="text-red-400">-$100</span>
                <span>$0</span>
                <span className="text-green-400">+$100</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {affectedCount} trade{affectedCount !== 1 ? 's' : ''} will be deleted
                </p>
                <p className="text-xs text-amber-400/80 mt-1">
                  Trades with P&L between ${negativePnl.toFixed(2)} and ${positivePnl.toFixed(2)} will be marked as deleted. You can restore them before saving if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A3038] text-[#EAEFF4] hover:bg-[#12161C]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={affectedCount === 0}
            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {affectedCount} Trade{affectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
