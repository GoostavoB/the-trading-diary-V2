import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Trade } from '@/types/trade';
import { detectMarketRegime } from '@/utils/marketRegimeDetection';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MarketRegimeDetectorProps {
  trades: Trade[];
}

const regimeIcons = {
  'bull': TrendingUp,
  'bear': TrendingDown,
  'sideways': Minus,
  'high-volatility': Zap,
  'low-volatility': Activity,
};

const regimeColors = {
  'bull': 'text-success bg-success/10 border-success/20',
  'bear': 'text-destructive bg-destructive/10 border-destructive/20',
  'sideways': 'text-muted-foreground bg-secondary border-border',
  'high-volatility': 'text-warning bg-warning/10 border-warning/20',
  'low-volatility': 'text-primary bg-primary/10 border-primary/20',
};

export const MarketRegimeDetector = ({ trades }: MarketRegimeDetectorProps) => {
  const detection = useMemo(() => detectMarketRegime(trades), [trades]);

  const RegimeIcon = regimeIcons[detection.currentRegime];

  return (
    <div className="space-y-6">
      <Card className={`p-6 border-2 ${regimeColors[detection.currentRegime]}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-background">
              <RegimeIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Current Market Regime</div>
              <div className="text-2xl font-bold capitalize">{detection.currentRegime.replace('-', ' ')}</div>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            {detection.confidence.toFixed(0)}% Confidence
          </Badge>
        </div>

        <Progress value={detection.confidence} className="mb-4" />

        <div className="space-y-2 mb-4">
          <div className="text-sm font-medium">Characteristics:</div>
          {detection.characteristics.map((char, idx) => (
            <div key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{char}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Regime-Specific Suggestions</h3>
        <div className="space-y-3">
          {detection.suggestions.map((suggestion, idx) => (
            <div 
              key={idx} 
              className="p-3 rounded-lg bg-secondary/50 flex items-start gap-3"
            >
              <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm flex-1">{suggestion}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Historical Performance by Regime</h3>
        <div className="space-y-3">
          {detection.historicalPerformance
            .filter(perf => perf.tradeCount > 0)
            .map((perf, idx) => {
              const Icon = regimeIcons[perf.regime];
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${regimeColors[perf.regime]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium capitalize">{perf.regime.replace('-', ' ')}</span>
                    </div>
                    <Badge variant="outline">{perf.tradeCount} trades</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">{perf.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg P&L</div>
                      <div className={`font-semibold ${perf.avgPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                        ${perf.avgPnL.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
};
