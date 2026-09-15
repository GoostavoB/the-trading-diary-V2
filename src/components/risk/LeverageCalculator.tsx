import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Info, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LeverageCalculator() {
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [leverage, setLeverage] = useState<string>('10');
  const [positionSize, setPositionSize] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const account = parseFloat(accountSize);
    const lev = parseFloat(leverage);
    const position = parseFloat(positionSize);
    const entry = parseFloat(entryPrice);

    if (!account || !lev || !position || !entry) {
      return;
    }

    // Calculate position value
    const positionValue = position * entry;

    // Calculate required margin
    const requiredMargin = positionValue / lev;

    // Calculate margin percentage
    const marginPercentage = (requiredMargin / account) * 100;

    // Calculate buying power
    const totalBuyingPower = account * lev;

    // Calculate liquidation scenarios
    // Liquidation happens when loss = margin
    const liquidationPercentage = 100 / lev;
    const liquidationPriceLong = entry * (1 - liquidationPercentage / 100);
    const liquidationPriceShort = entry * (1 + liquidationPercentage / 100);

    // Risk level assessment
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (lev >= 50) riskLevel = 'extreme';
    else if (lev >= 20) riskLevel = 'high';
    else if (lev >= 10) riskLevel = 'medium';

    setResult({
      positionValue,
      requiredMargin,
      marginPercentage,
      totalBuyingPower,
      liquidationPercentage,
      liquidationPriceLong,
      liquidationPriceShort,
      riskLevel
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      case 'extreme': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskLevelBg = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success/10 border-success';
      case 'medium': return 'bg-warning/10 border-warning';
      case 'high': return 'bg-destructive/10 border-destructive';
      case 'extreme': return 'bg-destructive/20 border-destructive';
      default: return 'bg-accent';
    }
  };

  return (
    <PremiumCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Leverage Calculator</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Calculate margin requirements and liquidation levels for leveraged positions.</p>
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
                  <p>Your total available margin balance</p>
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
          <Label htmlFor="leverage">
            Leverage (x)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leverage multiplier (e.g., 10x, 20x, 50x)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="leverage"
            type="number"
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            placeholder="10"
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
                  <p>Number of units/contracts you want to trade</p>
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
                  <p>Current or planned entry price</p>
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
            placeholder="50000"
          />
        </div>
      </div>

      <Button onClick={calculate} className="w-full mb-6">
        Calculate Leverage
      </Button>

      {result && (
        <div className="space-y-4">
          <PremiumCard className={`p-4 border-2 ${getRiskLevelBg(result.riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Risk Level</span>
              {result.riskLevel === 'extreme' || result.riskLevel === 'high' ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : null}
            </div>
            <div className={`text-2xl font-bold uppercase ${getRiskLevelColor(result.riskLevel)}`}>
              {result.riskLevel}
            </div>
          </PremiumCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumCard className="p-4 bg-accent/50">
              <div className="text-xs text-muted-foreground mb-1">Position Value</div>
              <div className="text-xl font-bold">${result.positionValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">Total position size</div>
            </PremiumCard>

            <PremiumCard className="p-4 bg-accent/50">
              <div className="text-xs text-muted-foreground mb-1">Required Margin</div>
              <div className="text-xl font-bold text-primary">${result.requiredMargin.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {result.marginPercentage.toFixed(1)}% of account
              </div>
            </PremiumCard>

            <PremiumCard className="p-4 bg-accent/50">
              <div className="text-xs text-muted-foreground mb-1">Total Buying Power</div>
              <div className="text-xl font-bold">${result.totalBuyingPower.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">With {leverage}x leverage</div>
            </PremiumCard>

            <PremiumCard className="p-4 bg-accent/50">
              <div className="text-xs text-muted-foreground mb-1">Liquidation Distance</div>
              <div className="text-xl font-bold text-destructive">
                {result.liquidationPercentage.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground mt-2">Price movement to liquidation</div>
            </PremiumCard>
          </div>

          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Liquidation Prices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-success/10 rounded border border-success/50">
                <Badge variant="outline" className="bg-success/20 text-success border-success mb-2">
                  LONG
                </Badge>
                <div className="text-xs text-muted-foreground">Liquidation at:</div>
                <div className="text-lg font-bold text-destructive">
                  ${result.liquidationPriceLong.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-destructive/10 rounded border border-destructive/50">
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive mb-2">
                  SHORT
                </Badge>
                <div className="text-xs text-muted-foreground">Liquidation at:</div>
                <div className="text-lg font-bold text-destructive">
                  ${result.liquidationPriceShort.toFixed(2)}
                </div>
              </div>
            </div>
          </PremiumCard>

          {result.riskLevel === 'extreme' && (
            <PremiumCard className="p-4 bg-destructive/10 border-destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive mb-1">⚠️ Extreme Risk Warning</p>
                  <p className="text-muted-foreground">
                    Very high leverage can lead to rapid liquidation. Consider reducing leverage or position size.
                  </p>
                </div>
              </div>
            </PremiumCard>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
