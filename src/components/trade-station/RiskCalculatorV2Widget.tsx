import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Unlock } from 'lucide-react';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { WidgetProps } from '@/types/widget';

interface RiskCalculatorV2WidgetProps extends WidgetProps {}

export const RiskCalculatorV2Widget = ({ 
  id, 
  isEditMode, 
  onRemove, 
  onExpand 
}: RiskCalculatorV2WidgetProps) => {
  const { formatAmount } = useCurrency();
  const { settings, updateSetting } = useUserSettings();
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
    updateDailyLossPercent,
  } = useRiskCalculator();

  const { isLocked, overrideUntil, override } = useDailyLossLock(calculation.dailyLossLimit);

  const handleStrategyChange = async (value: 'scalp' | 'day' | 'swing' | 'position') => {
    await updateSetting('risk_strategy', value);
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
      <WidgetWrapper
        id={id}
        title="Risk Calculator"
        isEditMode={isEditMode}
        onRemove={onRemove}
        onExpand={onExpand}
      >
        <p className="text-muted-foreground">Loading...</p>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper
      id={id}
      title="Risk Calculator"
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
    >
      <div className="space-y-3">
        {/* Strategy & Base - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Strategy</Label>
            <Select value={settings.risk_strategy} onValueChange={handleStrategyChange}>
              <SelectTrigger className="h-8">
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

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Base</Label>
            <Select value={base} onValueChange={(v) => updateBase(v as any)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Initial</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="profit">Profit Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk per Trade - Compact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Risk per Trade</Label>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${colorBg}`} />
              {calculation.colorState.toUpperCase()}
            </div>
          </div>

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
            <div className="relative">
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => updateRiskPercent(parseFloat(e.target.value) || 0)}
                min={0}
                max={20}
                step={0.1}
                disabled={isLocked && !overrideUntil}
                className="w-20 h-8 text-center pr-6 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
            <span className="text-lg md:text-xl font-bold">{formatAmount(calculation.riskPerTrade)}</span>
          </div>
        </div>

        {/* Daily Loss Limit - Compact */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Daily Loss Limit</Label>
          <Slider
            value={[dailyLossPercent]}
            onValueChange={([v]) => updateDailyLossPercent(v)}
            min={0}
            max={10}
            step={0.1}
            disabled={isLocked && !overrideUntil}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <div className="relative">
              <Input
                type="number"
                value={dailyLossPercent}
                onChange={(e) => updateDailyLossPercent(parseFloat(e.target.value) || 0)}
                min={0}
                max={10}
                step={0.1}
                disabled={isLocked && !overrideUntil}
                className="w-20 h-8 text-center pr-6 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
            <span className="text-lg md:text-xl font-bold">{formatAmount(calculation.dailyLossLimit)}</span>
          </div>
        </div>

        {/* Lock Toggle - Compact */}
        {isLocked && !overrideUntil && (
          <div className="rounded-md border border-red-500 bg-red-50 p-3 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-600">Daily Limit Hit</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Trading paused until reset.
            </p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={override}>
              Override 60min
            </Button>
          </div>
        )}

        {overrideUntil && (
          <div className="rounded-md border border-amber-500 bg-amber-50 p-2 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Unlock className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs text-amber-600">
                Override until {overrideUntil.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};
