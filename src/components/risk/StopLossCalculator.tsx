import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StopLossCalculator() {
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [riskPercentage, setRiskPercentage] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [positionSize, setPositionSize] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const account = parseFloat(accountSize);
    const risk = parseFloat(riskPercentage);
    const entry = parseFloat(entryPrice);
    const position = parseFloat(positionSize);

    if (!account || !risk || !entry || !position) {
      return;
    }

    // Calculate risk amount in dollars
    const riskAmount = account * (risk / 100);

    // Calculate stop loss price
    // For long: Stop Loss = Entry - (Risk Amount / Position Size)
    // For short: Stop Loss = Entry + (Risk Amount / Position Size)
    const stopLossDistanceLong = riskAmount / position;
    const stopLossPriceLong = entry - stopLossDistanceLong;
    const stopLossPercentageLong = (stopLossDistanceLong / entry) * 100;

    const stopLossDistanceShort = riskAmount / position;
    const stopLossPriceShort = entry + stopLossDistanceShort;
    const stopLossPercentageShort = (stopLossDistanceShort / entry) * 100;

    setResult({
      riskAmount,
      long: {
        stopLossPrice: stopLossPriceLong,
        stopLossDistance: stopLossDistanceLong,
        stopLossPercentage: stopLossPercentageLong
      },
      short: {
        stopLossPrice: stopLossPriceShort,
        stopLossDistance: stopLossDistanceShort,
        stopLossPercentage: stopLossPercentageShort
      }
    });
  };

  return (
    <PremiumCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Stop Loss Calculator</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Calculate where to place your stop loss based on your account size and risk tolerance.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="accountSize">
            Account Size ($)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your total trading account balance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="accountSize"
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            placeholder="10000"
          />
        </div>
        <div>
          <Label htmlFor="riskPercentage">
            Risk per Trade (%)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum % of account to risk (typically 1-2%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
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
          <Label htmlFor="entryPrice">
            Entry Price ($)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The price at which you plan to enter</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
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
          <Label htmlFor="positionSize">
            Position Size (units)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of units/shares you plan to trade</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="positionSize"
            type="number"
            step="any"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            placeholder="100"
          />
        </div>
      </div>

      <Button onClick={calculate} className="w-full mb-6">
        Calculate Stop Loss
      </Button>

      {result && (
        <div className="space-y-4">
          <PremiumCard className="p-4 bg-accent/50">
            <div className="text-sm text-muted-foreground mb-2">Risk Amount</div>
            <div className="text-2xl font-bold text-primary">
              ${result.riskAmount.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Maximum loss if stop is hit
            </div>
          </PremiumCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumCard className="p-4 border-2 border-success/50">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  LONG Position
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss Price</div>
                  <div className="text-xl font-bold">
                    ${result.long.stopLossPrice.toFixed(2)}
                  </div>
                </div>
                <div className="pt-3 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">${result.long.stopLossDistance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="font-medium">{result.long.stopLossPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="p-4 border-2 border-destructive/50">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                  SHORT Position
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss Price</div>
                  <div className="text-xl font-bold">
                    ${result.short.stopLossPrice.toFixed(2)}
                  </div>
                </div>
                <div className="pt-3 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">${result.short.stopLossDistance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="font-medium">{result.short.stopLossPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
