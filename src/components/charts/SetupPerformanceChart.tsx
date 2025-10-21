import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis, ReferenceLine, Cell } from 'recharts';
import { Card } from "@/components/ui/card";

interface SetupPerformanceChartProps {
  data: Array<{
    setup: string;
    winRate: number;
    roi: number;
    tradeCount: number;
  }>;
}

export const SetupPerformanceChart = ({ data }: SetupPerformanceChartProps) => {
  const getQuadrantLabel = (entry: any) => {
    if (entry.winRate > 50 && entry.roi > 0) return '⭐ Best Setups - High WR & Positive ROI';
    if (entry.winRate <= 50 && entry.roi > 0) return '✅ Profitable - But Low Win Rate';
    if (entry.winRate > 50 && entry.roi <= 0) return '⚠️ Losing Despite High WR';
    return '❌ Avoid - Low WR & Negative ROI';
  };

  const getBubbleColor = (entry: any) => {
    if (entry.winRate > 50 && entry.roi > 0) return 'hsl(var(--success))';
    if (entry.winRate <= 50 && entry.roi < 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--warning))';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Setup Performance Analysis</h3>
      <ResponsiveContainer width="100%" height={450}>
        <ScatterChart
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          {/* Quadrant divider lines */}
          <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="5 5" strokeWidth={2} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="5 5" strokeWidth={2} />
          
          <XAxis 
            type="number" 
            dataKey="winRate" 
            name="Win Rate"
            unit="%"
            domain={[0, 100]}
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
            label={{ value: 'Win Rate (%)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            type="number" 
            dataKey="roi" 
            name="ROI"
            unit="%"
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
            label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
          />
          <ZAxis 
            type="number" 
            dataKey="tradeCount" 
            range={[100, 1000]} 
            name="Trade Count"
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '12px'
            }}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const data = payload[0].payload;
              return (
                <div className="glass p-3 rounded-lg border">
                  <p className="font-bold text-base mb-2">{data.setup}</p>
                  <div className="space-y-1 text-sm">
                    <p>Win Rate: <span className="font-mono font-semibold">{data.winRate.toFixed(1)}%</span></p>
                    <p>ROI: <span className="font-mono font-semibold">{data.roi.toFixed(2)}%</span></p>
                    <p>Trades: <span className="font-mono">{data.tradeCount}</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {getQuadrantLabel(data)}
                  </p>
                </div>
              );
            }}
          />
          <Legend />
          <Scatter name="Trading Setups" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBubbleColor(entry)} />
            ))}
          </Scatter>
          
          {/* Quadrant labels */}
          <text x="75%" y="15%" textAnchor="middle" fill="hsl(var(--success))" fontSize={12} fontWeight="bold">
            ⭐ Best Setups
          </text>
          <text x="25%" y="15%" textAnchor="middle" fill="hsl(var(--warning))" fontSize={12} fontWeight="bold">
            ⚠️ Needs Work
          </text>
          <text x="75%" y="92%" textAnchor="middle" fill="hsl(var(--warning))" fontSize={12} fontWeight="bold">
            ✅ Refine Entry
          </text>
          <text x="25%" y="92%" textAnchor="middle" fill="hsl(var(--destructive))" fontSize={12} fontWeight="bold">
            ❌ Avoid These
          </text>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-1">
        <p className="text-xs text-muted-foreground text-center">
          Bubble size = trade count • Top-right quadrant = ideal setups (high win rate + positive ROI)
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Color: 🟢 Green = profitable with high WR • 🟡 Yellow = needs optimization • 🔴 Red = avoid
        </p>
      </div>
    </Card>
  );
};
