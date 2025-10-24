import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Side, SizeMode, calculateLeverageMetrics, stopPriceFromPercent } from '@/utils/leverageCalculations';
import { MiniChart } from './MiniChart';
import { RiskGauge } from './RiskGauge';
import { QuickSimulation } from './QuickSimulation';
import { useDebounce } from '@/hooks/useDebounce';

interface LeverageStopWidgetProps {
  defaultSide?: Side;
  defaultBufferB?: number;
  maxLeverageCap?: number;
  onChange?: (result: any) => void;
}

export function LeverageStopWidget({
  defaultSide = "long",
  defaultBufferB = 0.5,
  maxLeverageCap = 100,
  onChange,
}: LeverageStopWidgetProps) {
  // Input state
  const [entry, setEntry] = useState<string>("50000");
  const [stopPrice, setStopPrice] = useState<string>("49500");
  const [stopPercent, setStopPercent] = useState<string>("");
  const [desiredLeverage, setDesiredLeverage] = useState<string>("");
  const [side, setSide] = useState<Side>(defaultSide);
  const [sizeValue, setSizeValue] = useState<string>("");
  const [sizeMode, setSizeMode] = useState<SizeMode>("quote");
  const [bufferB, setBufferB] = useState<number>(defaultBufferB);
  
  // UI state
  const [explainMode, setExplainMode] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Debounce for chart updates
  const debouncedEntry = useDebounce(entry, 150);
  const debouncedStop = useDebounce(stopPrice, 150);

  const entryNum = parseFloat(entry) || 0;
  const stopNum = parseFloat(stopPrice) || 0;
  const leverageNum = desiredLeverage ? parseFloat(desiredLeverage) : null;
  const sizeNum = sizeValue ? parseFloat(sizeValue) : null;

  // Calculate metrics
  const result = calculateLeverageMetrics(
    entryNum,
    stopNum,
    leverageNum,
    side,
    bufferB,
    maxLeverageCap,
    sizeNum,
    sizeMode
  );

  // Update stop price when stop percent changes
  const handleStopPercentChange = (value: string) => {
    setStopPercent(value);
    const pct = parseFloat(value);
    if (!isNaN(pct) && entryNum > 0) {
      const newStop = stopPriceFromPercent(entryNum, pct, side);
      setStopPrice(newStop.toString());
    }
  };

  // Update stop percent when stop price changes
  const handleStopPriceChange = (value: string) => {
    setStopPrice(value);
    setStopPercent(""); // Clear percent to avoid conflicts
  };

  // Handle chart drag
  const handleChartStopChange = (newStop: number) => {
    setStopPrice(newStop.toString());
    setStopPercent("");
  };

  // Apply quick simulation
  const handleApplySimulation = (stopPct: number) => {
    setStopPercent(stopPct.toString());
    handleStopPercentChange(stopPct.toString());
    setHasCalculated(true);
  };

  // Calculate button
  const handleCalculate = () => {
    setHasCalculated(true);
  };

  // Notify parent
  useEffect(() => {
    if (hasCalculated && onChange) {
      onChange(result);
    }
  }, [result, hasCalculated, onChange]);

  const getRiskColor = () => {
    if (result.riskLevel === "Low") return "text-success";
    if (result.riskLevel === "Medium") return "text-warning";
    return "text-destructive";
  };

  const getInsights = () => {
    const insights: string[] = [];
    
    if (result.riskLevel === "High") {
      insights.push("High risk. Stop is close to liquidation.");
      insights.push("Reduce leverage or widen stop.");
    } else if (result.riskLevel === "Medium") {
      insights.push("Moderate risk level. Monitor position closely.");
    } else {
      insights.push("Healthy margin. Risk controlled.");
    }
    
    insights.push(`Liquidation at ${result.pliq.toLocaleString(undefined, { maximumFractionDigits: 2 })}. Margin to stop ${result.marginPct.toFixed(2)}%.`);
    
    if (result.Lmax < 10) {
      insights.push("Wide stop limits leverage options.");
    }
    
    return insights;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Leverage & Stop Calculator</h2>
            <p className="text-sm text-muted-foreground">Calculate safe leverage from stop distance</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="explain-mode" className="text-sm">Explain Mode</Label>
            <Switch
              id="explain-mode"
              checked={explainMode}
              onCheckedChange={setExplainMode}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Side Selector */}
              <div className="space-y-2">
                <Label>Position Side</Label>
                <div className="flex gap-2">
                  <Button
                    variant={side === "long" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSide("long")}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Long
                  </Button>
                  <Button
                    variant={side === "short" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSide("short")}
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Short
                  </Button>
                </div>
              </div>

              {/* Entry Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="entry">Entry Price</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Your planned entry price</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="entry"
                  type="number"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="50000"
                />
              </div>

              {/* Stop Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="stop-price">Stop Price</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Your stop loss price</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="stop-price"
                  type="number"
                  value={stopPrice}
                  onChange={(e) => handleStopPriceChange(e.target.value)}
                  placeholder="49500"
                />
              </div>

              {/* Stop Percent */}
              <div className="space-y-2">
                <Label htmlFor="stop-percent">Or Stop % from Entry</Label>
                <Input
                  id="stop-percent"
                  type="number"
                  value={stopPercent}
                  onChange={(e) => handleStopPercentChange(e.target.value)}
                  placeholder="1.0"
                  step="0.1"
                />
              </div>

              {/* Desired Leverage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="leverage">Desired Leverage (Optional)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Leave empty to use max safe leverage</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="leverage"
                  type="number"
                  value={desiredLeverage}
                  onChange={(e) => setDesiredLeverage(e.target.value)}
                  placeholder={`Max: ${result.Lmax}x`}
                />
              </div>

              {/* Position Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="size">Position Size (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {sizeMode === "quote" ? "USDT" : "Base"}
                    </span>
                    <Switch
                      checked={sizeMode === "base"}
                      onCheckedChange={(checked) => setSizeMode(checked ? "base" : "quote")}
                    />
                  </div>
                </div>
                <Input
                  id="size"
                  type="number"
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                  placeholder="1000"
                />
              </div>

              {/* Advanced Settings */}
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="text-sm">Advanced Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Buffer B (Safety Margin %)</Label>
                        <span className="text-sm font-medium">{bufferB.toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[bufferB]}
                        onValueChange={([value]) => setBufferB(value)}
                        min={0.3}
                        max={0.7}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Safety buffer for fees, slippage, and maintenance margin
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button 
                onClick={handleCalculate}
                className="w-full"
                disabled={!result.isValid && result.warnings.length > 0}
              >
                Calculate Leverage
              </Button>

              {result.warnings.length > 0 && (
                <div className="space-y-1">
                  {result.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-destructive">{warning}</p>
                  ))}
                  {leverageNum && leverageNum > result.Lmax && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setDesiredLeverage(result.Lmax.toString())}
                    >
                      Adjust to Max Safe ({result.Lmax}x)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Results Panel */}
          <div className="space-y-6">
            {hasCalculated && result.isValid && (
              <>
                {/* Numbers Grid */}
                <Card className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Stop Distance</div>
                      <div className="text-2xl font-bold">{result.deltaPct.toFixed(2)}%</div>
                      {explainMode && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Δ% = |{entryNum} - {stopNum}| / {entryNum} × 100
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Max Safe Leverage
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Maximum leverage before stop hits liquidation</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-2xl font-bold">{result.Lmax}x</div>
                      {explainMode && (
                        <div className="text-xs text-muted-foreground mt-1">
                          L* = {result.Lstar.toFixed(2)} → {result.Lmax}x
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Liquidation Price</div>
                      <div className="text-xl font-bold">${result.pliq.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Safety Margin</div>
                      <div className={`text-xl font-bold ${getRiskColor()}`}>
                        {result.marginPct.toFixed(2)}%
                      </div>
                    </div>
                    {result.riskValue !== undefined && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Risk Amount</div>
                        <div className="text-xl font-bold text-destructive">
                          ${result.riskValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Risk Gauge */}
                <Card className="p-6">
                  <RiskGauge
                    riskLevel={result.riskLevel}
                    leverage={leverageNum || result.Lmax}
                    marginPct={result.marginPct}
                  />
                </Card>

                {/* Mini Chart */}
                <Card className="p-6">
                  <MiniChart
                    entry={entryNum}
                    stop={stopNum}
                    liquidation={result.pliq}
                    side={side}
                    onStopChange={handleChartStopChange}
                  />
                </Card>

                {/* Insights */}
                <Card className="p-6">
                  <h3 className="text-sm font-medium mb-3">Insights</h3>
                  <ul className="space-y-2">
                    {getInsights().map((insight, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {/* Quick Simulation */}
            <Card className="p-6">
              <QuickSimulation
                entry={entryNum}
                side={side}
                bufferB={bufferB}
                maxLeverageCap={maxLeverageCap}
                onApply={handleApplySimulation}
              />
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
