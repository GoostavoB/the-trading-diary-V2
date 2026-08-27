import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table } from "lucide-react";

/**
 * Static leverage reference table.
 * Maps the unleveraged percentage move (entry -> stop distance) to the
 * maximum sensible leverage. Hardcoded on purpose — it's a reference tool.
 */
const LEVERAGE_ROWS: { range: string; leverage: string }[] = [
  { range: "0.01% – 0.40%", leverage: "100x" },
  { range: "0.41% – 0.60%", leverage: "90x" },
  { range: "0.61% – 0.75%", leverage: "80x" },
  { range: "0.76% – 0.90%", leverage: "70x" },
  { range: "0.91% – 1.15%", leverage: "60x" },
  { range: "1.16% – 1.45%", leverage: "50x" },
  { range: "1.46% – 1.95%", leverage: "40x" },
  { range: "1.96% – 2.80%", leverage: "30x" },
  { range: "2.81% – 3.50%", leverage: "25x" },
  { range: "3.55% – 4.45%", leverage: "20x" },
  { range: "4.46% – 6.25%", leverage: "15x" },
  { range: "6.26% – 9.40%", leverage: "10x" },
  { range: "9.41% – 11.80%", leverage: "8x" },
  { range: "11.81% – 16%", leverage: "6x" },
  { range: "16.01% – 24%", leverage: "4x" },
  { range: "24.01% – 32%", leverage: "3x" },
  { range: "32.01% – 48%", leverage: "2x" },
  { range: "48.01% – 98%", leverage: "1x" },
];

export function LeverageTableModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-600/20"
        >
          <Table className="h-4 w-4" />
          Leverage Table
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-hidden p-0 border-indigo-500/20">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-indigo-500/15 bg-gradient-to-r from-indigo-500/10 to-transparent">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Table className="h-5 w-5 text-indigo-400" />
            </span>
            Leverage reference table
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Find your unleveraged move to the stop, then read the maximum leverage to use.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] px-6 pb-6 pt-2">
          {/* Column headers */}
          <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-center gap-4 bg-background/95 backdrop-blur py-3 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <span>Move without leverage</span>
            <span className="text-right pr-1">Max leverage</span>
          </div>

          <div className="divide-y divide-border/70">
            {LEVERAGE_ROWS.map((row, i) => (
              <div
                key={row.range}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-2 py-3.5 rounded-lg transition-colors ${
                  i % 2 === 1 ? "bg-muted/30" : ""
                } hover:bg-indigo-500/10`}
              >
                <span className="text-base md:text-lg font-medium tabular-nums text-foreground">
                  {row.range}
                </span>
                <span className="justify-self-end min-w-[86px] text-center rounded-lg px-3 py-1.5 text-lg md:text-xl font-bold tabular-nums bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  {row.leverage}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
            Reference only. Higher leverage shortens the distance to liquidation — always size the
            position from your risk per trade, not from the maximum allowed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
