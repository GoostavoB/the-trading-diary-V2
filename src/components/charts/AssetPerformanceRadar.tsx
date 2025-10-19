import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from "@/components/ui/card";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from "@/contexts/AIAssistantContext";

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
  const { openWithPrompt } = useAIAssistant();

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

  const topAssetNames = topAssets.map(a => a.asset).join(', ');
  const chartSummary = `Performance comparison of top ${topAssets.length} assets: ${topAssetNames}`;

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base lg:text-lg font-semibold">Asset Performance Radar</h3>
        <ExplainMetricButton
          metricName="Asset Performance Radar"
          metricValue={`${topAssets.length} top assets`}
          context={chartSummary}
          onExplain={openWithPrompt}
        />
      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
        <RadarChart data={normalizedData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="asset" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 9 : 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 8 : 10 }}
          />
          <Radar 
            name="Win Rate" 
            dataKey="Win Rate" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar 
            name="ROI" 
            dataKey="ROI" 
            stroke="hsl(var(--secondary))" 
            fill="hsl(var(--secondary))" 
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar 
            name="Trade Volume" 
            dataKey="Trade Volume" 
            stroke="hsl(var(--accent))" 
            fill="hsl(var(--accent))" 
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar 
            name="Avg Profit" 
            dataKey="Avg Profit" 
            stroke="hsl(var(--chart-4))" 
            fill="hsl(var(--chart-4))" 
            fillOpacity={0.18}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Radar 
            name="Consistency" 
            dataKey="Consistency" 
            stroke="hsl(var(--chart-5))" 
            fill="hsl(var(--chart-5))" 
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
    </Card>
  );
};
