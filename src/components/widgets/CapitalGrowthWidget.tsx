import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
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
    <WidgetWrapper
      id={id}
      title={t('widgets.capitalGrowth.title')}
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('widgets.initial')}</p>
            <p className="text-sm font-semibold">
              <BlurredCurrency amount={totalCapitalInvested} className="inline" />
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('widgets.current')}</p>
            <p className="text-sm font-semibold">
              <BlurredCurrency amount={currentBalance} className="inline" />
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('widgets.growth')}</p>
            <div className="flex items-center gap-1">
              <p className={`text-sm font-semibold ${isPositive ? 'text-profit' : 'text-loss'}`}>
                {isPositive ? '+' : ''}{growthPercentage.toFixed(2)}%
              </p>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-profit" />
              ) : (
                <TrendingDown className="h-3 w-3 text-loss" />
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor="hsl(var(--primary))" 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor="hsl(var(--primary))" 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), t('widgets.balance')]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#capitalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetWrapper>
  );
});

CapitalGrowthWidget.displayName = 'CapitalGrowthWidget';
