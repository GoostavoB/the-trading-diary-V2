import { RiskCalculatorV2Widget } from './RiskCalculatorV2Widget';
import { ErrorReflectionWidget } from './ErrorReflectionWidget';
import { PreFlightWidget } from './PreFlightWidget';
import { DailyLossLockStatus } from './DailyLossLockStatus';

export const TradeStationView = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1 - Left widgets */}
        <div className="space-y-6">
          <PreFlightWidget />
          <ErrorReflectionWidget />
        </div>

        {/* Column 2 - Center (wide) */}
        <div className="space-y-6">
          <RiskCalculatorV2Widget />
        </div>

        {/* Column 3 - Right */}
        <div className="space-y-6">
          <DailyLossLockStatus />
        </div>
      </div>
    </div>
  );
};
