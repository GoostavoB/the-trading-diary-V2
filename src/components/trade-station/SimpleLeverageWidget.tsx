import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  calculateLeverageMetrics, 
  stopPriceFromPercent, 
  stopPercentFromPrices,
  type Side 
} from '@/utils/leverageCalculations';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { WidgetProps } from '@/types/widget';

interface SimpleLeverageWidgetProps extends WidgetProps {}

export const SimpleLeverageWidget = ({ 
  id, 
  isEditMode, 
  onRemove, 
  onExpand 
}: SimpleLeverageWidgetProps) => {
  const [entryPrice, setEntryPrice] = useState('50000');
  const [stopPercent, setStopPercent] = useState('1.0');
  const [stopPrice, setStopPrice] = useState('');
  const [side, setSide] = useState<Side>('long');
  const [lastEdited, setLastEdited] = useState<'percent' | 'price'>('percent');

  useEffect(() => {
    const entry = parseFloat(entryPrice);
    if (!entry || entry <= 0) return;

    if (lastEdited === 'percent') {
      const percent = parseFloat(stopPercent);
      if (!isNaN(percent) && percent > 0) {
        const calculatedPrice = stopPriceFromPercent(entry, percent, side);
        setStopPrice(calculatedPrice.toFixed(2));
      }
    } else if (lastEdited === 'price') {
      const price = parseFloat(stopPrice);
      if (!isNaN(price) && price > 0) {
        const calculatedPercent = stopPercentFromPrices(entry, price);
        setStopPercent(calculatedPercent.toFixed(2));
      }
    }
  }, [entryPrice, stopPercent, stopPrice, side, lastEdited]);

  const handleStopPercentChange = (value: string) => {
    setStopPercent(value);
    setLastEdited('percent');
  };

  const handleStopPriceChange = (value: string) => {
    setStopPrice(value);
    setLastEdited('price');
  };

  const entry = parseFloat(entryPrice);
  const stop = parseFloat(stopPrice);
  
  const result = entry > 0 && stop > 0 
    ? calculateLeverageMetrics(entry, stop, null, side, 0.5, 100, null, 'quote')
    : null;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-state-success border-state-success/20 bg-state-success/10';
      case 'Medium': return 'text-state-warning border-state-warning/20 bg-state-warning/10';
      case 'High': return 'text-state-error border-state-error/20 bg-state-error/10';
      default: return 'text-muted-foreground border-border/20 bg-muted/10';
    }
  };

  return (
    <WidgetWrapper
      id={id}
      title="Leverage Calculator"
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Side selector - compact */}
        <div className="flex gap-1 mb-2">
          <Button
            variant={side === 'long' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSide('long')}
            className={`h-7 text-xs ${side === 'long' ? 'bg-state-success hover:bg-state-success/90' : ''}`}
          >
            Long
          </Button>
          <Button
            variant={side === 'short' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSide('short')}
            className={`h-7 text-xs ${side === 'short' ? 'bg-state-error hover:bg-state-error/90' : ''}`}
          >
            Short
          </Button>
        </div>

        {/* Input fields - compact */}
        <div className="space-y-2 mb-2">
          <div>
            <Label htmlFor="entry-price" className="text-[10px] text-muted-foreground uppercase">
              Entry Price
            </Label>
            <Input
              id="entry-price"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="50000"
              className="h-8 mt-0.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="stop-percent" className="text-[10px] text-muted-foreground uppercase">
                Stop %
              </Label>
              <Input
                id="stop-percent"
                type="number"
                step="0.1"
                value={stopPercent}
                onChange={(e) => handleStopPercentChange(e.target.value)}
                placeholder="1.0"
                className="h-8 mt-0.5"
              />
            </div>

            <div>
              <Label htmlFor="stop-price" className="text-[10px] text-muted-foreground uppercase">
                Stop Price
              </Label>
              <Input
                id="stop-price"
                type="number"
                value={stopPrice}
                onChange={(e) => handleStopPriceChange(e.target.value)}
                placeholder="49500"
                className="h-8 mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Results - compact */}
        {result && result.isValid && (
          <div className="border-t border-border/40 pt-2 space-y-1.5 mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Max Safe Leverage</span>
              <span className="text-base font-bold text-foreground">{result.Lmax}x</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Liquidation Price</span>
              <span className="text-xs font-medium text-foreground">
                ${result.pliq.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Risk Level</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRiskLevelColor(result.riskLevel)}`}>
                {result.riskLevel}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Safety Margin</span>
              <span className="text-xs font-medium text-foreground">
                {result.marginPct.toFixed(2)}%
              </span>
            </div>

            {result.warnings.length > 0 && (
              <div className="p-1.5 rounded-md bg-state-warning/10 border border-state-warning/20">
                <p className="text-[10px] text-state-warning">{result.warnings[0]}</p>
              </div>
            )}
          </div>
        )}

        {result && !result.isValid && (
          <div className="p-1.5 rounded-md bg-state-error/10 border border-state-error/20 mt-auto">
            <p className="text-[10px] text-state-error font-medium">Error</p>
            <p className="text-[10px] text-state-error mt-0.5">{result.warnings[0]}</p>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};
