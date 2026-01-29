import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
import { ErrorReflectionWidget } from '@/components/trade-station/ErrorReflectionWidget';
import { TradeStationRollingTarget } from '@/components/trade-station/TradeStationRollingTarget';
import { useIsMobile } from '@/hooks/use-mobile';

export function TradeStationContent() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3 pb-4">
        <PremiumCard className="p-3">
          <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
        </PremiumCard>
        <PremiumCard className="p-3">
          <SimpleLeverageWidget id="tradestation-leverage-calculator" />
        </PremiumCard>
        <PremiumCard className="p-3">
          <ErrorReflectionWidget id="tradestation-error-reflection" />
        </PremiumCard>
        <PremiumCard className="p-3">
          <TradeStationRollingTarget />
        </PremiumCard>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-2 gap-3"
      style={{
        gridTemplateRows: '1fr 1fr',
        height: 'calc(100vh - 220px)',
        overflow: 'hidden',
      }}
    >
      {/* Row 1 - Left: Risk Calculator */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-3">
          <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
        </PremiumCard>
      </div>

      {/* Row 1 - Right: Leverage Calculator */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-3">
          <SimpleLeverageWidget id="tradestation-leverage-calculator" />
        </PremiumCard>
      </div>

      {/* Row 2 - Left: Error Reflection */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-3">
          <ErrorReflectionWidget id="tradestation-error-reflection" />
        </PremiumCard>
      </div>

      {/* Row 2 - Right: Rolling Target */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <PremiumCard className="h-full overflow-y-auto p-3">
          <TradeStationRollingTarget />
        </PremiumCard>
      </div>
    </div>
  );
}
