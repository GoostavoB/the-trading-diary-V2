import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ForecastChartProps {
  currentBalance: number;
  dailyGrowthBase: number;
  dailyGrowthOptimistic: number;
  dailyGrowthConservative: number;
  selectedPeriod: number; // days
}

export const ForecastChart = ({
  currentBalance,
  dailyGrowthBase,
  dailyGrowthOptimistic,
  dailyGrowthConservative,
  selectedPeriod
}: ForecastChartProps) => {
  // Generate chart data
  const generateChartData = () => {
    const data = [];
    const points = Math.min(selectedPeriod, 100); // Max 100 points for performance
    const interval = Math.ceil(selectedPeriod / points);

    for (let day = 0; day <= selectedPeriod; day += interval) {
      const conservative = currentBalance * Math.pow(1 + dailyGrowthConservative / 100, day);
      const base = currentBalance * Math.pow(1 + dailyGrowthBase / 100, day);
      const optimistic = currentBalance * Math.pow(1 + dailyGrowthOptimistic / 100, day);

      data.push({
        day,
        conservative: conservative.toFixed(2),
        base: base.toFixed(2),
        optimistic: optimistic.toFixed(2),
      });
    }

    return data;
  };

  const chartData = generateChartData();

  const formatXAxis = (value: number) => {
    if (selectedPeriod <= 30) return `Day ${value}`;
    if (selectedPeriod <= 365) return `${Math.round(value / 30)}mo`;
    return `${Math.round(value / 365)}yr`;
  };

  const formatTooltip = (value: any) => {
    return `$${parseFloat(value).toLocaleString()}`;
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold mb-4">Growth Projection</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="day" 
            tickFormatter={formatXAxis}
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
          />
          <Area
            type="monotone"
            dataKey="conservative"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorConservative)"
            name="Conservative"
          />
          <Area
            type="monotone"
            dataKey="base"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#colorBase)"
            name="Base Case"
          />
          <Area
            type="monotone"
            dataKey="optimistic"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorOptimistic)"
            name="Optimistic"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
