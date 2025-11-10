import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRiskCalculator, Strategy, BaseType, RiskProfile } from '@/hooks/useRiskCalculator';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface RiskCalculatorV2WidgetProps {
  currentEquity: number;
  initialCapital: number;
  accumulatedProfit: number;
}

export const RiskCalculatorV2Widget = ({
  currentEquity,
  initialCapital,
  accumulatedProfit,
}: RiskCalculatorV2WidgetProps) => {
  const {
    settings,
    strategy,
    baseType,
    entryPrice,
    stopPrice,
    calculation,
    setStrategy,
    setBaseType,
    setEntryPrice,
    setStopPrice,
    applyRecommendations,
    updateSettings,
    formatCurrency,
  } = useRiskCalculator(currentEquity, initialCapital, accumulatedProfit);

  const colorClasses = {
    green: 'text-green-600 bg-green-500/10',
    yellow: 'text-yellow-600 bg-yellow-500/10',
    red: 'text-red-600 bg-red-500/10',
  };

  const handleRiskChange = (value: number[]) => {
    const newRisk = value[0];
    const key = `risk_${strategy}_pct` as keyof typeof settings;
    updateSettings({ [key]: newRisk });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Risk per Trade v2</h3>
        </div>
      </div>

      {/* Risk Profile Selection */}
      <div className="mb-4">
        <Label className="text-sm mb-2">Risk Profile</Label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as RiskProfile[]).map((profile) => (
            <Button
              key={profile}
              size="sm"
              variant={settings.risk_profile === profile ? 'default' : 'outline'}
              onClick={() => updateSettings({ risk_profile: profile })}
              className="flex-1 capitalize"
            >
              {profile}
            </Button>
          ))}
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="mb-4">
        <Label className="text-sm">Strategy</Label>
        <Select value={strategy} onValueChange={(value) => setStrategy(value as Strategy)}>
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

      {/* Base Capital Selection */}
      <div className="mb-4">
        <Label className="text-sm">Base on</Label>
        <Select value={baseType} onValueChange={(value) => setBaseType(value as BaseType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="initial">Initial Capital</SelectItem>
            <SelectItem value="current">Current Equity</SelectItem>
            <SelectItem value="profit">Accumulated Profit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Risk Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Risk %</Label>
          <span className={`text-sm font-medium px-2 py-1 rounded ${colorClasses[calculation.color]}`}>
            {formatCurrency(calculation.riskPerTrade)}
          </span>
        </div>
        <Slider
          value={[settings[`risk_${strategy}_pct` as keyof typeof settings] as number]}
          onValueChange={handleRiskChange}
          min={0.1}
          max={5}
          step={0.1}
          className="mb-1"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.1%</span>
          <span>5.0%</span>
        </div>
      </div>

      {/* Risk State Indicator */}
      <div className={`p-3 rounded mb-4 ${colorClasses[calculation.color]}`}>
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium text-sm">
            {calculation.percentOfCeiling.toFixed(0)}% of recommended ceiling
          </span>
        </div>
        <div className="text-xs opacity-80">
          Ceiling: {formatCurrency(calculation.recommendedCeiling)}
        </div>
      </div>

      {/* Daily Loss Limit */}
      <div className="mb-4 p-3 bg-muted/50 rounded">
        <div className="text-sm font-medium mb-1">Daily Loss Limit</div>
        <div className="text-lg font-bold">{formatCurrency(calculation.dailyLossLimit)}</div>
        <div className="text-xs text-muted-foreground">
          {settings.risk_daily_loss_pct}% of current equity
        </div>
      </div>

      {/* Position Sizing (Optional) */}
      <div className="mb-4 space-y-2">
        <Label className="text-sm">Position Sizing (Optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Entry"
            value={entryPrice || ''}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || null)}
          />
          <Input
            type="number"
            placeholder="Stop"
            value={stopPrice || ''}
            onChange={(e) => setStopPrice(parseFloat(e.target.value) || null)}
          />
        </div>
      </div>

      {/* Position Details */}
      {calculation.positionSize && (
        <div className="mb-4 p-3 bg-primary/5 rounded space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Position Size:</span>
            <span className="font-medium">{calculation.positionSize.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exposure:</span>
            <span className="font-medium">{formatCurrency(calculation.exposure!)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Leverage:</span>
            <span className="font-medium">{calculation.estimatedLeverage!.toFixed(2)}x</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button onClick={applyRecommendations} variant="outline" className="w-full" size="sm">
          Apply Recommendations
        </Button>
      </div>
    </Card>
  );
};
