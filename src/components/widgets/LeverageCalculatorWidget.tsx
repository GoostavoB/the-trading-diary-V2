import { memo, useState, useMemo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LeverageCalculatorWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
}

export const LeverageCalculatorWidget = memo(({
  id,
  isEditMode,
  onRemove,
}: LeverageCalculatorWidgetProps) => {
  const { isPinned, togglePin } = usePinnedWidgets();
  const pinnedId = 'leverageCalculator' as const;

  const [entryPrice, setEntryPrice] = useState('50000');
  const [stopPercent, setStopPercent] = useState('1.0');
  const [side, setSide] = useState<'long' | 'short'>('long');

  const result = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const stopPct = parseFloat(stopPercent) || 0;
    
    if (entry <= 0 || stopPct <= 0) {
      return { maxLeverage: 0, riskLevel: 'Low', liquidationPrice: 0 };
    }

    // Safety buffer (0.5% for fees/slippage)
    const bufferB = 0.5;
    
    // Calculate max safe leverage: L* = (100 - B) / Δ%
    const maxLeverage = Math.floor((100 - bufferB) / stopPct);
    const cappedLeverage = Math.min(maxLeverage, 100);
    
    // Calculate liquidation price
    const liquidationPrice = side === 'long' 
      ? entry * (1 - 100 / cappedLeverage / 100)
      : entry * (1 + 100 / cappedLeverage / 100);

    // Calculate margin to stop
    const stopPrice = side === 'long'
      ? entry * (1 - stopPct / 100)
      : entry * (1 + stopPct / 100);
    
    const marginPct = Math.abs(((stopPrice - liquidationPrice) / entry) * 100);
    
    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High';
    if (marginPct > 1.0) riskLevel = 'Low';
    else if (marginPct > 0.5) riskLevel = 'Medium';
    else riskLevel = 'High';

    return {
      maxLeverage: cappedLeverage,
      riskLevel,
      liquidationPrice: liquidationPrice.toFixed(2),
      marginPct: marginPct.toFixed(2)
    };
  }, [entryPrice, stopPercent, side]);

  const getRiskColor = () => {
    switch (result.riskLevel) {
      case 'Low': return 'text-profit';
      case 'Medium': return 'text-warning';
      case 'High': return 'text-loss';
    }
  };

  const getRiskIcon = () => {
    switch (result.riskLevel) {
      case 'Low': return <Shield className="h-5 w-5 text-profit" />;
      case 'Medium': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'High': return <AlertTriangle className="h-5 w-5 text-loss" />;
    }
  };

  return (
    <WidgetWrapper
      id={id}
      title="Leverage Calculator"
      isEditMode={isEditMode}
      onRemove={onRemove}
      headerActions={
        !isEditMode && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
    >
      <div className="space-y-6">
        {/* Position Side Toggle */}
        <div className="flex gap-2">
          <Button
            variant={side === 'long' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setSide('long')}
            size="sm"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Long
          </Button>
          <Button
            variant={side === 'short' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setSide('short')}
            size="sm"
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Short
          </Button>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry">Entry Price</Label>
            <Input
              id="entry"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="50000"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop">Stop Loss % from Entry</Label>
            <Input
              id="stop"
              type="number"
              value={stopPercent}
              onChange={(e) => setStopPercent(e.target.value)}
              placeholder="1.0"
              step="0.1"
              className="text-lg"
            />
          </div>
        </div>

        {/* Result Display */}
        {result.maxLeverage > 0 && (
          <div className="space-y-4 pt-4 border-t">
            {/* Max Leverage - Hero Display */}
            <div className="text-center space-y-2 p-6 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground font-medium">Max Safe Leverage</p>
              <p className="text-5xl font-bold text-primary">
                {result.maxLeverage}x
              </p>
            </div>

            {/* Risk Indicator */}
            <div className={`flex items-center justify-between p-4 rounded-lg bg-muted/50`}>
              <div className="flex items-center gap-2">
                {getRiskIcon()}
                <div>
                  <p className="text-sm font-medium">Risk Level</p>
                  <p className={`text-lg font-bold ${getRiskColor()}`}>
                    {result.riskLevel}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Safety Margin</p>
                <p className={`text-sm font-semibold ${getRiskColor()}`}>
                  {result.marginPct}%
                </p>
              </div>
            </div>

            {/* Liquidation Price */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Liquidation Price</span>
              <span className="font-semibold">${result.liquidationPrice}</span>
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
});

LeverageCalculatorWidget.displayName = 'LeverageCalculatorWidget';
