import { memo } from 'react';

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
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

    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-sm">Portfolio Overview</h3>
      </div>
      <div className="p-4 space-y-4 flex-1 flex flex-col">
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
    </div>
  );
});

PortfolioOverviewWidget.displayName = 'PortfolioOverviewWidget';
