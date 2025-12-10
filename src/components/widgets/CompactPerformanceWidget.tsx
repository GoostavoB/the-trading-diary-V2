import { memo } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { WidgetProps } from '@/types/widget';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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
        <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
            {/* Header */}
            <h3 className="font-bold text-sm tracking-tight text-foreground shrink-0">
                Performance Overview
            </h3>

            {/* Top Row: Three main metrics in equal columns */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
                {/* ROI Card */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <TrendingUp className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            ROI
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <AnimatedCounter
                            value={Math.abs(currentROI)}
                            className={cn(
                                "text-xl font-bold tabular-nums",
                                isROIPositive ? 'text-neon-green' : 'text-neon-red'
                            )}
                            suffix="%"
                            prefix={isROIPositive ? '+' : '-'}
                        />
                    </div>
                </div>

                {/* Win Rate Card */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Target className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Win Rate
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tabular-nums text-foreground">
                            {formatPercent(winRate)}
                        </span>
                        <div className="relative h-8 w-8 shrink-0">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <circle
                                    className="text-muted/20"
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <circle
                                    className={winRate >= 50 ? "text-neon-green" : "text-neon-red"}
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={`${winRate * 0.88} 88`}
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Avg P&L Card */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Calendar className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Avg P&L/Day
                        </span>
                    </div>
                    <div className={cn(
                        "text-xl font-bold tabular-nums",
                        isPnLPositive ? 'text-neon-green' : 'text-neon-red'
                    )}>
                        {isPnLPositive ? '+' : ''}
                        <BlurredCurrency amount={avgPnLPerDay} className="text-xl font-bold inline" />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 shrink-0" />

            {/* Bottom Row: Supporting stats */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
                {/* Capital Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Link 
                            to="/capital-management" 
                            className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                        >
                            Initial
                        </Link>
                        <BlurredCurrency amount={initialInvestment} className="text-sm font-medium" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Current</span>
                        <BlurredCurrency amount={currentBalance} className="text-sm font-semibold text-foreground" />
                    </div>
                </div>

                {/* Trades Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neon-green/15 text-neon-green">
                            {wins}W
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neon-red/15 text-neon-red">
                            {losses}L
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{totalTrades} trades</span>
                        <span>{tradingDays || 0} days</span>
                    </div>
                </div>
            </div>

            {/* Optional Trend Chart */}
            {pnlTrendData.length > 0 && (
                <div className="h-10 w-full shrink-0 mt-auto">
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
            )}
        </div>
    );
});

CompactPerformanceWidget.displayName = 'CompactPerformanceWidget';
