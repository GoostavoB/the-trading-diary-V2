import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useMemo } from 'react';
import { calculateMaxDrawdown } from '@/utils/insightCalculations';

export function CalendarContent() {
  const { loading, processedTrades, initialInvestment } = useDashboard();

  const qualityStats = useMemo(() => {
    const winningTrades = processedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = processedTrades.filter(t => (t.profit_loss || 0) <= 0);

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades.length
      : 0;
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losingTrades.length)
      : 0;

    // True max drawdown: largest peak-to-trough decline in cumulative P&L.
    const { amount: maxDrawdownAmount, percent: maxDrawdownPercent } =
      calculateMaxDrawdown(processedTrades, initialInvestment);

    return {
      avgWin,
      avgLoss,
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
      maxDrawdownAmount: -Math.abs(maxDrawdownAmount), // render as negative
      maxDrawdownPercent,
    };
  }, [processedTrades, initialInvestment]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div 
      className="grid grid-cols-3 gap-3"
      style={{ height: 'calc(100vh - 220px)' }}
    >
      <div className="col-span-2 h-full overflow-hidden">
        <SmartWidgetWrapper id="heatmap" className="h-full">
          <TradingHeatmap trades={processedTrades} />
        </SmartWidgetWrapper>
      </div>
      <div className="col-span-1 h-full overflow-hidden">
        <SmartWidgetWrapper id="tradingQuality" className="h-full">
          <TradingQualityMetrics
            avgWin={qualityStats.avgWin}
            avgLoss={qualityStats.avgLoss}
            winCount={qualityStats.winCount}
            lossCount={qualityStats.lossCount}
            maxDrawdownAmount={qualityStats.maxDrawdownAmount}
            maxDrawdownPercent={qualityStats.maxDrawdownPercent}
            trades={processedTrades}
          />
        </SmartWidgetWrapper>
      </div>
    </div>
  );
}
