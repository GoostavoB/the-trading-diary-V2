import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Side, calculateLeverageMetrics } from '@/utils/leverageCalculations';

interface QuickSimulationProps {
  entry: number;
  side: Side;
  bufferB: number;
  maxLeverageCap: number;
  onApply: (stopPct: number) => void;
}

export function QuickSimulation({ entry, side, bufferB, maxLeverageCap, onApply }: QuickSimulationProps) {
  const simulations = [1, 2, 3];

  const getSimulationData = (stopPct: number) => {
    const stopPrice = side === "long" 
      ? entry * (1 - stopPct / 100)
      : entry * (1 + stopPct / 100);
    
    const result = calculateLeverageMetrics(
      entry,
      stopPrice,
      null,
      side,
      bufferB,
      maxLeverageCap,
      null,
      "quote"
    );

    return {
      stopPrice,
      ...result,
    };
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Quick Simulation</h3>
      <div className="grid gap-3">
        {simulations.map((stopPct) => {
          const sim = getSimulationData(stopPct);
          
          return (
            <Card 
              key={stopPct}
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => onApply(stopPct)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stopPct}% Stop</span>
                  <Badge variant={
                    sim.riskLevel === "Low" ? "default" :
                    sim.riskLevel === "Medium" ? "secondary" : "destructive"
                  }>
                    {sim.riskLevel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Stop Price</div>
                    <div className="font-medium">${sim.stopPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Leverage</div>
                    <div className="font-medium">{sim.Lmax}x</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Liquidation</div>
                    <div className="font-medium">${sim.pliq.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Margin</div>
                    <div className="font-medium">{sim.marginPct.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
