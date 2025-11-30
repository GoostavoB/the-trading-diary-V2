import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { InsightsQuickSummary } from '@/components/insights/InsightsQuickSummary';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMemo } from 'react';
import type { Trade } from '@/types/trade';

// Local helper since the utility might be missing or different
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

export function InsightsContent() {
    const { processedTrades, capitalLog } = useDashboard();
    const stats = useDashboardStats(processedTrades, capitalLog);

    const { bestTrade, worstTrade, currentStreak } = useMemo(() => {
        if (!processedTrades.length) return { bestTrade: undefined, worstTrade: undefined, currentStreak: { type: 'win' as const, count: 0 } };

        // useDashboardStats already calculates best/worst trade, use them if available
        // otherwise fallback to local calculation

        return {
            bestTrade: stats.bestTrade || undefined,
            worstTrade: stats.worstTrade || undefined,
            currentStreak: calculateCurrentStreak(processedTrades)
        };
    }, [processedTrades, stats]);

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <InsightsQuickSummary
                totalPnL={stats.totalPnL}
                winRate={stats.winRate}
                profitFactor={stats.profitFactor || 0}
                avgROI={stats.avgRoi}
                totalTrades={stats.totalTrades}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    maxDrawdownPercent={0} // Placeholder as it's not in stats yet
                    maxDrawdownAmount={0} // Placeholder
                    profitFactor={stats.profitFactor}
                />
            </div>

            <CostEfficiencyPanel trades={processedTrades} />
            <BehaviorAnalytics trades={processedTrades} />
        </div>
    );
}
