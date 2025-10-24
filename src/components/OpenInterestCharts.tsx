import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
];

const PERIODS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

export const OpenInterestCharts = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
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
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select symbol" />
          </SelectTrigger>
          <SelectContent>
            {SYMBOLS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Open Interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(currentOI / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {symbol.replace('USDT', '')} contracts
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Period Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              change24h >= 0 ? 'text-profit' : 'text-loss'
            }`}>
              {change24h >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since period start
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {change24h > 5 ? '🚀 Bullish' : change24h < -5 ? '🐻 Bearish' : '➡️ Neutral'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on OI trend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Interest History Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Open Interest History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `${(value / 1000).toFixed(2)}K contracts`,
                  'Open Interest'
                ]}
              />
              <Line
                type="monotone"
                dataKey="oi"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* OI Change Rate Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Open Interest Change Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorChangePositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorChangeNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--loss))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--loss))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `${value.toFixed(2)}%`,
                  'Change Rate'
                ]}
              />
              <Area
                type="monotone"
                dataKey="changePercent"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorChangePositive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
