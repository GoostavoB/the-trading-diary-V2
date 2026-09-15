import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

export function PositionSizeCalculator() {
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [riskPercentage, setRiskPercentage] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const account = parseFloat(accountSize);
    const risk = parseFloat(riskPercentage);
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);

    if (!account || !risk || !entry || !stop) {
      return;
    }

    const riskAmount = account * (risk / 100);
    const stopDistance = Math.abs(entry - stop);
    const stopPercentage = (stopDistance / entry) * 100;
    const positionSize = riskAmount / stopDistance;
    const positionValue = positionSize * entry;
    const positionAsPercentage = (positionValue / account) * 100;

    // Calculate potential profit scenarios
    const riskRewardRatios = [1, 1.5, 2, 3];
    const profitScenarios = riskRewardRatios.map(ratio => ({
      ratio,
      targetPrice: entry + (stopDistance * ratio * (entry > stop ? 1 : -1)),
      profit: riskAmount * ratio,
      profitPercentage: risk * ratio
    }));

    setResult({
      riskAmount,
      stopDistance,
      stopPercentage,
      positionSize,
      positionValue,
      positionAsPercentage,
      profitScenarios
    });
  };

  return (
    <PremiumCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Position Size Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="accountSize">Account Size ($)</Label>
          <Input
            id="accountSize"
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            placeholder="10000"
          />
        </div>
        <div>
          <Label htmlFor="riskPercentage">Risk per Trade (%)</Label>
          <Input
            id="riskPercentage"
            type="number"
            step="0.1"
            value={riskPercentage}
            onChange={(e) => setRiskPercentage(e.target.value)}
            placeholder="1"
          />
        </div>
        <div>
          <Label htmlFor="entryPrice">Entry Price ($)</Label>
          <Input
            id="entryPrice"
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="50.00"
          />
        </div>
        <div>
          <Label htmlFor="stopLoss">Stop Loss ($)</Label>
          <Input
            id="stopLoss"
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="48.50"
          />
        </div>
      </div>

      <Button onClick={calculate} className="w-full mb-6">
        Calculate Position Size
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumCard className="p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Risk Amount</span>
              </div>
              <div className="text-2xl font-bold">${result.riskAmount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Maximum loss on this trade
              </div>
            </PremiumCard>

            <PremiumCard className="p-4 bg-purple-50 dark:bg-purple-950/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Position Size</span>
              </div>
              <div className="text-2xl font-bold">{result.positionSize.toFixed(4)} units</div>
              <div className="text-xs text-muted-foreground mt-1">
                ${result.positionValue.toFixed(2)} ({result.positionAsPercentage.toFixed(1)}% of account)
              </div>
            </PremiumCard>
          </div>

          <PremiumCard className="p-4 bg-accent">
            <h3 className="font-semibold mb-3">Stop Loss Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium">${result.stopDistance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Percentage:</span>
                <span className="font-medium">{result.stopPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-3">Profit Targets (Risk:Reward Ratios)</h3>
            <div className="space-y-3">
              {result.profitScenarios.map((scenario: any) => (
                <div key={scenario.ratio} className="flex items-center justify-between p-3 bg-accent rounded">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {scenario.ratio}:1 R:R
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Target: ${scenario.targetPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +${scenario.profit.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{scenario.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
      )}
    </PremiumCard>
  );
}
