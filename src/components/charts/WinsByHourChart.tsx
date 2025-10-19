import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeMode } from "@/hooks/useThemeMode";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from "@/contexts/AIAssistantContext";

interface Trade {
  trade_date: string;
  pnl: number;
}

interface WinsByHourChartProps {
  trades: Trade[];
}

export const WinsByHourChart = ({ trades }: WinsByHourChartProps) => {
  const { colors } = useThemeMode();
  const { isMobile, optimizeDataPoints } = useMobileOptimization();
  const { openWithPrompt } = useAIAssistant();

  const hourlyDataRaw = Array.from({ length: 24 }, (_, hour) => {
    const tradesAtHour = trades.filter(trade => {
      const date = new Date(trade.trade_date);
      return date.getHours() === hour;
    });

    const wins = tradesAtHour.filter(t => t.pnl > 0).length;
    const losses = tradesAtHour.filter(t => t.pnl <= 0).length;

    return {
      hour: hour.toString().padStart(2, '0') + 'h',
      hourNum: hour,
      wins,
      losses,
    };
  });

  // Optimize for mobile: show every 2-3 hours instead of all 24
  const hourlyData = isMobile 
    ? hourlyDataRaw.filter((_, index) => index % 3 === 0)
    : hourlyDataRaw;

  const totalTrades = trades.length;
  const chartSummary = `Trading activity across ${totalTrades} trades. Peak hours show ${hourlyDataRaw.reduce((max, h) => h.wins + h.losses > max.wins + max.losses ? h : max).hour}`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Wins & Losses by Hour of Day</CardTitle>
          <ExplainMetricButton
            metricName="Wins & Losses by Hour"
            metricValue={`${totalTrades} trades`}
            context={chartSummary}
            onExplain={openWithPrompt}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <BarChart data={hourlyData} barGap={isMobile ? 4 : 8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey="hour" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={0}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '11px' : '13px'
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
              radius={isMobile ? [4, 4, 0, 0] : [6, 6, 0, 0]}
              name="Wins"
            />
            <Bar 
              dataKey="losses" 
              fill={colors.negative}
              opacity={0.7}
              radius={isMobile ? [4, 4, 0, 0] : [6, 6, 0, 0]}
              name="Losses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
