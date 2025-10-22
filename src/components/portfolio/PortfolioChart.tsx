import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { formatCurrency } from '@/utils/formatNumber';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { PortfolioTimeseriesPoint } from '@/utils/portfolioPerformance';

interface PortfolioChartProps {
  data: PortfolioTimeseriesPoint[];
  showPercent?: boolean;
  height?: number;
  deposits?: Array<{ date: Date; amount: number }>;
  withdrawals?: Array<{ date: Date; amount: number }>;
}

export const PortfolioChart = memo(({ 
  data, 
  showPercent = false, 
  height = 350,
  deposits = [],
  withdrawals = []
}: PortfolioChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          No portfolio data available
        </div>
      </Card>
    );
  }

  const chartData = data.map(point => ({
    date: point.date.toLocaleDateString(),
    value: showPercent ? point.pnl_pct : point.value,
    timestamp: point.date.getTime(),
  }));

  const isPositive = data[data.length - 1]?.pnl >= 0;
  const chartColor = isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))';

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <div className="flex items-center gap-2 text-sm">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-profit" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-loss" />
            )}
            <span className={isPositive ? 'text-profit' : 'text-loss'}>
              {showPercent 
                ? `${data[data.length - 1]?.pnl_pct.toFixed(2)}%`
                : formatCurrency(data[data.length - 1]?.pnl)
              }
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
              tickFormatter={(value) => showPercent ? `${value}%` : `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [
                showPercent ? `${value.toFixed(2)}%` : formatCurrency(value),
                'Value'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
            
            {/* Mark deposits */}
            {deposits.map((deposit, idx) => {
              const point = chartData.find(p => p.timestamp === deposit.date.getTime());
              if (point) {
                return (
                  <ReferenceDot
                    key={`deposit-${idx}`}
                    x={point.date}
                    y={point.value}
                    r={4}
                    fill="hsl(var(--profit))"
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
            
            {/* Mark withdrawals */}
            {withdrawals.map((withdrawal, idx) => {
              const point = chartData.find(p => p.timestamp === withdrawal.date.getTime());
              if (point) {
                return (
                  <ReferenceDot
                    key={`withdrawal-${idx}`}
                    x={point.date}
                    y={point.value}
                    r={4}
                    fill="hsl(var(--loss))"
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

PortfolioChart.displayName = 'PortfolioChart';
