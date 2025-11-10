import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useCurrency } from '@/contexts/CurrencyContext';

export const RiskCalculatorV2Widget = () => {
  const { formatAmount } = useCurrency();
  const {
    calculation,
    riskPercent,
    dailyLossPercent,
    base,
    entryPrice,
    stopPrice,
    loading,
    initialCapital,
    currentEquity,
    updateRiskPercent,
    updateBase,
    setEntryPrice,
    setStopPrice,
    setDailyLossPercent,
  } = useRiskCalculator();

  const { isLocked, overrideUntil, override } = useDailyLossLock(calculation.dailyLossLimit);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [strategy, setStrategy] = useState<'scalp' | 'day' | 'swing' | 'position'>('day');

  const handleStrategyChange = (value: 'scalp' | 'day' | 'swing' | 'position') => {
    setStrategy(value);
    // Apply recommendations based on strategy
    const recommendations = {
      scalp: 0.5,
      day: 1.0,
      swing: 2.0,
      position: 3.0,
    };
    updateRiskPercent(recommendations[value]);
  };

  const colorClass = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[calculation.colorState];

  const colorBg = {
    green: 'bg-green-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
  }[calculation.colorState];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy & Base */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select value={strategy} onValueChange={handleStrategyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scalp">Scalp</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="swing">Swing</SelectItem>
                <SelectItem value="position">Position</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Base</Label>
            <Select value={base} onValueChange={(v) => updateBase(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Initial Capital</SelectItem>
                <SelectItem value="equity">Current Equity</SelectItem>
                <SelectItem value="profit">Profit Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk per Trade */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Risk per Trade</Label>
            <div className={`flex items-center gap-2 font-mono text-sm ${colorClass}`}>
              <span className={`h-2 w-2 rounded-full ${colorBg}`} />
              {calculation.colorState.toUpperCase()}
            </div>
          </div>

          <div className="space-y-2">
            <Slider
              value={[riskPercent]}
              onValueChange={([v]) => updateRiskPercent(v)}
              min={0}
              max={20}
              step={0.1}
              disabled={isLocked && !overrideUntil}
              className="w-full"
            />
            <div className="flex items-center justify-between">
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => updateRiskPercent(parseFloat(e.target.value) || 0)}
                min={0}
                max={20}
                step={0.1}
                disabled={isLocked && !overrideUntil}
                className="w-24 text-center"
              />
              <span className="text-2xl font-bold">{formatAmount(calculation.riskPerTrade)}</span>
            </div>
          </div>
        </div>

        {/* Daily Loss Limit */}
        <div className="space-y-2">
          <Label>Daily Loss Limit</Label>
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="text-sm text-muted-foreground">
              {dailyLossPercent.toFixed(1)}% of equity
            </span>
            <span className="text-lg font-semibold">{formatAmount(calculation.dailyLossLimit)}</span>
          </div>
        </div>

        {/* Lock Toggle */}
        {isLocked && !overrideUntil && (
          <div className="rounded-md border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-600">Daily Loss Limit Hit</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You've reached your daily loss limit. Trading is paused.
            </p>
            <Button variant="outline" size="sm" onClick={override}>
              Override for 60 minutes
            </Button>
          </div>
        )}

        {overrideUntil && (
          <div className="rounded-md border border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">
                Override active until {overrideUntil.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Advanced Section */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Advanced (Position Sizing)</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entry Price</Label>
                <Input
                  type="number"
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || null)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stop Price</Label>
                <Input
                  type="number"
                  value={stopPrice || ''}
                  onChange={(e) => setStopPrice(parseFloat(e.target.value) || null)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {calculation.positionSize && calculation.exposure && (
              <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position Size:</span>
                  <span className="font-semibold">{calculation.positionSize.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exposure:</span>
                  <span className="font-semibold">{formatAmount(calculation.exposure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Leverage:</span>
                  <span className="font-semibold">{calculation.estimatedLeverage?.toFixed(2)}x</span>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
