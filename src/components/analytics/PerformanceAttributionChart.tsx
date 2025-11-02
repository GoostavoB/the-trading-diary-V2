import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Trade } from '@/types/trade';
import { analyzePerformanceAttribution } from '@/utils/performanceAttribution';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceAttributionChartProps {
  trades: Trade[];
}

export const PerformanceAttributionChart = ({ trades }: PerformanceAttributionChartProps) => {
  const attribution = useMemo(() => analyzePerformanceAttribution(trades), [trades]);

  const renderBreakdownChart = (data: typeof attribution.bySetup, title: string) => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="subcategory" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Bar dataKey="totalPnL" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {data.slice(0, 3).map((item, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-secondary/50">
            <div className="text-sm font-medium mb-1">{item.subcategory}</div>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${item.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                ${item.totalPnL.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.winRate.toFixed(0)}% WR
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-success/5 border-success/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Top Contributors
          </h3>
          <div className="space-y-3">
            {attribution.topContributors.slice(0, 5).map((contrib, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div>
                  <div className="font-medium">{contrib.subcategory}</div>
                  <div className="text-xs text-muted-foreground">{contrib.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-profit">${contrib.totalPnL.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{contrib.contribution.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-destructive/5 border-destructive/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Worst Contributors
          </h3>
          <div className="space-y-3">
            {attribution.worstContributors.slice(0, 5).map((contrib, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div>
                  <div className="font-medium">{contrib.subcategory}</div>
                  <div className="text-xs text-muted-foreground">{contrib.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-loss">${contrib.totalPnL.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{contrib.contribution.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="time">Time of Day</TabsTrigger>
          <TabsTrigger value="day">Day of Week</TabsTrigger>
          <TabsTrigger value="holding">Holding Period</TabsTrigger>
          <TabsTrigger value="size">Position Size</TabsTrigger>
          <TabsTrigger value="side">Side</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          {renderBreakdownChart(attribution.bySetup, 'Performance by Setup')}
        </TabsContent>

        <TabsContent value="time">
          {renderBreakdownChart(attribution.byTimeOfDay, 'Performance by Time of Day')}
        </TabsContent>

        <TabsContent value="day">
          {renderBreakdownChart(attribution.byDayOfWeek, 'Performance by Day of Week')}
        </TabsContent>

        <TabsContent value="holding">
          {renderBreakdownChart(attribution.byHoldingPeriod, 'Performance by Holding Period')}
        </TabsContent>

        <TabsContent value="size">
          {renderBreakdownChart(attribution.byPositionSize, 'Performance by Position Size')}
        </TabsContent>

        <TabsContent value="side">
          {renderBreakdownChart(attribution.bySide, 'Performance by Side')}
        </TabsContent>
      </Tabs>
    </div>
  );
};
