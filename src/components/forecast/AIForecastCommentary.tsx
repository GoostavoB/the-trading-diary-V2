import { PremiumCard } from '@/components/ui/PremiumCard';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { formatGrowth } from '@/utils/growthFormatting';

interface AIForecastCommentaryProps {
  dailyGrowth: number;
  fiveYearGrowth: number;
  winRate: number;
  volatility: number;
  capped?: boolean;
}

/**
 * Human-readable forecast commentary. Never displays multipliers above 50×
 * (numeric overflow territory) — shows "50×+" instead and flags that the
 * projection was capped for realism.
 */
export const AIForecastCommentary = ({
  dailyGrowth,
  fiveYearGrowth,
  winRate,
  volatility,
  capped,
}: AIForecastCommentaryProps) => {
  const generateCommentary = () => {
    // 5-year growth is a DECIMAL. Convert to multiple: multiplier = 1 + growth.
    // Clamp to a realistic display range — if capped flag is set, we trust it.
    const rawMultiplier = 1 + fiveYearGrowth;
    const safeMultiplier = isFinite(rawMultiplier)
      ? Math.max(0, Math.min(rawMultiplier, 50))
      : 50;

    const isHighRisk = volatility > 0.15 || winRate < 0.5;

    const multText = (() => {
      if (capped || safeMultiplier >= 50) return '50×+';
      if (safeMultiplier < 1) return `${(safeMultiplier * 100).toFixed(0)}% of your starting capital`;
      if (safeMultiplier < 2) return `${safeMultiplier.toFixed(2)}×`;
      if (safeMultiplier < 10) return `${safeMultiplier.toFixed(1)}×`;
      return `${safeMultiplier.toFixed(0)}×`;
    })();

    let commentary = `At your current daily pace of ${formatGrowth(dailyGrowth)}, maintaining this consistency for 5 years projects your capital at roughly ${multText} its starting value.`;

    if (capped) {
      commentary += ` (Projections above 50× are capped — small samples tend to overstate compounded growth. Treat these numbers as an upper envelope, not a target.)`;
    }

    if (isHighRisk) {
      commentary += ` With a win rate of ${(winRate * 100).toFixed(1)}% and elevated volatility, the actual path will vary substantially — focus on consistency and position sizing.`;
    } else {
      commentary += ` Your ${(winRate * 100).toFixed(1)}% win rate shows solid consistency — stick to your rules to realize a result in this range.`;
    }

    commentary += ` Real outcomes depend on market conditions, drawdown tolerance, and behavioral discipline.`;

    return commentary;
  };

  const isHighRisk = volatility > 0.15 || winRate < 0.5;

  return (
    <PremiumCard
      title="AI Analysis"
      className={`${isHighRisk ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'} glass-strong`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${isHighRisk ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
          {isHighRisk ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {generateCommentary()}
          </p>
        </div>
      </div>
    </PremiumCard>
  );
};
