import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";

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
  const { isMobile } = useMobileOptimization();

  // Limit to top 3 assets on mobile, 5 on desktop
  const topAssets = data
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, isMobile ? 3 : 5);

  // Normalize data for radar chart with 5 metrics (scale 0-100)
  const normalizedData = topAssets.map(item => ({
    asset: item.asset,
    'Win Rate': item.winRate,
    'ROI': Math.min((item.roi / 100) * 100, 100),
    'Trade Volume': Math.min((item.tradeCount / Math.max(...topAssets.map(d => d.tradeCount))) * 100, 100),
    'Avg Profit': Math.min((item.avgProfit / Math.max(...topAssets.map(d => d.avgProfit))) * 100, 100),
    'Consistency': Math.min((item.tradeCount * item.winRate) / 100, 100), // Calculated metric
  }));

  return (
    <PremiumCard className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base lg:text-lg font-semibold">Asset Performance Radar</h3>
      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
        <RadarChart data={normalizedData}>
          <PolarGrid stroke="hsl(var(--white)/0.1)" />
          <PolarAngleAxis
            dataKey="asset"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 8 : 10 }}
          />
          <Radar
            name="Win Rate"
            dataKey="Win Rate"
            stroke="hsl(var(--neon-blue))"
            fill="hsl(var(--neon-blue))"
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar
            name="ROI"
            dataKey="ROI"
            stroke="hsl(var(--neon-purple))"
            fill="hsl(var(--neon-purple))"
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar
            name="Trade Volume"
            dataKey="Trade Volume"
            stroke="hsl(var(--neon-yellow))"
            fill="hsl(var(--neon-yellow))"
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar
            name="Avg Profit"
            dataKey="Avg Profit"
            stroke="hsl(var(--neon-green))"
            fill="hsl(var(--neon-green))"
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar
            name="Consistency"
            dataKey="Consistency"
            stroke="hsl(var(--neon-red))"
            fill="hsl(var(--neon-red))"
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: isMobile ? '11px' : '13px'
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
            iconSize={isMobile ? 8 : 10}
          />
        </RadarChart>
      </ResponsiveContainer>
    </PremiumCard>
  );
};
