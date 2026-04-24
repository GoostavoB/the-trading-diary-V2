import { PremiumCard } from '@/components/ui/PremiumCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';
import { LSRMiniBar } from '@/components/trade-station/LSRMiniBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Crosshair, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-0.5">
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
        {/* LSR Mini Bar */}
        <LSRMiniBar />

        <div className="space-y-3">
          <div>
            <SectionLabel icon={Crosshair} label="Risk Engine" />
            <PremiumCard glow className="p-3">
              <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
            </PremiumCard>
          </div>
          <div>
            <SectionLabel icon={Gauge} label="Leverage Calculator" />
            <PremiumCard className="p-3">
              <SimpleLeverageWidget id="tradestation-leverage-calculator" />
            </PremiumCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 200px)' }}>

      {/* ── Market Pulse Bar ─────────────────────────────────── */}
      <LSRMiniBar />

      {/* ── Main Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

        {/* Risk Calculator */}
        <div className="flex flex-col min-h-0">
          <SectionLabel icon={Crosshair} label="Risk Engine" />
          <div
            className={cn(
              "flex-1 rounded-xl overflow-hidden relative min-h-0",
              "border border-white/8 bg-card/70 backdrop-blur-xl",
              // top edge highlight
              "before:absolute before:inset-x-0 before:top-0 before:h-px",
              "before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent",
              // primary glow
              "shadow-[0_0_40px_-12px_rgba(var(--primary),0.2)]",
              "hover:shadow-[0_0_50px_-10px_rgba(var(--primary),0.3)] transition-shadow duration-500"
            )}
          >
            {/* Corner accent */}
            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none overflow-hidden rounded-tl-xl">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/10 blur-xl" />
            </div>
            <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10">
              <RiskCalculatorV2Widget id="tradestation-risk-calculator" />
            </div>
          </div>
        </div>

        {/* Leverage Calculator */}
        <div className="flex flex-col min-h-0">
          <SectionLabel icon={Gauge} label="Leverage Calculator" />
          <div
            className={cn(
              "flex-1 rounded-xl overflow-hidden relative min-h-0",
              "border border-white/8 bg-card/70 backdrop-blur-xl",
              "before:absolute before:inset-x-0 before:top-0 before:h-px",
              "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
              "hover:border-white/14 transition-colors duration-300"
            )}
          >
            <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10">
              <SimpleLeverageWidget id="tradestation-leverage-calculator" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
