import { memo, useMemo } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { WidgetProps } from '@/types/widget';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface CompactPerformanceWidgetProps extends WidgetProps {
    // ROI data
    currentROI: number;
    initialInvestment: number;
    currentBalance: number;

    // Win Rate data
    winRate: number;
    wins: number;
    losses: number;
    totalTrades: number;

    // Avg PnL per Day data
    avgPnLPerDay: number;
    tradingDays?: number;

    // Mini chart data (last 7 days)
    pnlTrendData?: Array<{ date: string; value: number }>;
}

/**
 * Compact Performance Widget
 * Combines ROI, Win Rate, and Avg PnL/Day into a single horizontal block
 * Follows TradingView/Binance compact design patterns
 */
export const CompactPerformanceWidget = memo(({
    id,
    isEditMode,
    onRemove,
    currentROI,
    initialInvestment,
    currentBalance,
    winRate,
    wins,
    losses,
    totalTrades,
    avgPnLPerDay,
    tradingDays,
    pnlTrendData = [],
}: CompactPerformanceWidgetProps) => {
    const { t } = useTranslation();

    const isROIPositive = currentROI >= 0;
    const isPnLPositive = avgPnLPerDay >= 0;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <h3 className="font-semibold text-sm">Performance Overview</h3>
            </div>

            {/* Three-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1">

                {/* Column 1: Current ROI */}
                <div className="p-4 border-r border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Current ROI
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <AnimatedCounter
                            value={Math.abs(currentROI)}
                            className={cn(
                                "text-2xl font-bold",
                                isROIPositive ? 'text-profit' : 'text-loss'
                            )}
                            suffix="%"
                            prefix={isROIPositive ? '' : '-'}
                        />
                        {isROIPositive ? (
                            <TrendingUp className="h-4 w-4 text-profit" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-loss" />
                        )}
                    </div>

                    <div className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Initial</span>
                            <span className="font-medium">
                                <BlurredCurrency amount={initialInvestment} className="inline" />
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Current</span>
                            <span className="font-medium">
                                <BlurredCurrency amount={currentBalance} className="inline" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Win Rate */}
                <div className="p-4 border-r border-white/5 md:border-r space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <Target className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Win Rate
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold gradient-text">
                            {formatPercent(winRate)}
                        </div>

                        {/* Mini circular progress */}
                        <div className="relative h-12 w-12 flex items-center justify-center">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-muted/20"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                />
                                <path
                                    className={winRate >= 50 ? "text-neon-green" : "text-neon-red"}
                                    strokeDasharray={`${winRate}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                            {wins}W
                        </span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20">
                            {losses}L
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {totalTrades} trades
                        </span>
                    </div>
                </div>

                {/* Column 3: Avg PnL per Day with mini chart */}
                <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Avg P&L / Day
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <div className={cn(
                            "text-2xl font-bold",
                            isPnLPositive ? 'text-profit' : 'text-loss'
                        )}>
                            {isPnLPositive ? '' : '-'}
                            <BlurredCurrency amount={Math.abs(avgPnLPerDay)} className="inline" />
                        </div>
                        {isPnLPositive ? (
                            <TrendingUp className="h-4 w-4 text-profit" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-loss" />
                        )}
                    </div>

                    {/* Mini trend chart */}
                    {pnlTrendData.length > 0 ? (
                        <div className="h-10 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pnlTrendData}>
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={isPnLPositive ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))'}
                                        strokeWidth={1.5}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-10 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                                {tradingDays ? `${tradingDays} trading days` : 'Daily average'}
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
});

CompactPerformanceWidget.displayName = 'CompactPerformanceWidget';
