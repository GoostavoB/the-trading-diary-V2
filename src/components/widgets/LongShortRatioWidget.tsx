import { memo, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { WidgetProps } from '@/types/widget';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LongShortRatioData {
    timestamp: number;
    longShortRatio: number;
    longAccount: number;
    shortAccount: number;
}

interface TimeframeChange {
    timeframe: string;
    change: number;
}

const TIMEFRAMES = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];

export const LongShortRatioWidget = memo(({
    id,
    isEditMode,
    onRemove,
    onExpand,
}: WidgetProps) => {
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
    const [chartData, setChartData] = useState<LongShortRatioData[]>([]);
    const [changes, setChanges] = useState<TimeframeChange[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchDataForTimeframe = async (tf: string, sym: string) => {
        try {
            const response = await fetch(
                `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=${tf}&limit=50`
            );
            const data = await response.json();

            if (Array.isArray(data)) {
                return data.map((item: any) => ({
                    timestamp: item.timestamp,
                    longShortRatio: parseFloat(item.longShortRatio),
                    longAccount: parseFloat(item.longAccount),
                    shortAccount: parseFloat(item.shortAccount),
                }));
            }
            return [];
        } catch (error) {
            console.error(`Error fetching data for ${tf}:`, error);
            return [];
        }
    };

    const calculateChange = (data: LongShortRatioData[]) => {
        if (!data || data.length < 2) return 0;
        const first = data[0].longShortRatio;
        const last = data[data.length - 1].longShortRatio;
        return ((last - first) / first) * 100;
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch chart data for selected timeframe
            const currentData = await fetchDataForTimeframe(selectedTimeframe, symbol);
            setChartData(currentData);

            // Fetch data for all timeframes to calculate changes
            // We do this in parallel but limit concurrency if needed, though browsers handle this fine usually
            const changePromises = TIMEFRAMES.map(async (tf) => {
                const data = await fetchDataForTimeframe(tf, symbol);
                return {
                    timeframe: tf,
                    change: calculateChange(data)
                };
            });

            const calculatedChanges = await Promise.all(changePromises);
            setChanges(calculatedChanges);
            setLastUpdated(new Date());
            toast.success('Long/Short Ratio updated');
        } catch (error) {
            console.error('Error updating widget:', error);
            toast.error('Failed to update data');
        } finally {
            setLoading(false);
        }
    }, [selectedTimeframe, symbol]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
                    <p className="text-xs text-muted-foreground mb-1">
                        {new Date(label).toLocaleTimeString()}
                    </p>
                    <p className="text-sm font-bold text-neon-blue">
                        Ratio: {payload[0].value.toFixed(4)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (

        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Long/Short Ratio</h3>
                </div>
            </div>
            <div className="flex flex-col h-full p-4 space-y-4">
                {/* Controls */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Select value={symbol} onValueChange={setSymbol}>
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                                <SelectValue placeholder="Symbol" />
                            </SelectTrigger>
                            <SelectContent>
                                {SYMBOLS.map(s => (
                                    <SelectItem key={s} value={s} className="text-xs">
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                            <SelectTrigger className="h-8 w-[80px] text-xs">
                                <SelectValue placeholder="TF" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEFRAMES.map(tf => (
                                    <SelectItem key={tf} value={tf} className="text-xs">
                                        {tf}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchAllData}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="longShortRatio"
                                stroke="hsl(var(--neon-blue))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "hsl(var(--neon-blue))" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Percentage Changes List */}
                <div className="border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Changes by Timeframe</p>
                    <ScrollArea className="h-[80px] w-full pr-2">
                        <div className="grid grid-cols-3 gap-2">
                            {changes.map((item) => (
                                <div key={item.timeframe} className="flex items-center justify-between bg-muted/30 rounded p-1.5">
                                    <span className="text-xs text-muted-foreground">{item.timeframe}</span>
                                    <div className="flex items-center gap-1">
                                        {item.change > 0 ? (
                                            <TrendingUp className="h-3 w-3 text-neon-green" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 text-neon-red" />
                                        )}
                                        <span className={cn(
                                            "text-xs font-medium",
                                            item.change > 0 ? "text-neon-green" : "text-neon-red"
                                        )}>
                                            {Math.abs(item.change).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
});

LongShortRatioWidget.displayName = 'LongShortRatioWidget';
