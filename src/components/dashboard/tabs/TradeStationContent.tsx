import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
import { DailyLossLockStatus } from '@/components/trade-station/DailyLossLockStatus';
import { LSRMiniBar } from '@/components/trade-station/LSRMiniBar';
import { NextTradePlanCard } from '@/components/trade-station/NextTradePlanCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Crosshair, Gauge, ShieldAlert, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-0.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-[11px] font-bold tracking-widest text-muted-foreground/60 uppercase">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-white/8 to-transparent" />
    </div>
  );
}

export function TradeStationContent() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3 pb-4">
        <LSRMiniBar />
        <div>
          <SectionLabel icon={Crosshair} label="Risk Engine" />
          <PremiumCard glow className="p-3">
            <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
          </PremiumCard>
        </div>
        <div>
          <SectionLabel icon={Compass} label="Next Trade Plan" />
          <NextTradePlanCard />
        </div>
        <div>
          <SectionLabel icon={ShieldAlert} label="Daily Loss Lock" />
          <PremiumCard className="p-3">
            <DailyLossLockStatus id="tradestation-daily-loss-lock" />
          </PremiumCard>
        </div>
        <div>
          <SectionLabel icon={Gauge} label="Leverage Calculator" />
          <PremiumCard className="p-3">
            <SimpleLeverageWidget id="tradestation-leverage-calculator" />
          </PremiumCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Market Pulse Bar */}
      <LSRMiniBar />

      {/* Row 1: Next Trade Plan (hero — full width) */}
      <div>
        <SectionLabel icon={Compass} label="Next Trade Plan" />
        <NextTradePlanCard />
      </div>

      {/* Row 2: Risk Calculator + Daily Loss Lock (2-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <SectionLabel icon={Crosshair} label="Risk Engine" />
          <div
            className={cn(
              'rounded-ios-card overflow-hidden relative',
              'border border-white/8 bg-card/70 backdrop-blur-xl',
              'before:absolute before:inset-x-0 before:top-0 before:h-px',
              'before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent',
            )}
          >
            <div className="p-4">
              <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <SectionLabel icon={ShieldAlert} label="Daily Loss Lock" />
          <div
            className={cn(
              'rounded-ios-card overflow-hidden relative',
              'border border-white/8 bg-card/70 backdrop-blur-xl',
              'hover:border-white/14 transition-colors duration-300',
            )}
          >
            <div className="p-4">
              <DailyLossLockStatus id="tradestation-daily-loss-lock" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Leverage Calculator (full width) */}
      <div>
        <SectionLabel icon={Gauge} label="Leverage Calculator" />
        <div
          className={cn(
            'rounded-ios-card overflow-hidden relative',
            'border border-white/8 bg-card/70 backdrop-blur-xl',
            'hover:border-white/14 transition-colors duration-300',
          )}
        >
          <div className="p-4">
            <SimpleLeverageWidget id="tradestation-leverage-calculator" />
          </div>
        </div>
      </div>
    </div>
  );
}
