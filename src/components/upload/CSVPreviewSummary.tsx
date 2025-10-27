import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ExtractedTrade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface CSVPreviewSummaryProps {
  trades: ExtractedTrade[];
  selectedTrades: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  broker?: string;
}

export const CSVPreviewSummary = ({
  trades,
  selectedTrades,
  onSelectionChange,
  broker,
}: CSVPreviewSummaryProps) => {
  const handleSelectAll = () => {
    if (selectedTrades.size === trades.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(trades.map((_, idx) => idx)));
    }
  };

  const handleToggleTrade = (index: number) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Detected Trades</h3>
          <p className="text-sm text-muted-foreground">
            Select trades to import • {selectedTrades.size} of {trades.length} selected
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="h-8"
        >
          {selectedTrades.size === trades.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="grid gap-3">
        {trades.map((trade, index) => {
          const isSelected = selectedTrades.has(index);
          const profitLoss = trade.profit_loss || 0;
          const isProfit = profitLoss >= 0;

          return (
            <div
              key={index}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                isSelected
                  ? "bg-accent/50 border-primary/50 shadow-sm"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleTrade(index)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base">{trade.symbol}</span>
                      <Badge
                        variant={trade.side === 'long' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          trade.side === 'long'
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        )}
                      >
                        {trade.side?.toUpperCase()}
                      </Badge>
                      {trade.leverage && trade.leverage > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {trade.leverage}x
                        </Badge>
                      )}
                      {broker && (
                        <Badge variant="outline" className="text-xs">
                          {broker}
                        </Badge>
                      )}
                    </div>
                    
                    {/* P&L with gain/loss pill */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isProfit ? "default" : "destructive"}
                        className={cn(
                          "gap-1.5 font-medium tabular-nums",
                          isProfit
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
                        )}
                      >
                        {isProfit ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        ${Math.abs(profitLoss).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Badge>
                    </div>
                  </div>

                  {/* ROI */}
                  {trade.roi !== undefined && trade.roi !== null && (
                    <div className="mb-3">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          trade.roi >= 0
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        )}
                      >
                        {trade.roi >= 0 ? '+' : ''}
                        {trade.roi.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}% ROI
                      </span>
                    </div>
                  )}

                  {/* Trade details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      Entry: <span className="tabular-nums">${trade.entry_price?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    <div>
                      Exit: <span className="tabular-nums">${trade.exit_price?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    <div>
                      Size: <span className="tabular-nums">${trade.position_size?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    <div>
                      Margin: <span className="tabular-nums">${trade.margin?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    {(trade.trading_fee !== 0 || trade.funding_fee !== 0) && (
                      <div>
                        Fees: <span className="tabular-nums">${((trade.trading_fee || 0) + (trade.funding_fee || 0)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</span>
                      </div>
                    )}
                    {trade.period_of_day && (
                      <div className="capitalize">{trade.period_of_day}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
