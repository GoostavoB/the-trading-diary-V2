import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeMode } from "@/hooks/useThemeMode";

interface Trade {
  trade_date: string;
  pnl: number;
}

interface WinsByHourChartProps {
  trades: Trade[];
}

export const WinsByHourChart = ({ trades }: WinsByHourChartProps) => {
  const { colors } = useThemeMode();

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const tradesAtHour = trades.filter(trade => {
      const date = new Date(trade.trade_date);
      return date.getHours() === hour;
    });

    const wins = tradesAtHour.filter(t => t.pnl > 0).length;
    const losses = tradesAtHour.filter(t => t.pnl <= 0).length;

    return {
      hour: hour.toString().padStart(2, '0') + 'h',
      wins,
      losses,
    };
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Wins & Losses by Hour of Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={hourlyData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey="hour" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="wins" 
              fill={colors.positive}
              opacity={0.7}
              radius={[6, 6, 0, 0]}
              name="Wins"
            />
            <Bar 
              dataKey="losses" 
              fill={colors.negative}
              opacity={0.7}
              radius={[6, 6, 0, 0]}
              name="Losses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
