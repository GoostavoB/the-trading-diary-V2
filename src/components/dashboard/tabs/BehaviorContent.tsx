import { useMemo } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { EmotionMistakeCorrelationWidget } from '@/components/widgets/EmotionMistakeCorrelationWidget';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export function BehaviorContent() {
  const { loading, processedTrades, stats, initialInvestment } = useDashboard();

  // Calculate derived stats for TradingQualityMetrics
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

    return {
      avgWin,
      avgLoss,
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
      maxDrawdownAmount: Math.min(0, minPnl),
      maxDrawdownPercent: initialInvestment > 0 ? Math.abs((minPnl / initialInvestment) * 100) : 0,
      profitFactor,
    };
  }, [processedTrades, initialInvestment]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div 
      className="grid grid-cols-3 gap-3"
      style={{
        gridAutoRows: 'minmax(0, 1fr)',
        maxHeight: 'calc(100vh - 220px)',
        overflow: 'hidden',
      }}
    >
      {/* Emotion & Mistake Correlation - Full width top */}
      <div className="col-span-3">
        <SmartWidgetWrapper id="emotionMistakeCorrelation" hasPadding={false}>
          <EmotionMistakeCorrelationWidget id="emotionMistakeCorrelation" trades={processedTrades} />
        </SmartWidgetWrapper>
      </div>

      {/* Trading Heatmap - 2 columns */}
      <div className="col-span-2">
        <SmartWidgetWrapper id="heatmap">
          <TradingHeatmap trades={processedTrades} />
        </SmartWidgetWrapper>
      </div>

      {/* Trading Quality Metrics - 1 column */}
      <div className="col-span-1">
        <SmartWidgetWrapper id="tradingQuality">
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
