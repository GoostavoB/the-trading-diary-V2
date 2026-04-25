import { useMemo } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { InsightsQuickSummary } from '@/components/insights/InsightsQuickSummary';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { TotalCapitalWidget } from '@/components/widgets/TotalCapitalWidget';
import { OneYearProjectionWidget } from '@/components/widgets/OneYearProjectionWidget';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Trade } from '@/types/trade';
import { calculateMaxDrawdown } from '@/utils/insightCalculations';
import { calculateTradingDays } from '@/utils/tradingDays';
import { useUserSettings } from '@/hooks/useUserSettings';

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
    const { settings: userSettings } = useUserSettings();
    const tradingDaysMode = userSettings?.trading_days_calculation_mode;

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

    // Capital numbers (initial + P&L = current)
    const totalCapitalAdditions = useMemo(() => {
        return (capitalLog || []).reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
    }, [capitalLog]);

    const initialCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
    const currentCapital = initialCapital + (stats.totalPnL || 0);

    // Derive trading days for projection
    const tradingDays = useMemo(() => {
        const { tradingDays: td } = calculateTradingDays(processedTrades, tradingDaysMode);
        return td || 1;
    }, [processedTrades, tradingDaysMode]);

    if (loading) return <DashboardSkeleton />;

    // Unified rendering — same content on mobile/desktop, differs only in grid columns.
    return (
        <div className="flex flex-col gap-4 animate-in fade-in-50 duration-500 pb-6">

            {/* ── Row 1: KPI Strip ── */}
            <InsightsQuickSummary
                totalPnL={stats.totalPnL}
                winRate={stats.winRate}
                profitFactor={stats.profitFactor || 0}
                avgROI={stats.avgRoi}
                totalTrades={stats.totalTrades}
            />

            {/* ── Row 2: Total Capital (HERO) ── */}
            <div className="card-premium p-0 overflow-hidden">
                <TotalCapitalWidget
                    id="totalCapital"
                    initialCapital={initialCapital}
                    currentCapital={currentCapital}
                    totalPnL={stats.totalPnL || 0}
                    trades={processedTrades}
                />
            </div>

            {/* ── Row 3: Projection (interactive) ── */}
            <div className="card-premium p-0 overflow-hidden">
                <OneYearProjectionWidget
                    id="oneYearProjection"
                    currentBalance={currentCapital}
                    totalPnL={stats.totalPnL || 0}
                    tradingDays={tradingDays}
                    totalTrades={stats.totalTrades}
                    winRate={stats.winRate}
                    profitFactor={stats.profitFactor || 0}
                    avgWin={stats.avgWin}
                    avgLoss={stats.avgLoss}
                />
            </div>

            {/* ── Row 4: Performance Highlights (full width on mobile, 2 cols on desktop) ── */}
            <div className={isMobile ? 'contents' : 'grid grid-cols-2 gap-4'}>
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
                    trades={processedTrades}
                    currentStreak={currentStreak}
                />
            </div>

            {/* ── Row 5: Behavior Analytics ── */}
            <BehaviorAnalytics
                trades={processedTrades}
                currentEquity={currentCapital}
                currentStreak={currentStreak}
            />
        </div>
    );
}
