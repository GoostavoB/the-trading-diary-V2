import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { InsightsQuickSummary } from '@/components/insights/InsightsQuickSummary';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { RollingTargetWidget } from '@/components/widgets/RollingTargetWidget';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMemo } from 'react';
import type { Trade } from '@/types/trade';
import { useIsMobile } from '@/hooks/use-mobile';

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
    const { processedTrades, capitalLog, initialInvestment } = useDashboard();
    const stats = useDashboardStats(processedTrades, capitalLog);
    const isMobile = useIsMobile();

    const { bestTrade, worstTrade, currentStreak } = useMemo(() => {
        if (!processedTrades.length) return { bestTrade: undefined, worstTrade: undefined, currentStreak: { type: 'win' as const, count: 0 } };

        return {
            bestTrade: stats.bestTrade || undefined,
            worstTrade: stats.worstTrade || undefined,
            currentStreak: calculateCurrentStreak(processedTrades)
        };
    }, [processedTrades, stats]);

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
                    maxDrawdownPercent={0}
                    maxDrawdownAmount={0}
                    profitFactor={stats.profitFactor}
                />
                <SmartWidgetWrapper id="rollingTarget" hasPadding={false}>
                    <RollingTargetWidget 
                        id="rollingTarget" 
                        trades={processedTrades}
                        initialInvestment={initialInvestment}
                    />
                </SmartWidgetWrapper>
                <CostEfficiencyPanel trades={processedTrades} />
                <BehaviorAnalytics trades={processedTrades} />
            </div>
        );
    }

    // Desktop: Simple 2-row layout that NEVER cuts off content
    // Row 1: KPI strip (auto height)
    // Row 2: 3-column grid (flex to fill)
    return (
        <div 
            className="flex flex-col gap-3 animate-in fade-in-50 duration-500"
            style={{
                height: 'calc(100vh - 220px)',
            }}
        >
            {/* Row 1: KPI Summary - Compact, auto height */}
            <div className="shrink-0">
                <InsightsQuickSummary
                    totalPnL={stats.totalPnL}
                    winRate={stats.winRate}
                    profitFactor={stats.profitFactor || 0}
                    avgROI={stats.avgRoi}
                    totalTrades={stats.totalTrades}
                />
            </div>

            {/* Row 2: 3-column grid filling remaining space */}
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
                {/* Column 1: Performance Highlights (full height) */}
                <div className="col-span-1 h-full overflow-hidden">
                    <PerformanceHighlights
                        trades={processedTrades}
                        bestTrade={bestTrade}
                        worstTrade={worstTrade}
                        currentStreak={currentStreak}
                    />
                </div>

                {/* Column 2: Rolling Target (full height) */}
                <div className="col-span-1 h-full overflow-hidden">
                    <SmartWidgetWrapper id="rollingTarget" hasPadding={false} className="h-full">
                        <RollingTargetWidget 
                            id="rollingTarget" 
                            trades={processedTrades}
                            initialInvestment={initialInvestment}
                        />
                    </SmartWidgetWrapper>
                </div>

                {/* Column 3: Trading Quality + Behavior stacked */}
                <div className="col-span-1 flex flex-col gap-3 h-full overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <TradingQualityMetrics
                            avgWin={stats.avgWin}
                            avgLoss={stats.avgLoss}
                            winCount={stats.winningTrades.length}
                            lossCount={stats.losingTrades.length}
                            maxDrawdownPercent={0}
                            maxDrawdownAmount={0}
                            profitFactor={stats.profitFactor}
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
