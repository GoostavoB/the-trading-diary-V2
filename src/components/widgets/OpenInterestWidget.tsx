import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { WidgetProps } from '@/types/widget';
import { Skeleton } from '@/components/ui/skeleton';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
const PERIODS = [
  { label: '24H', value: '5m', limit: 288 },
  { label: '7D', value: '1h', limit: 168 },
  { label: '30D', value: '4h', limit: 180 }
];

interface OIDataPoint {
  timestamp: number;
  value: number;
}

export function OpenInterestWidget({ id, isEditMode }: WidgetProps) {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [period, setPeriod] = useState('5m');
  const [data, setData] = useState<OIDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOI, setCurrentOI] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const periodConfig = PERIODS.find(p => p.value === period) || PERIODS[0];
        const response = await fetch(
          `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${periodConfig.limit}`
        );
        const result = await response.json();

        if (result && result.length > 0) {
          const processed = result.map((item: any) => ({
            timestamp: item.timestamp,
            value: parseFloat(item.sumOpenInterest)
          }));

          setData(processed);
          const current = processed[processed.length - 1].value;
          const previous = processed[0].value;
          setCurrentOI(current);
          setChange(((current - previous) / previous) * 100);
        }
      } catch (error) {
        console.error('OI fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, period]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Open Interest
          </CardTitle>
          <div className="flex gap-2">
            <Select value={symbol} onValueChange={setSymbol} disabled={isEditMode}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod} disabled={isEditMode}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <div className="text-2xl font-bold">
                {(currentOI / 1000000).toFixed(2)}M
              </div>
              <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(change).toFixed(2)}%
              </div>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(ts) => format(new Date(ts), 'MMM dd')}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M`, 'Open Interest']}
                    labelFormatter={(ts) => format(new Date(ts), 'PPpp')}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
