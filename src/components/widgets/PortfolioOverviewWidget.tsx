import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface PortfolioOverviewWidgetProps extends WidgetProps {
  data: Array<{ date: string; value: number }>;
  totalValue: number;
}

export const PortfolioOverviewWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  data,
  totalValue,
}: PortfolioOverviewWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      title="Portfolio Overview"
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
    >
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            <BlurredCurrency amount={totalValue} className="inline" />
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total Portfolio Value</p>
        </div>

        {data && data.length > 0 && (
          <div className="flex-1 min-h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
});

PortfolioOverviewWidget.displayName = 'PortfolioOverviewWidget';
