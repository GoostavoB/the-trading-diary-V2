import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface CapitalGrowthWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  chartData: Array<{ date: string; value: number }>;
  initialInvestment: number;
  totalCapitalAdditions?: number;
  currentBalance: number;
}

export const CapitalGrowthWidget = memo(({
  id,
  isEditMode,
  onRemove,
  chartData,
  initialInvestment,
  totalCapitalAdditions = 0,
  currentBalance,
}: CapitalGrowthWidgetProps) => {
  const { t } = useTranslation();
  const totalCapitalInvested = initialInvestment + totalCapitalAdditions;
  const totalGrowth = currentBalance - totalCapitalInvested;
  const growthPercentage = totalCapitalInvested > 0 ? ((totalGrowth / totalCapitalInvested) * 100) : 0;
  const isPositive = totalGrowth >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Title Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('widgets.capitalGrowth.title')}</p>
        <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Summary Stats Header */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('widgets.initial')}</p>
          <p className="text-sm font-bold tracking-tight">
            <BlurredCurrency amount={totalCapitalInvested} className="inline" />
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('widgets.current')}</p>
          <p className="text-sm font-bold tracking-tight text-foreground">
            <BlurredCurrency amount={currentBalance} className="inline" />
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('widgets.growth')}</p>
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-bold tracking-tight ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
              {isPositive ? '+' : ''}{growthPercentage.toFixed(2)}%
            </p>
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-neon-green" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-neon-red" />
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 relative p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "hsl(var(--neon-green))" : "hsl(var(--neon-red))"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "hsl(var(--neon-green))" : "hsl(var(--neon-red))"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              formatter={(value: number) => [formatCurrency(value), t('widgets.balance')]}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(var(--neon-green))" : "hsl(var(--neon-red))"}
              strokeWidth={2}
              fill="url(#capitalGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

CapitalGrowthWidget.displayName = 'CapitalGrowthWidget';
