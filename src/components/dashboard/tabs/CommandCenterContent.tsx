import { useMemo } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { CompactKPIRow } from '@/components/widgets/CompactKPIRow';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { CapitalGrowthWidget } from '@/components/widgets/CapitalGrowthWidget';
import { TopMoversWidget } from '@/components/widgets/TopMoversWidget';
import { GoalWidget } from '@/components/goals/GoalWidget';
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget';
import type { Trade } from '@/types/trade';

// Helper to calculate current streak
function calculateCurrentStreak(trades: Trade[]): { type: 'win' | 'loss'; count: number } {
    if (!trades || trades.length === 0) return { type: 'win', count: 0 };

    const sortedByDate = [...trades].sort((a, b) => 
        new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
    );
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
    const { loading, processedTrades, capitalLog, stats, initialInvestment } = useDashboard();

    // Calculate KPI values
    const kpiData = useMemo(() => {
        const totalCapitalAdditions = capitalLog.reduce((sum, log) => sum + (log.amount_added || 0), 0);
        const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;
        const totalPnL = stats?.total_pnl || 0;
        const roi = baseCapital > 0 ? (totalPnL / baseCapital) * 100 : 0;
        const currentStreak = calculateCurrentStreak(processedTrades);

        return {
            totalPnL,
            roi,
            winRate: stats?.win_rate || 0,
            totalTrades: stats?.total_trades || 0,
            currentStreak,
        };
    }, [processedTrades, capitalLog, stats, initialInvestment]);

    // Chart data for Capital Growth
    const chartData = useMemo(() => {
        const totalCapitalAdditions = capitalLog.reduce((sum, log) => sum + (log.amount_added || 0), 0);
        const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;

        const sortedTrades = [...processedTrades].sort((a, b) =>
            new Date(a.trade_date as any).getTime() - new Date(b.trade_date as any).getTime()
        );

        const data: { date: string; value: number }[] = [];
        let cumulative = baseCapital;

        if (sortedTrades.length === 0) {
            data.push({ date: new Date().toLocaleDateString(), value: baseCapital });
        } else {
            sortedTrades.forEach((trade) => {
                cumulative += (trade.profit_loss || 0);
                data.push({
                    date: new Date(trade.trade_date).toLocaleDateString(),
                    value: cumulative,
                });
            });
        }

        return {
            chartData: data,
            currentBalance: cumulative,
            totalCapitalAdditions,
        };
    }, [processedTrades, capitalLog, initialInvestment]);

    const widgetCount = 5; // Fixed widget count for density calculations

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
            {/* Compact KPI Row - Full width top */}
            <div className="col-span-3">
                <CompactKPIRow
                    totalPnL={kpiData.totalPnL}
                    roi={kpiData.roi}
                    winRate={kpiData.winRate}
                    totalTrades={kpiData.totalTrades}
                    currentStreak={kpiData.currentStreak}
                />
            </div>

            {/* Capital Growth Chart - 2 columns */}
            <div className="col-span-2">
                <SmartWidgetWrapper id="capitalGrowth" widgetCount={widgetCount}>
                    <CapitalGrowthWidget 
                        id="capitalGrowth"
                        chartData={chartData.chartData}
                        initialInvestment={initialInvestment}
                        totalCapitalAdditions={chartData.totalCapitalAdditions}
                        currentBalance={chartData.currentBalance}
                    />
                </SmartWidgetWrapper>
            </div>

            {/* Top Movers - 1 column */}
            <div className="col-span-1">
                <SmartWidgetWrapper id="topMovers" widgetCount={widgetCount}>
                    <TopMoversWidget id="topMovers" trades={processedTrades} />
                </SmartWidgetWrapper>
            </div>

            {/* Goals Progress - 2 columns */}
            <div className="col-span-2">
                <SmartWidgetWrapper id="goals" widgetCount={widgetCount}>
                    <GoalWidget />
                </SmartWidgetWrapper>
            </div>

            {/* Recent Transactions - 1 column */}
            <div className="col-span-1">
                <SmartWidgetWrapper id="recentTransactions" widgetCount={widgetCount}>
                    <RecentTransactionsWidget id="recentTransactions" trades={processedTrades} />
                </SmartWidgetWrapper>
            </div>
        </div>
    );
}
