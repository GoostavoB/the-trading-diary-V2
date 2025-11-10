import { ErrorReflectionWidget } from './ErrorReflectionWidget';
import { PreFlightWidget } from './PreFlightWidget';
import { RiskCalculatorV2Widget } from './RiskCalculatorV2Widget';
import { DailyLossLockStatus } from './DailyLossLockStatus';

interface TradeStationViewProps {
  currentEquity: number;
  initialCapital: number;
  accumulatedProfit: number;
  currentDailyPnL: number;
  dailyLossLimit: number;
}

export const TradeStationView = ({
  currentEquity,
  initialCapital,
  accumulatedProfit,
  currentDailyPnL,
  dailyLossLimit,
}: TradeStationViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Rail - Sticky and narrow */}
      <div className="lg:col-span-1 space-y-6">
        <PreFlightWidget />
        <ErrorReflectionWidget />
        <DailyLossLockStatus 
          currentDailyPnL={currentDailyPnL}
          dailyLossLimit={dailyLossLimit}
        />
      </div>

      {/* Center - Wide */}
      <div className="lg:col-span-2 space-y-6">
        <RiskCalculatorV2Widget
          currentEquity={currentEquity}
          initialCapital={initialCapital}
          accumulatedProfit={accumulatedProfit}
        />
        
        {/* Placeholder for future widgets */}
        <div className="text-center text-muted-foreground text-sm py-8">
          Market Snapshot, Leverage Calculator, and other widgets coming soon...
        </div>
      </div>
    </div>
  );
};
