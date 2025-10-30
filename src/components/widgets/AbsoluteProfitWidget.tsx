import { memo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/utils/formatNumber';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface AbsoluteProfitWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  totalPnL: number;
  tradeCount: number;
  chartData: Array<{ date: string; value: number }>;
}

export const AbsoluteProfitWidget = memo(({
  id,
  isEditMode,
  onRemove,
  totalPnL,
  tradeCount,
  chartData,
}: AbsoluteProfitWidgetProps) => {
  const { t } = useTranslation();
  const { isPinned, togglePin } = usePinnedWidgets();
  // Map catalog widget ID to pinned widget ID
  const catalogId = id;
  const pinnedId = catalogId === 'absoluteProfit' ? 'total-profit' as const : undefined;
  const isPositive = totalPnL >= 0;

  return (
    <WidgetWrapper
      id={id}
      title="Total Trading Profit"
      isEditMode={isEditMode}
      onRemove={onRemove}
      headerActions={
        !isEditMode && pinnedId && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
    >
      <div className="space-y-4">
        {/* Main Metric */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <p className={`text-4xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {isPositive ? '+' : ''}<BlurredCurrency amount={totalPnL} className="inline" />
            </p>
            {isPositive ? (
              <TrendingUp className="h-6 w-6 text-profit" />
            ) : (
              <TrendingDown className="h-6 w-6 text-loss" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Pure trading profit from {tradeCount} {tradeCount === 1 ? 'trade' : 'trades'}
          </p>
        </div>

        {/* Cumulative Profit Chart */}
        {chartData.length > 0 && (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} 
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
                  formatter={(value: number) => [formatCurrency(value), 'Cumulative P&L']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                  strokeWidth={2}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
});

AbsoluteProfitWidget.displayName = 'AbsoluteProfitWidget';
