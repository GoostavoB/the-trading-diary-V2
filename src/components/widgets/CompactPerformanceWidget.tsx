import { memo } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
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
        <div className="flex flex-col h-full min-h-[220px]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                <h3 className="font-bold text-base tracking-tight">Performance Overview</h3>
            </div>

            {/* Three-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/20">

                {/* Column 1: Current ROI */}
                <div className="flex flex-col p-5 gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 shadow-sm">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Current ROI
                        </span>
                    </div>

                    <div className="flex-1 flex items-center">
                        <div className="flex items-baseline gap-2">
                            <AnimatedCounter
                                value={Math.abs(currentROI)}
                                className={cn(
                                    "text-3xl font-black tracking-tight",
                                    isROIPositive ? 'text-neon-green' : 'text-neon-red'
                                )}
                                suffix="%"
                                prefix={isROIPositive ? '' : '-'}
                            />
                            {isROIPositive ? (
                                <TrendingUp className="h-5 w-5 text-neon-green" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-neon-red" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/20">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Initial</span>
                            <span className="font-semibold">
                                <BlurredCurrency amount={initialInvestment} className="font-semibold" />
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Current</span>
                            <span className="font-semibold text-foreground">
                                <BlurredCurrency amount={currentBalance} className="font-semibold" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Win Rate */}
                <div className="flex flex-col p-5 gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 shadow-sm">
                            <Target className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Win Rate
                        </span>
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-4">
                        <div className="text-3xl font-black tracking-tight">
                            {formatPercent(winRate)}
                        </div>

                        {/* Mini circular progress */}
                        <div className="relative h-14 w-14 flex-shrink-0">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-muted/10"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className={winRate >= 50 ? "text-neon-green" : "text-neon-red"}
                                    strokeDasharray={`${winRate}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                    {Math.round(winRate)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                        <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30">
                            {wins}W
                        </span>
                        <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-neon-red/15 text-neon-red ring-1 ring-neon-red/30">
                            {losses}L
                        </span>
                        <span className="text-sm text-muted-foreground ml-auto font-medium">
                            {totalTrades} trades
                        </span>
                    </div>
                </div>

                {/* Column 3: Avg PnL per Day with mini chart */}
                <div className="flex flex-col p-5 gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 shadow-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Avg P&L / Day
                        </span>
                    </div>

                    <div className="flex-1 flex items-center">
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl font-black tracking-tight",
                                isPnLPositive ? 'text-neon-green' : 'text-neon-red'
                            )}>
                                {isPnLPositive ? '+' : '-'}
                                <BlurredCurrency amount={Math.abs(avgPnLPerDay)} className="text-3xl font-black inline" />
                            </span>
                            {isPnLPositive ? (
                                <TrendingUp className="h-5 w-5 text-neon-green" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-neon-red" />
                            )}
                        </div>
                    </div>

                    {/* Mini trend chart or stats */}
                    <div className="pt-2 border-t border-border/20">
                        {pnlTrendData.length > 0 ? (
                            <div className="h-12 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={pnlTrendData}>
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={isPnLPositive ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))'}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Period</span>
                                <span className="font-semibold">
                                    {tradingDays ? `${tradingDays} trading days` : 'All time'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
});

CompactPerformanceWidget.displayName = 'CompactPerformanceWidget';
