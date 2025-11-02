import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { LazyChart } from '@/components/LazyChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface WeeklySnapshot {
  id: string;
  week_start: string;
  week_end: string;
  total_pnl: number;
  trade_count: number;
  winning_trades: number;
  losing_trades: number;
}

export const WeeklyPnLChartWidget = ({ id, ...props }: WidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if widget is expanded (full width = 12 columns)
  useEffect(() => {
    const checkWidth = () => {
      const element = document.querySelector(`[data-widget-id="${id}"]`);
      if (element) {
        const width = element.clientWidth;
        const isFullWidth = width > 900; // Approximate full width
        setIsExpanded(isFullWidth);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [id]);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['weekly-pnl-snapshots'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('weekly_pnl_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(24); // Fetch up to 24 weeks

      if (error) throw error;
      return data as WeeklySnapshot[];
    },
  });

  const chartData = (snapshots || [])
    .slice(0, isExpanded ? 24 : 8)
    .reverse()
    .map(s => ({
      week: new Date(s.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: Number(s.total_pnl),
      trades: s.trade_count,
    }));

  const totalPnL = snapshots?.reduce((sum, s) => sum + Number(s.total_pnl), 0) || 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{data.week}</p>
          <p className={`text-lg font-bold ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            ${data.pnl.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{data.trades} trades</p>
        </div>
      );
    }
    return null;
  };

  return (
    <WidgetWrapper
      id={id}
      title={`Weekly P&L History - Last ${isExpanded ? '24' : '8'} weeks`}
      {...props}
    >
      <Card className="h-full bg-gradient-to-br from-background to-accent/5 border-border/50">
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                ${totalPnL.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Weeks Tracked</div>
              <div className="text-2xl font-bold">{snapshots?.length || 0}</div>
            </div>
          </div>

          {/* Chart */}
          <LazyChart height={300}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Loading chart data...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No weekly data yet. Trade this week to start tracking!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="week"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="pnl"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    className="transition-all"
                  >
                    {chartData.map((entry, index) => (
                      <rect
                        key={`bar-${index}`}
                        fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </LazyChart>

          {/* Info */}
          <div className="text-xs text-muted-foreground/70 italic pt-2 border-t border-border/30">
            Historical data captured every Monday at 00:00
          </div>
        </div>
      </Card>
    </WidgetWrapper>
  );
};
