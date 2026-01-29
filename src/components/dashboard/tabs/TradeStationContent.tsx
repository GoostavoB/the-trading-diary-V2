import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
import { useIsMobile } from '@/hooks/use-mobile';

export function TradeStationContent() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3 pb-4">
        <PremiumCard className="p-4">
          <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
        </PremiumCard>
        <PremiumCard className="p-4">
          <SimpleLeverageWidget id="tradestation-leverage-calculator" />
        </PremiumCard>
      </div>
    );
  }

  // Desktop: Two widgets side by side, full height, no scrolling
  return (
    <div 
      className="grid grid-cols-2 gap-4"
      style={{
        height: 'calc(100vh - 220px)',
        overflow: 'hidden',
      }}
    >
      {/* Left: Risk Calculator */}
      <PremiumCard className="h-full p-5 flex flex-col">
        <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
      </PremiumCard>

      {/* Right: Leverage Calculator */}
      <PremiumCard className="h-full p-5 flex flex-col">
        <SimpleLeverageWidget id="tradestation-leverage-calculator" />
      </PremiumCard>
    </div>
  );
}

