import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import { calculateRequiredMargin, GoalSimulatorResult } from '@/lib/forecastCalculations';

interface GoalSimulatorProps {
  currentBalance: number;
  winRate: number;
  avgGainRoi: number;
  avgLossRoi: number;
}

export const GoalSimulator = ({
  currentBalance,
  winRate,
  avgGainRoi,
  avgLossRoi,
}: GoalSimulatorProps) => {
  const [dailyGoal, setDailyGoal] = useState(100);
  const [balance, setBalance] = useState(currentBalance);
  const [tradesPerDay, setTradesPerDay] = useState(3);
  const [result, setResult] = useState<GoalSimulatorResult | null>(null);

  useEffect(() => {
    setBalance(currentBalance);
  }, [currentBalance]);

  const handleCalculate = () => {
    const calculatedResult = calculateRequiredMargin(
      dailyGoal,
      balance,
      winRate,
      avgGainRoi,
      avgLossRoi,
      tradesPerDay
    );
    setResult(calculatedResult);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Goal Simulator</h2>
          <p className="text-sm text-muted-foreground">
            Calculate the margin required per trade to achieve your daily profit goal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="dailyGoal">Daily Goal (USD)</Label>
            <Input
              id="dailyGoal"
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="balance">Current Balance (USD)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tradesPerDay">Trades Per Day</Label>
            <Input
              id="tradesPerDay"
              type="number"
              value={tradesPerDay}
              onChange={(e) => setTradesPerDay(Number(e.target.value))}
              min={1}
              className="mt-1"
            />
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium">Your Current Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Win Rate:</span>
                <span className="ml-2 font-medium">{winRate.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Gain ROI:</span>
                <span className="ml-2 font-medium text-neon-green">
                  {avgGainRoi.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Loss ROI:</span>
                <span className="ml-2 font-medium text-neon-red">
                  {avgLossRoi.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <TrendingUp className="mr-2 h-4 w-4" />
            Calculate Required Margin
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {result ? (
            <>
              {result.is_negative_expectancy && (
                <div className="flex gap-3 p-4 bg-neon-red/10 border border-neon-red/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-neon-red flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-neon-red mb-1">Negative Expectancy</p>
                    <p className="text-muted-foreground">
                      Based on your current stats, this goal may not be achievable without
                      improving your win rate or risk/reward ratio.
                    </p>
                  </div>
                </div>
              )}

              {result.is_high_risk && (
                <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-500 mb-1">High Risk Warning</p>
                    <p className="text-muted-foreground">
                      Required margin exceeds 10% per trade. Consider lowering your daily goal or
                      increasing your balance to reduce risk.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-1">Required Margin per Trade</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.required_margin_percent.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Dollar Amount per Trade</p>
                  <p className="text-2xl font-bold">
                    ${result.dollar_amount_per_trade.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Potential Loss per Trade</p>
                  <p className="text-2xl font-bold text-neon-red">
                    ${result.potential_loss_per_trade.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Daily Risk Exposure</p>
                  <p className="text-2xl font-bold">
                    ${result.daily_risk_exposure.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total capital at risk across {tradesPerDay} trades
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Interpretation:</strong> To reach ${dailyGoal} per day with {tradesPerDay}{' '}
                  trades, you need to risk approximately{' '}
                  <strong>{result.required_margin_percent.toFixed(2)}%</strong> of your balance per
                  trade.
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter your daily goal and click Calculate to see the required margin per trade
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
