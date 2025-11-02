import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { CategoryHolding, getCategoryChartColors } from '@/utils/categoryAggregation';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryViewProps {
  categories: CategoryHolding[];
  isDarkMode?: boolean;
  baseCurrency?: string;
}

export const CategoryView = ({ categories, isDarkMode = true, baseCurrency = 'USD' }: CategoryViewProps) => {
  if (!categories || categories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No category data available</p>
      </Card>
    );
  }

  const colors = getCategoryChartColors(
    categories.map(c => c.category),
    isDarkMode
  );

  // Prepare donut chart data
  const donutData = categories.map(cat => ({
    name: cat.category,
    value: cat.value,
    weight: cat.weight,
    pnl: cat.unrealizedPnL
  }));

  // Prepare bar chart data (returns by category)
  const barData = [...categories]
    .sort((a, b) => b.roi - a.roi)
    .map(cat => ({
      category: cat.category,
      roi: cat.roi,
      value: cat.value
    }));

  return (
    <div className="space-y-6">
      {/* Category Allocation Donut */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              dataKey="value"
              label={({ name, weight }) => `${name}: ${weight.toFixed(1)}%`}
              labelLine={true}
            >
              {donutData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[entry.name]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">Value: {formatCurrency(data.value, baseCurrency)}</p>
                      <p className="text-sm">Weight: {data.weight.toFixed(2)}%</p>
                      <p className={`text-sm ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        P&L: {formatCurrency(data.pnl, baseCurrency)} ({formatPercent(data.pnl / (data.value - data.pnl))})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Returns Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Returns by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical">
            <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
            <YAxis type="category" dataKey="category" width={120} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.category}</p>
                      <p className="text-sm">ROI: {data.roi.toFixed(2)}%</p>
                      <p className="text-sm">Value: {formatCurrency(data.value, baseCurrency)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="roi">
              {barData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.roi >= 0 ? '#10b981' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Metrics Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Category Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Category</th>
                <th className="text-right py-2 px-4">Value</th>
                <th className="text-right py-2 px-4">Weight</th>
                <th className="text-right py-2 px-4">P&L</th>
                <th className="text-right py-2 px-4">ROI</th>
                <th className="text-right py-2 px-4">24h</th>
                <th className="text-right py-2 px-4">7d</th>
                <th className="text-right py-2 px-4">30d</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={idx} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-medium">{cat.category}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(cat.value, baseCurrency)}</td>
                  <td className="text-right py-3 px-4">{cat.weight.toFixed(2)}%</td>
                  <td className={`text-right py-3 px-4 ${cat.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(cat.unrealizedPnL, baseCurrency)}
                  </td>
                  <td className={`text-right py-3 px-4 ${cat.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {cat.roi >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {cat.roi.toFixed(2)}%
                    </div>
                  </td>
                  <td className={`text-right py-3 px-4 ${cat.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(cat.change24h / 100)}
                  </td>
                  <td className={`text-right py-3 px-4 ${cat.change7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(cat.change7d / 100)}
                  </td>
                  <td className={`text-right py-3 px-4 ${cat.change30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(cat.change30d / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
