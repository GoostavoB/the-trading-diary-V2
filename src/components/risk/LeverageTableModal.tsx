import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table } from "lucide-react";
import { LEVERAGE_ROWS } from "@/utils/leverageTable";


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

      <DialogContent className="w-[92vw] max-w-none h-[92vh] max-h-[92vh] overflow-hidden p-0 border-indigo-500/20 flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-5 border-b border-indigo-500/15 bg-gradient-to-r from-indigo-500/10 to-transparent shrink-0">
          <DialogTitle className="flex items-center gap-4 text-3xl md:text-4xl">
            <span className="h-14 w-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Table className="h-7 w-7 text-indigo-400" />
            </span>
            Leverage reference table
          </DialogTitle>
          <p className="text-base md:text-lg text-muted-foreground pt-2">
            Find your unleveraged move to the stop, then read the maximum leverage to use.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-8 pb-8 pt-3">
          {/* Column headers */}
          <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-center gap-6 bg-background/95 backdrop-blur py-4 text-sm md:text-base uppercase tracking-wide text-muted-foreground border-b border-border">
            <span>Move without leverage</span>
            <span className="text-right pr-1">Max leverage</span>
          </div>

          <div className="divide-y divide-border/70">
            {LEVERAGE_ROWS.map((row, i) => (
              <div
                key={row.range}
                className={`grid grid-cols-[1fr_auto] items-center gap-6 px-3 py-5 md:py-6 rounded-xl transition-colors ${
                  i % 2 === 1 ? "bg-muted/30" : ""
                } hover:bg-indigo-500/10`}
              >
                <span className="text-xl md:text-2xl font-medium tabular-nums text-foreground">
                  {row.range}
                </span>
                <span className="justify-self-end min-w-[120px] md:min-w-[140px] text-center rounded-xl px-4 py-2 text-2xl md:text-3xl font-bold tabular-nums bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  {row.leverage}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm md:text-base text-muted-foreground mt-6 leading-relaxed">
            Reference only. Higher leverage shortens the distance to liquidation — always size the
            position from your risk per trade, not from the maximum allowed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
