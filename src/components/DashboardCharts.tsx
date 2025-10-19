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
  chartType?: 'cumulative' | 'winsLosses';
}

export const DashboardCharts = ({ trades, chartType }: DashboardChartsProps) => {
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

  // Render specific chart if chartType is provided
  if (chartType === 'cumulative') {
    return (
      <div className="w-full">
        <p className="text-xs lg:text-sm text-muted-foreground mb-2 lg:mb-3">
          Track your cumulative profit and loss over time.
        </p>
        {cumulativePnL.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumulativePnL} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickMargin={8}
                width={60}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))', fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background) / 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500, marginBottom: '4px' }}
                formatter={(value: any) => {
                  const numValue = Number(value);
                  const color = numValue === 0 ? 'hsl(var(--foreground))' : numValue > 0 ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))';
                  return [<span style={{ color, fontWeight: 600 }}>${numValue.toFixed(2)}</span>, 'Cumulative P&L'];
                }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPnl)"
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
    );
  }

  if (chartType === 'winsLosses') {
    return (
      <div className="w-full">
        <p className="text-xs lg:text-sm text-muted-foreground mb-2 lg:mb-3">
          Compare your winning and losing trades by date.
        </p>
        {winsLossesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winsLossesData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickMargin={8}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background) / 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500, marginBottom: '4px' }}
                formatter={(value: any, name: string) => {
                  const color = name === 'wins' ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))';
                  const label = name === 'wins' ? 'Wins' : 'Losses';
                  return [<span style={{ color, fontWeight: 600 }}>{value}</span>, label];
                }}
              />
              <Bar 
                dataKey="wins" 
                fill="hsl(var(--neon-green))" 
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
              <Bar 
                dataKey="losses" 
                fill="hsl(var(--neon-red))" 
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
    );
  }

  // Default: render both charts (legacy support)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="p-4 lg:p-6 bg-card border-border">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Cumulative P&L</h3>
        {cumulativePnL.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
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
                  backgroundColor: 'hsl(var(--background) / 0.8)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: any) => {
                  const numValue = Number(value);
                  const color = numValue === 0 ? 'hsl(var(--foreground))' : numValue > 0 ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))';
                  return [<span style={{ color }}>${numValue.toFixed(2)}</span>, 'pnl'];
                }}
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
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </Card>

      <Card className="p-4 lg:p-6 bg-card border-border">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Wins vs Losses</h3>
        {winsLossesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
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
                  backgroundColor: 'hsl(var(--background) / 0.8)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="wins" fill="hsl(var(--neon-green))" />
              <Bar dataKey="losses" fill="hsl(var(--neon-red))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </Card>
    </div>
  );
};
