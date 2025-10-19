import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { formatPercent } from "@/utils/formatNumber";

interface AssetStats {
  asset: string;
  winRate: number;
  trades: number;
}

interface TopAssetsByWinRateProps {
  assets: AssetStats[];
  limit?: number;
}

export const TopAssetsByWinRate = ({ assets, limit = 5 }: TopAssetsByWinRateProps) => {
  const sortedAssets = [...assets]
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Top Assets by Win Rate</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAssets.map((asset, index) => (
            <div key={asset.asset} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{asset.asset}</p>
                  <p className="text-xs text-muted-foreground">{asset.trades} trades</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {formatPercent(asset.winRate)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
