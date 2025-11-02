import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingDown, TrendingUp, AlertCircle, Target } from "lucide-react";
import { formatNumberInput, parseDecimalInput } from "@/utils/numberFormatting";

interface RiskPreset {
  name: string;
  riskPercent: number;
  description: string;
}

const RISK_PRESETS: RiskPreset[] = [
  { name: "Conservative", riskPercent: 1, description: "1% risk per trade" },
  { name: "Moderate", riskPercent: 2, description: "2% risk per trade" },
  { name: "Aggressive", riskPercent: 3, description: "3% risk per trade" },
];

interface TakeProfitLevel {
  ratio: number;
  price: number;
  profit: number;
}

export function EnhancedStopLossCalculator() {
  const [accountSize, setAccountSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState<{
    riskAmount: number;
    positionSize: number;
    positionValue: number;
    longStopPrice: number;
    longStopDistance: number;
    longStopPercent: number;
    shortStopPrice: number;
    shortStopDistance: number;
    shortStopPercent: number;
    longTakeProfits: TakeProfitLevel[];
    shortTakeProfits: TakeProfitLevel[];
    breakeven: { long: number; short: number };
  } | null>(null);

  const applyPreset = (preset: RiskPreset) => {
    setRiskPercent(preset.riskPercent.toString());
  };

  const calculateStopLoss = () => {
    const account = parseDecimalInput(accountSize);
    const risk = parseDecimalInput(riskPercent);
    const entry = parseDecimalInput(entryPrice);
    const stop = parseDecimalInput(stopLoss);

    if (!account || !risk || !entry || !stop) {
      return;
    }

    // Validate inputs
    if (account <= 0 || risk <= 0 || risk > 100 || entry <= 0 || stop <= 0) {
      return;
    }

    // Calculate risk amount
    const riskAmount = account * (risk / 100);

    // Calculate position size
    const stopDistance = Math.abs(entry - stop);
    const positionSize = riskAmount / stopDistance;
    const positionValue = positionSize * entry;

    // Calculate stop prices for long and short
    const longStopPrice = stop < entry ? stop : entry - stopDistance;
    const longStopDistance = Math.abs(entry - longStopPrice);
    const longStopPercent = (longStopDistance / entry) * 100;

    const shortStopPrice = stop > entry ? stop : entry + stopDistance;
    const shortStopDistance = Math.abs(shortStopPrice - entry);
    const shortStopPercent = (shortStopDistance / entry) * 100;

    // Calculate take profit levels (1:1, 1.5:1, 2:1, 3:1)
    const ratios = [1, 1.5, 2, 3];
    const longTakeProfits = ratios.map(ratio => {
      const price = entry + (longStopDistance * ratio);
      const profit = (price - entry) * positionSize;
      return { ratio, price, profit };
    });

    const shortTakeProfits = ratios.map(ratio => {
      const price = entry - (shortStopDistance * ratio);
      const profit = (entry - price) * positionSize;
      return { ratio, price, profit };
    });

    // Calculate breakeven (assuming 0.1% total fees)
    const feeRate = 0.001;
    const breakeven = {
      long: entry * (1 + feeRate),
      short: entry * (1 - feeRate),
    };

    setResults({
      riskAmount,
      positionSize,
      positionValue,
      longStopPrice,
      longStopDistance,
      longStopPercent,
      shortStopPrice,
      shortStopDistance,
      shortStopPercent,
      longTakeProfits,
      shortTakeProfits,
      breakeven,
    });
    setCalculated(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPrice = (value: number) => {
    if (value < 0.01) {
      return value.toFixed(8);
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Stop Loss Calculator
          </CardTitle>
          <CardDescription>
            Calculate position size, stop loss, take profits, and risk/reward ratios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {RISK_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="min-h-[48px] touch-manipulation"
                >
                  <div className="text-center w-full">
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountSize">Account Size ($)</Label>
              <Input
                id="accountSize"
                type="text"
                inputMode="decimal"
                placeholder="10000"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="min-h-[48px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskPercent">Risk per Trade (%)</Label>
              <Input
                id="riskPercent"
                type="text"
                inputMode="decimal"
                placeholder="2"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="min-h-[48px]"
              />
              {parseDecimalInput(riskPercent) && parseDecimalInput(riskPercent)! > 5 && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  High risk: Consider reducing to 1-3%
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price ($)</Label>
              <Input
                id="entryPrice"
                type="text"
                inputMode="decimal"
                placeholder="50000"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="min-h-[48px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss Price ($)</Label>
              <Input
                id="stopLoss"
                type="text"
                inputMode="decimal"
                placeholder="49000"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="min-h-[48px]"
              />
            </div>
          </div>

          <Button onClick={calculateStopLoss} className="w-full min-h-[48px] touch-manipulation">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Position
          </Button>

          {/* Results */}
          {calculated && results && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
                <TabsTrigger value="long" className="min-h-[44px]">
                  <span className="hidden sm:inline">Long Position</span>
                  <span className="sm:hidden">Long</span>
                </TabsTrigger>
                <TabsTrigger value="short" className="min-h-[44px]">
                  <span className="hidden sm:inline">Short Position</span>
                  <span className="sm:hidden">Short</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Risk Amount</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl text-destructive">
                        {formatCurrency(results.riskAmount)}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Position Size</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl break-all">
                        {results.positionSize.toFixed(6)}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Position Value</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl">
                        {formatCurrency(results.positionValue)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="long" className="space-y-4">
                <Card className="border-success">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <TrendingUp className="h-5 w-5" />
                      Long Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Stop Loss</Label>
                        <div className="text-2xl font-bold">${formatPrice(results.longStopPrice)}</div>
                        <Badge variant="destructive">
                          -{results.longStopPercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Breakeven</Label>
                        <div className="text-2xl font-bold">${formatPrice(results.breakeven.long)}</div>
                        <Badge variant="outline">
                          +{(((results.breakeven.long - parseDecimalInput(entryPrice)!) / parseDecimalInput(entryPrice)!) * 100).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Take Profit Levels
                      </Label>
                      <div className="grid gap-2">
                        {results.longTakeProfits.map((tp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {tp.ratio}:1 R:R
                              </Badge>
                              <div className="text-sm font-mono">${formatPrice(tp.price)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Profit</div>
                              <div className="font-bold text-profit">{formatCurrency(tp.profit)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="short" className="space-y-4">
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <TrendingDown className="h-5 w-5" />
                      Short Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Stop Loss</Label>
                        <div className="text-2xl font-bold">${formatPrice(results.shortStopPrice)}</div>
                        <Badge variant="destructive">
                          +{results.shortStopPercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Breakeven</Label>
                        <div className="text-2xl font-bold">${formatPrice(results.breakeven.short)}</div>
                        <Badge variant="outline">
                          -{((Math.abs(results.breakeven.short - parseDecimalInput(entryPrice)!) / parseDecimalInput(entryPrice)!) * 100).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Take Profit Levels
                      </Label>
                      <div className="grid gap-2">
                        {results.shortTakeProfits.map((tp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {tp.ratio}:1 R:R
                              </Badge>
                              <div className="text-sm font-mono">${formatPrice(tp.price)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Profit</div>
                              <div className="font-bold text-profit">{formatCurrency(tp.profit)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
