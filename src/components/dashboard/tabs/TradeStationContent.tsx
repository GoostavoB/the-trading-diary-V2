import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
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
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-2 gap-3"
      style={{ height: 'calc(100vh - 220px)' }}
    >
      <PremiumCard className="h-full p-3 flex flex-col overflow-y-auto">
        <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
      </PremiumCard>

      <PremiumCard className="h-full p-3 flex flex-col overflow-y-auto">
        <SimpleLeverageWidget id="tradestation-leverage-calculator" />
      </PremiumCard>
    </div>
  );
}
