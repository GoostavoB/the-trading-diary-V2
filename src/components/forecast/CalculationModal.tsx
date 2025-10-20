import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalculationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalculationModal = ({ open, onOpenChange }: CalculationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">How Your Forecast Works</DialogTitle>
          <DialogDescription>
            Understanding the statistical methodology behind your growth projections
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Introduction */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Introduction</h3>
              <p className="text-muted-foreground">
                Your forecast combines your actual trading history with financial statistics to
                project realistic growth scenarios. This approach uses geometric expectancy and
                compound growth calculations to provide more accurate long-term projections than
                simple linear models.
              </p>
            </section>

            {/* Geometric Expectancy */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Geometric Expectancy Formula</h3>
              <p className="text-muted-foreground mb-3">
                The foundation of your forecast is the geometric expectancy (G), which represents
                the expected log-return per trade:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm mb-3">
                G = (Win Rate × ln(1 + Average Gain ROI)) + ((1 - Win Rate) × ln(1 + Average Loss
                ROI))
              </div>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                Daily Growth = e<sup>G</sup> - 1
              </div>
              <p className="text-muted-foreground mt-3">
                This formula accounts for the compounding effect of both wins and losses, providing
                a more realistic measure of expected growth than arithmetic averages.
              </p>
            </section>

            {/* Why This Matters */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Why This Matters</h3>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Uses logarithmic returns:</strong> Industry standard for modeling
                  compounding growth
                </li>
                <li>
                  <strong>Probabilistic approach:</strong> Accounts for both wins and losses based
                  on your actual win rate
                </li>
                <li>
                  <strong>More realistic:</strong> Better reflects real-world trading performance
                  than linear projections
                </li>
                <li>
                  <strong>Risk-adjusted:</strong> Incorporates volatility to show best/worst case
                  scenarios
                </li>
              </ul>
            </section>

            {/* The Three Scenarios */}
            <section>
              <h3 className="text-lg font-semibold mb-2">The Three Scenarios</h3>
              <div className="space-y-3">
                <div className="bg-neon-red/10 p-4 rounded-lg border border-neon-red/30">
                  <h4 className="font-semibold text-neon-red mb-1">Conservative Scenario</h4>
                  <p className="text-sm text-muted-foreground">
                    Subtracts volatility (standard deviation) from the base expectancy to model
                    worse-case consistency. This accounts for periods of higher drawdowns or
                    increased losses.
                  </p>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                  <h4 className="font-semibold text-primary mb-1">Base Scenario</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses your current average performance as calculated by the geometric expectancy
                    formula. This represents your most likely outcome if you maintain current
                    trading behavior.
                  </p>
                </div>

                <div className="bg-neon-green/10 p-4 rounded-lg border border-neon-green/30">
                  <h4 className="font-semibold text-neon-green mb-1">Optimistic Scenario</h4>
                  <p className="text-sm text-muted-foreground">
                    Adds volatility cushion to the base expectancy to model improved consistency.
                    This represents potential growth with better risk management and fewer losses.
                  </p>
                </div>
              </div>
            </section>

            {/* Compound Growth */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Compound Growth Calculation</h3>
              <p className="text-muted-foreground mb-3">
                Projections are calculated using compound interest over time periods:
              </p>
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg font-mono text-sm">
                <div>Monthly = (1 + Daily Growth)<sup>30</sup> - 1</div>
                <div>Yearly = (1 + Daily Growth)<sup>365</sup> - 1</div>
                <div>5-Year = (1 + Daily Growth)<sup>1825</sup> - 1</div>
              </div>
              <p className="text-muted-foreground mt-3">
                This exponential calculation shows how small daily edges compound significantly over
                longer time periods.
              </p>
            </section>

            {/* Important Notes */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Important Notes</h3>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Exponential effects:</strong> Small improvements in win rate or
                  risk/reward ratio have dramatic effects over long time periods
                </li>
                <li>
                  <strong>Negative growth:</strong> If projections are negative, it indicates a net
                  losing expectancy - your current strategy is not sustainable long-term
                </li>
                <li>
                  <strong>Past performance:</strong> Historical data doesn't guarantee future
                  results. Market conditions change, and discipline matters
                </li>
                <li>
                  <strong>Minimum data:</strong> Projections require at least 5 trades for
                  statistical validity
                </li>
              </ul>
            </section>

            {/* Interpretation Guide */}
            <section className="pb-4">
              <h3 className="text-lg font-semibold mb-2">Interpreting Your Results</h3>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>
                  <strong>Positive growth across all scenarios:</strong> Your strategy shows
                  positive expectancy. Focus on consistency and scaling gradually.
                </p>
                <p>
                  <strong>Mixed results (some positive, some negative):</strong> Your strategy is
                  borderline profitable. Small improvements in execution can shift you to
                  consistent profitability.
                </p>
                <p>
                  <strong>Negative growth in base scenario:</strong> Current strategy has negative
                  expectancy. Consider improving win rate, risk/reward ratio, or reducing trading
                  frequency.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
