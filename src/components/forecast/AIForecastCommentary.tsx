import { Card } from '@/components/ui/card';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { formatGrowth } from '@/utils/growthFormatting';

interface AIForecastCommentaryProps {
  dailyGrowth: number;
  fiveYearGrowth: number;
  winRate: number;
  volatility: number;
}

export const AIForecastCommentary = ({
  dailyGrowth,
  fiveYearGrowth,
  winRate,
  volatility,
}: AIForecastCommentaryProps) => {
  const generateCommentary = () => {
    const multiplier = (1 + fiveYearGrowth).toFixed(0);
    const isHighRisk = volatility > 0.15 || winRate < 0.5;
    
    let commentary = `Based on your current daily growth of ${formatGrowth(dailyGrowth)}, maintaining this pace for 5 years would multiply your capital by approximately ${multiplier}x.`;
    
    if (isHighRisk) {
      commentary += ` However, your win rate of ${(winRate * 100).toFixed(1)}% and volatility suggest elevated risk. Focus on consistency and risk management to achieve these projections.`;
    } else {
      commentary += ` Your ${(winRate * 100).toFixed(1)}% win rate shows good consistency. Maintain your discipline to achieve these results.`;
    }
    
    commentary += ` Remember that real results vary due to volatility, market conditions, and behavioral factors.`;
    
    return commentary;
  };

  const isHighRisk = volatility > 0.15 || winRate < 0.5;

  return (
    <Card className={`p-6 ${isHighRisk ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'} glass-strong`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${isHighRisk ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
          {isHighRisk ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            AI Analysis
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {generateCommentary()}
          </p>
        </div>
      </div>
    </Card>
  );
};
