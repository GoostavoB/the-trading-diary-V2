import { PremiumCard } from '@/components/ui/PremiumCard';
import { CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
interface Trade {
  profit_loss?: number;
  [key: string]: any;
}
interface TradeSummaryBarProps {
  totalTrades: number;
  approvedIndices: Set<number>;
  trades: Trade[];
  duplicateCount?: number;
  overriddenDuplicateCount?: number;
}
export function TradeSummaryBar({
  totalTrades,
  approvedIndices,
  trades,
  duplicateCount = 0,
  overriddenDuplicateCount = 0
}: TradeSummaryBarProps) {
  const approvedTrades = trades.filter((_, index) => approvedIndices.has(index));
  const grossPnL = approvedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const winningTrades = approvedTrades.filter(t => (t.profit_loss || 0) > 0).length;
  const losingTrades = approvedTrades.filter(t => (t.profit_loss || 0) < 0).length;
  const winRate = approvedTrades.length > 0 ? winningTrades / approvedTrades.length * 100 : 0;
  const approvedCount = approvedIndices.size;
  const finalTradeCount = totalTrades - duplicateCount + overriddenDuplicateCount;

  return <PremiumCard style={{
    backgroundColor: '#12161C'
  }} className="border-[#1E242C] bg-[#12161C] p-6 sticky top-[72px] z-10 py-[8px] my-0">
    <div className="grid grid-cols-4 gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#A6B1BB]" />
          <span className="text-xs text-[#A6B1BB] font-medium">Approved</span>
        </div>
        <div className="text-2xl font-bold text-[#EAEFF4]">
          {approvedCount} <span className="text-sm text-[#A6B1BB] font-normal">/ {finalTradeCount}</span>
          {overriddenDuplicateCount > 0 && (
            <span className="text-xs text-amber-400 font-normal ml-1">
              (+{overriddenDuplicateCount} kept)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#A6B1BB]" />
          <span className="text-xs text-[#A6B1BB] font-medium">Gross P&L</span>
        </div>
        <div className={cn("text-2xl font-bold", grossPnL >= 0 ? "text-green-400" : "text-red-400")}>
          ${grossPnL.toFixed(2)}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-xs text-[#A6B1BB] font-medium">Win Rate</span>
        </div>
        <div className="text-2xl font-bold text-[#EAEFF4]">
          {winRate.toFixed(1)}%
          <span className="text-sm text-[#A6B1BB] font-normal ml-2">
            ({winningTrades}W / {losingTrades}L)
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[#A6B1BB]" />
          <span className="text-xs text-[#A6B1BB] font-medium">Net P&L</span>
        </div>
        <div className={cn("text-2xl font-bold", grossPnL >= 0 ? "text-green-400" : "text-red-400")}>
          ${grossPnL.toFixed(2)}
        </div>
      </div>
    </div>
  </PremiumCard>;
}