import { useEffect, useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SymbolSearch } from '@/components/market/SymbolSearch';

interface OpenInterestData {
  timestamp: number;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
}

interface ProcessedOIData {
  time: string;
  oi: number;
  changePercent: number;
}

const PERIODS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

interface OpenInterestChartsProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export const OpenInterestCharts = ({ symbol: symbolProp, onSymbolChange }: OpenInterestChartsProps = {}) => {
  const [internalSymbol, setInternalSymbol] = useState('BTCUSDT');
  const symbol = symbolProp ?? internalSymbol;
  const setSymbol = onSymbolChange ?? setInternalSymbol;
  const [period, setPeriod] = useState('1h');
  const [data, setData] = useState<ProcessedOIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOI, setCurrentOI] = useState<number>(0);
  const [change24h, setChange24h] = useState<number>(0);

  useEffect(() => {
    fetchOpenInterestData();
  }, [symbol, period]);

  const fetchOpenInterestData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=100`
      );
      const rawData: OpenInterestData[] = await response.json();

      if (rawData && rawData.length > 0) {
        const processed: ProcessedOIData[] = rawData.map((item, index) => {
          const oi = parseFloat(item.sumOpenInterest);
          const prevOI = index > 0 ? parseFloat(rawData[index - 1].sumOpenInterest) : oi;
          const changePercent = prevOI !== 0 ? ((oi - prevOI) / prevOI) * 100 : 0;

          return {
            time: new Date(item.timestamp).toLocaleTimeString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            oi: oi,
            changePercent: changePercent,
          };
        });

        setData(processed);

        // Calculate current OI and 24h change
        const latest = parseFloat(rawData[rawData.length - 1].sumOpenInterest);
        const earliest = parseFloat(rawData[0].sumOpenInterest);
        const change = ((latest - earliest) / earliest) * 100;

        setCurrentOI(latest);
        setChange24h(change);
      }
    } catch (error) {
      console.error('Error fetching Open Interest data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <PremiumCard title="Symbol" className="flex-1 min-w-[200px]">
          <SymbolSearch value={symbol} onChange={setSymbol} />
        </PremiumCard>

        <PremiumCard title="Period" className="flex-1 min-w-[200px]">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PremiumCard>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <PremiumCard title="Current Open Interest" subtitle={`${symbol.replace('USDT', '')} contracts`}>
          <div className="text-2xl font-bold text-neon-blue">
            {(currentOI / 1000).toFixed(1)}K
          </div>
        </PremiumCard>

        <PremiumCard title="Period Change" subtitle="Since period start">
          <div className={`text-2xl font-bold flex items-center gap-2 ${change24h >= 0 ? 'text-neon-green' : 'text-neon-red'
            }`}>
            {change24h >= 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        </PremiumCard>

        <PremiumCard title="Market Sentiment" subtitle="Based on OI trend">
          <div className="text-2xl font-bold">
            {change24h > 5 ? '🚀 Bullish' : change24h < -5 ? '🐻 Bearish' : '➡️ Neutral'}
          </div>
        </PremiumCard>
      </div>

      {/* Open Interest History Chart */}
      <PremiumCard title="Open Interest History">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)'
              }}
              formatter={(value: number) => [
                `${(value / 1000).toFixed(2)}K contracts`,
                'Open Interest'
              ]}
            />
            <Line
              type="monotone"
              dataKey="oi"
              stroke="hsl(var(--neon-blue))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </PremiumCard>

      {/* OI Change Rate Chart */}
      <PremiumCard title="Open Interest Change Rate">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorChangePositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-green))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-green))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorChangeNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-red))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-red))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)'
              }}
              formatter={(value: number) => [
                `${value.toFixed(2)}%`,
                'Change Rate'
              ]}
            />
            <Area
              type="monotone"
              dataKey="changePercent"
              stroke="hsl(var(--neon-purple))"
              strokeWidth={2}
              fill="url(#colorChangePositive)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </PremiumCard>
    </div>
  );
};
