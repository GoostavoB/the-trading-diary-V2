import { useMemo } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { InsightsQuickSummary } from '@/components/insights/InsightsQuickSummary';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Trade } from '@/types/trade';
import { calculateMaxDrawdown } from '@/utils/insightCalculations';

function calculateCurrentStreak(trades: Trade[]) {
    if (!trades || trades.length === 0) return { type: 'win' as const, count: 0 };
    const sortedByDate = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
    const firstTrade = sortedByDate[0];
    const streakType = (firstTrade.profit_loss || 0) > 0 ? 'win' : 'loss';
    let streakCount = 0;
    for (const trade of sortedByDate) {
        const isWin = (trade.profit_loss || 0) > 0;
        if ((streakType === 'win' && isWin) || (streakType === 'loss' && !isWin)) {
            streakCount++;
        } else {
            break;
        }
    }
    return { type: streakType as 'win' | 'loss', count: streakCount };
}

export function CommandCenterContent() {
    const { loading, processedTrades, capitalLog, initialInvestment } = useDashboard();
    const stats = useDashboardStats(processedTrades, capitalLog);
    const isMobile = useIsMobile();

    const maxDrawdown = useMemo(
        () => calculateMaxDrawdown(processedTrades, initialInvestment),
        [processedTrades, initialInvestment],
    );

    const { bestTrade, worstTrade, currentStreak } = useMemo(() => {
        if (!processedTrades.length) return { bestTrade: undefined, worstTrade: undefined, currentStreak: { type: 'win' as const, count: 0 } };
        return {
            bestTrade: stats.bestTrade || undefined,
            worstTrade: stats.worstTrade || undefined,
            currentStreak: calculateCurrentStreak(processedTrades)
        };
    }, [processedTrades, stats]);

    if (loading) return <DashboardSkeleton />;

    if (isMobile) {
        return (
            <div className="space-y-3 pb-4">
                <InsightsQuickSummary
                    totalPnL={stats.totalPnL}
                    winRate={stats.winRate}
                    profitFactor={stats.profitFactor || 0}
                    avgROI={stats.avgRoi}
                    totalTrades={stats.totalTrades}
                />
                <PerformanceHighlights
                    trades={processedTrades}
                    bestTrade={bestTrade}
                    worstTrade={worstTrade}
                    currentStreak={currentStreak}
                />
                <TradingQualityMetrics
                    avgWin={stats.avgWin}
                    avgLoss={stats.avgLoss}
                    winCount={stats.winningTrades.length}
                    lossCount={stats.losingTrades.length}
                    maxDrawdownPercent={maxDrawdown.percent}
                    maxDrawdownAmount={-Math.abs(maxDrawdown.amount)}
                />
                <CostEfficiencyPanel trades={processedTrades} />
                <BehaviorAnalytics trades={processedTrades} />
            </div>
        );
    }

    return (
        <div 
            className="flex flex-col gap-3 animate-in fade-in-50 duration-500"
            style={{ height: 'calc(100vh - 220px)' }}
        >
            {/* Row 1: KPI Summary */}
            <div className="shrink-0">
                <InsightsQuickSummary
                    totalPnL={stats.totalPnL}
                    winRate={stats.winRate}
                    profitFactor={stats.profitFactor || 0}
                    avgROI={stats.avgRoi}
                    totalTrades={stats.totalTrades}
                />
            </div>

            {/* Row 2: 2-column grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                <div className="col-span-1 h-full overflow-hidden">
                    <PerformanceHighlights
                        trades={processedTrades}
                        bestTrade={bestTrade}
                        worstTrade={worstTrade}
                        currentStreak={currentStreak}
                    />
                </div>
                <div className="col-span-1 flex flex-col gap-3 h-full overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <TradingQualityMetrics
                            avgWin={stats.avgWin}
                            avgLoss={stats.avgLoss}
                            winCount={stats.winningTrades.length}
                            lossCount={stats.losingTrades.length}
                            maxDrawdownPercent={maxDrawdown.percent}
                            maxDrawdownAmount={-Math.abs(maxDrawdown.amount)}
                        />
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <BehaviorAnalytics trades={processedTrades} />
                    </div>
                </div>
            </div>
        </div>
    );
}
