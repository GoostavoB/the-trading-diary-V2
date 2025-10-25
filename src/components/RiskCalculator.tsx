import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Calculator, AlertTriangle, TrendingUp, DollarSign, CheckCircle2, ThumbsUp } from 'lucide-react';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

export const RiskCalculator = () => {
  // Position Size Calculator
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercentage, setRiskPercentage] = useState('2');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  // Risk/Reward Calculator
  const [rrEntryPrice, setRrEntryPrice] = useState('');
  const [rrStopLoss, setRrStopLoss] = useState('');
  const [rrTakeProfit, setRrTakeProfit] = useState('');

  // Kelly Criterion
  const [winRate, setWinRate] = useState('55');
  const [avgWin, setAvgWin] = useState('150');
  const [avgLoss, setAvgLoss] = useState('100');

  const calculatePositionSize = () => {
    const balance = parseFloat(accountBalance);
    const risk = parseFloat(riskPercentage);
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);

    if (!balance || !risk || !entry || !stop) return null;

    const riskAmount = (balance * risk) / 100;
    const priceRisk = Math.abs(entry - stop);
    const positionSize = riskAmount / priceRisk;
    const positionValue = positionSize * entry;

    return {
      riskAmount,
      positionSize,
      positionValue,
      priceRisk,
    };
  };

  const calculateRiskReward = () => {
    const entry = parseFloat(rrEntryPrice);
    const stop = parseFloat(rrStopLoss);
    const target = parseFloat(rrTakeProfit);

    if (!entry || !stop || !target) return null;

    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    const ratio = reward / risk;

    return {
      risk,
      reward,
      ratio,
      riskPercent: ((risk / entry) * 100),
      rewardPercent: ((reward / entry) * 100),
    };
  };

  const calculateKelly = () => {
    const w = parseFloat(winRate) / 100;
    const avgW = parseFloat(avgWin);
    const avgL = parseFloat(avgLoss);

    if (!w || !avgW || !avgL) return null;

    const b = avgW / avgL;
    const kelly = ((b * w) - (1 - w)) / b;
    const fractionalKelly = kelly * 0.25; // Quarter Kelly for safety

    return {
      kelly: kelly * 100,
      fractionalKelly: fractionalKelly * 100,
      recommended: Math.max(0, Math.min(fractionalKelly * 100, 10)), // Cap at 10%
    };
  };

  const positionCalc = calculatePositionSize();
  const rrCalc = calculateRiskReward();
  const kellyCalc = calculateKelly();

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Risk Management Calculator
        </h3>
        <p className="text-sm text-muted-foreground">
          Calculate position sizes and risk metrics
        </p>
      </div>

      <Tabs defaultValue="position" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="position" className="min-h-[44px] text-xs sm:text-sm">
            <span className="hidden sm:inline">Position Size</span>
            <span className="sm:hidden">Position</span>
          </TabsTrigger>
          <TabsTrigger value="rr" className="min-h-[44px] text-xs sm:text-sm">
            <span className="hidden sm:inline">Risk/Reward</span>
            <span className="sm:hidden">R/R</span>
          </TabsTrigger>
          <TabsTrigger value="kelly" className="min-h-[44px] text-xs sm:text-sm">
            <span className="hidden sm:inline">Kelly Criterion</span>
            <span className="sm:hidden">Kelly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="position" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="account-balance">Account Balance ($)</Label>
              <Input
                id="account-balance"
                type="number"
                inputMode="decimal"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                placeholder="10000"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="risk-percentage">Risk Per Trade (%)</Label>
              <Input
                id="risk-percentage"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(e.target.value)}
                placeholder="2"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="entry-price">Entry Price ($)</Label>
              <Input
                id="entry-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="50000"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="stop-loss">Stop Loss ($)</Label>
              <Input
                id="stop-loss"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="49000"
                className="min-h-[48px]"
              />
            </div>
          </div>

          {positionCalc && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Amount</span>
                  <span className="text-lg font-bold text-neon-red">
                    <BlurredCurrency amount={positionCalc.riskAmount} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Position Size</span>
                  <span className="text-lg font-bold text-primary">
                    {positionCalc.positionSize.toFixed(4)} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Position Value</span>
                  <span className="text-lg font-bold">
                    <BlurredCurrency amount={positionCalc.positionValue} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price Risk</span>
                  <span className="text-lg font-bold">
                    <BlurredCurrency amount={positionCalc.priceRisk} />
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Never risk more than {riskPercentage}% of your account on a single trade.
                    This position will risk <BlurredCurrency amount={positionCalc.riskAmount} className="inline" /> if your stop
                    loss is hit.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rr" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="rr-entry">Entry Price ($)</Label>
              <Input
                id="rr-entry"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={rrEntryPrice}
                onChange={(e) => setRrEntryPrice(e.target.value)}
                placeholder="50000"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="rr-stop">Stop Loss ($)</Label>
              <Input
                id="rr-stop"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={rrStopLoss}
                onChange={(e) => setRrStopLoss(e.target.value)}
                placeholder="49000"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="rr-target">Take Profit ($)</Label>
              <Input
                id="rr-target"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={rrTakeProfit}
                onChange={(e) => setRrTakeProfit(e.target.value)}
                placeholder="52000"
                className="min-h-[48px]"
              />
            </div>
          </div>

          {rrCalc && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk ($)</span>
                  <span className="text-lg font-bold text-neon-red">
                    <BlurredCurrency amount={rrCalc.risk} className="inline" /> (<BlurredPercent value={rrCalc.riskPercent} className="inline" />)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reward ($)</span>
                  <span className="text-lg font-bold text-neon-green">
                    <BlurredCurrency amount={rrCalc.reward} className="inline" /> (<BlurredPercent value={rrCalc.rewardPercent} className="inline" />)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Risk/Reward Ratio</span>
                  <Badge
                    className={`text-lg ${
                      rrCalc.ratio >= 2
                        ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                        : rrCalc.ratio >= 1.5
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }`}
                  >
                    1:{rrCalc.ratio.toFixed(2)}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rrCalc.ratio >= 2
                    ? <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" />Excellent risk/reward ratio! This trade setup has strong potential.</span>
                    : rrCalc.ratio >= 1.5
                    ? <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4 text-primary" />Good risk/reward ratio. Consider taking this trade.</span>
                    : <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-500" />Low risk/reward ratio. Consider waiting for better setups with at least 1:2 R/R.</span>}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kelly" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="win-rate">Win Rate (%)</Label>
              <Input
                id="win-rate"
                type="number"
                inputMode="decimal"
                step="1"
                value={winRate}
                onChange={(e) => setWinRate(e.target.value)}
                placeholder="55"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="avg-win">Average Win ($)</Label>
              <Input
                id="avg-win"
                type="number"
                inputMode="decimal"
                step="1"
                value={avgWin}
                onChange={(e) => setAvgWin(e.target.value)}
                placeholder="150"
                className="min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="avg-loss">Average Loss ($)</Label>
              <Input
                id="avg-loss"
                type="number"
                inputMode="decimal"
                step="1"
                value={avgLoss}
                onChange={(e) => setAvgLoss(e.target.value)}
                placeholder="100"
                className="min-h-[48px]"
              />
            </div>
          </div>

          {kellyCalc && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Full Kelly %</span>
                  <span className="text-lg font-bold">
                    {kellyCalc.kelly.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fractional Kelly (1/4)</span>
                  <span className="text-lg font-bold text-primary">
                    {kellyCalc.fractionalKelly.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Recommended Risk %</span>
                  <Badge className="text-lg bg-neon-green/20 text-neon-green border-neon-green/30">
                    {kellyCalc.recommended.toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 The Kelly Criterion suggests optimal position sizing based on your edge.
                    We recommend using a fractional Kelly (1/4) to reduce volatility.
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Never risk more than 2-3% per trade regardless of Kelly. This formula
                      assumes your statistics are accurate and consistent.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
