import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
import { ErrorReflectionWidget } from '@/components/trade-station/ErrorReflectionWidget';
import { TradeStationRollingTarget } from '@/components/trade-station/TradeStationRollingTarget';

export function TradeStationContent() {
  return (
    <div 
      className="grid grid-cols-2 gap-4"
      style={{
        gridTemplateRows: '1fr 1fr',
        height: 'calc(100vh - 220px)',
        overflow: 'hidden',
      }}
    >
      {/* Row 1 - Left: Risk Calculator */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-4">
          <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
        </PremiumCard>
      </div>

      {/* Row 1 - Right: Leverage Calculator */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-4">
          <SimpleLeverageWidget id="tradestation-leverage-calculator" />
        </PremiumCard>
      </div>

      {/* Row 2 - Left: Error Reflection */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-4">
          <ErrorReflectionWidget id="tradestation-error-reflection" />
        </PremiumCard>
      </div>

      {/* Row 2 - Right: Rolling Target */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-4">
          <TradeStationRollingTarget />
        </PremiumCard>
      </div>
    </div>
  );
}
