import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from "@/components/ui/card";

interface AssetPerformanceRadarProps {
  data: Array<{
    asset: string;
    winRate: number;
    avgProfit: number;
    tradeCount: number;
    roi: number;
  }>;
}

export const AssetPerformanceRadar = ({ data }: AssetPerformanceRadarProps) => {
  // Normalize data for radar chart (scale 0-100)
  const normalizedData = data.map(item => ({
    asset: item.asset,
    'Win Rate': item.winRate,
    'ROI': Math.min((item.roi / 100) * 100, 100), // Scale to 0-100
    'Trade Volume': Math.min((item.tradeCount / Math.max(...data.map(d => d.tradeCount))) * 100, 100),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Asset Performance Radar</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={normalizedData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="asset" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Radar 
            name="Win Rate" 
            dataKey="Win Rate" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.3}
          />
          <Radar 
            name="ROI" 
            dataKey="ROI" 
            stroke="hsl(var(--secondary))" 
            fill="hsl(var(--secondary))" 
            fillOpacity={0.3}
          />
          <Radar 
            name="Trade Volume" 
            dataKey="Trade Volume" 
            stroke="hsl(var(--accent))" 
            fill="hsl(var(--accent))" 
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};
