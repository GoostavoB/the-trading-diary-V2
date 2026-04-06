import { useMemo } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { CompactKPIRow } from '@/components/widgets/CompactKPIRow';
import { SmartWidgetWrapper } from '@/components/widgets/SmartWidgetWrapper';
import { CapitalGrowthWidget } from '@/components/widgets/CapitalGrowthWidget';
import { TopMoversWidget } from '@/components/widgets/TopMoversWidget';
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget';
import type { Trade } from '@/types/trade';

function calculateCurrentStreak(trades: Trade[]): { type: 'win' | 'loss'; count: number } {
    if (!trades || trades.length === 0) return { type: 'win', count: 0 };

    const sortedByDate = [...trades].sort((a, b) => {
        const dateA = b.trade_date || b.closed_at || b.opened_at || '';
        const dateB = a.trade_date || a.closed_at || a.opened_at || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
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
            baseCapital,
        };
    }, [processedTrades, capitalLog, stats, initialInvestment]);

    const chartData = useMemo(() => {
        const totalCapitalAdditions = capitalLog.reduce((sum, log) => sum + (log.amount_added || 0), 0);
        const baseCapital = totalCapitalAdditions > 0 ? totalCapitalAdditions : initialInvestment;

        const sortedTrades = [...processedTrades].sort((a, b) => {
            const dateA = a.trade_date || a.closed_at || a.opened_at || '';
            const dateB = b.trade_date || b.closed_at || b.opened_at || '';
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });

        const data: { date: string; value: number }[] = [];
        let cumulative = baseCapital;

        if (sortedTrades.length === 0) {
            data.push({ date: new Date().toLocaleDateString(), value: baseCapital });
        } else {
            sortedTrades.forEach((trade) => {
                cumulative += (trade.profit_loss || 0);
                const tradeDate = trade.trade_date || trade.closed_at || trade.opened_at;
                data.push({
                    date: tradeDate ? new Date(tradeDate).toLocaleDateString() : new Date().toLocaleDateString(),
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

    if (loading) return <DashboardSkeleton />;

    return (
        <div 
            className="grid grid-cols-3 gap-3"
            style={{
                gridTemplateRows: 'auto 1fr 1fr',
                height: 'calc(100vh - 220px)',
            }}
        >
            {/* Compact KPI Row */}
            <div className="col-span-3">
                <CompactKPIRow
                    totalPnL={kpiData.totalPnL}
                    roi={kpiData.roi}
                    winRate={kpiData.winRate}
                    totalTrades={kpiData.totalTrades}
                    currentStreak={kpiData.currentStreak}
                />
            </div>

            {/* Capital Growth Chart */}
            <div className="col-span-2">
                <SmartWidgetWrapper id="capitalGrowth" widgetCount={3}>
                    <CapitalGrowthWidget 
                        id="capitalGrowth"
                        chartData={chartData.chartData}
                        initialInvestment={chartData.totalCapitalAdditions > 0 ? 0 : initialInvestment}
                        totalCapitalAdditions={chartData.totalCapitalAdditions}
                        currentBalance={chartData.currentBalance}
                    />
                </SmartWidgetWrapper>
            </div>

            {/* Top Movers */}
            <div className="col-span-1">
                <SmartWidgetWrapper id="topMovers" widgetCount={3}>
                    <TopMoversWidget id="topMovers" trades={processedTrades} />
                </SmartWidgetWrapper>
            </div>

            {/* Recent Transactions - Full width */}
            <div className="col-span-3">
                <SmartWidgetWrapper id="recentTransactions" widgetCount={3}>
                    <RecentTransactionsWidget id="recentTransactions" trades={processedTrades} />
                </SmartWidgetWrapper>
            </div>
        </div>
    );
}
