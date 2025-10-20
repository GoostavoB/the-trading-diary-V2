import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  icon?: string;
}

interface TokenAllocationChartProps {
  data: AllocationData[];
  currency?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
  'hsl(346, 77%, 50%)',
  'hsl(280, 87%, 65%)',
];

export const TokenAllocationChart = ({ data, currency = 'USD' }: TokenAllocationChartProps) => {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No tokens to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.symbol,
    value: item.value,
    percentage: item.percentage,
    fullName: item.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Composition</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{data.fullName}</p>
                    <p className="text-sm text-muted-foreground">{data.name}</p>
                    <p className="text-sm mt-1">
                      Value: ${data.value.toFixed(2)}
                    </p>
                    <p className="text-sm">
                      Allocation: {data.percentage.toFixed(2)}%
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => `${value} (${entry.payload.percentage.toFixed(1)}%)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
