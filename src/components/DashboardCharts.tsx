import { Card } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface Trade {
  id: string;
  trade_date: string;
  pnl: number;
  roi: number;
}

interface DashboardChartsProps {
  trades: Trade[];
}

export const DashboardCharts = ({ trades }: DashboardChartsProps) => {
  // Calculate cumulative P&L over time
  const cumulativePnL = trades
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
    .map((trade, index, arr) => {
      const cumulative = arr.slice(0, index + 1).reduce((sum, t) => sum + t.pnl, 0);
      return {
        date: format(new Date(trade.trade_date), 'MMM dd'),
        pnl: cumulative,
      };
    });

  // Group trades by date for wins/losses
  const tradesByDate = trades.reduce((acc, trade) => {
    const date = format(new Date(trade.trade_date), 'MMM dd');
    if (!acc[date]) {
      acc[date] = { date, wins: 0, losses: 0 };
    }
    if (trade.pnl > 0) {
      acc[date].wins += 1;
    } else {
      acc[date].losses += 1;
    }
    return acc;
  }, {} as Record<string, { date: string; wins: number; losses: number }>);

  const winsLossesData = Object.values(tradesByDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-4">Cumulative P&L</h3>
        {cumulativePnL.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cumulativePnL}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--neon-green))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--neon-green))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="hsl(var(--neon-green))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPnl)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-4">Wins vs Losses</h3>
        {winsLossesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winsLossesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="wins" fill="hsl(var(--neon-green))" />
              <Bar dataKey="losses" fill="hsl(var(--neon-red))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </Card>
    </div>
  );
};
