import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useMemo } from 'react';

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
    
    const minPnl = processedTrades.length > 0
      ? Math.min(...processedTrades.map(t => t.profit_loss || 0))
      : 0;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    return { avgWin, avgLoss, winCount: winningTrades.length, lossCount: losingTrades.length, maxDrawdownAmount: Math.min(0, minPnl), maxDrawdownPercent: initialInvestment > 0 ? Math.abs((minPnl / initialInvestment) * 100) : 0, profitFactor };
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
            profitFactor={qualityStats.profitFactor}
          />
        </SmartWidgetWrapper>
      </div>
    </div>
  );
}
