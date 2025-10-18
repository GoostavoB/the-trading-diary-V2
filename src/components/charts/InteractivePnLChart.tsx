import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { Card } from "@/components/ui/card";

interface InteractivePnLChartProps {
  data: Array<{
    date: string;
    pnl: number;
    cumulative: number;
  }>;
}

export const InteractivePnLChart = ({ data }: InteractivePnLChartProps) => {
  const averagePnL = data.reduce((sum, item) => sum + item.pnl, 0) / data.length;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Interactive P&L Chart</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <ReferenceLine 
            y={averagePnL} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3" 
            label="Average"
          />
          <Line 
            type="monotone" 
            dataKey="cumulative" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Cumulative P&L"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="pnl" 
            stroke="hsl(var(--secondary))" 
            strokeWidth={1.5}
            name="Daily P&L"
            dot={false}
          />
          <Brush 
            dataKey="date" 
            height={30} 
            stroke="hsl(var(--primary))"
            fill="hsl(var(--muted))"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
