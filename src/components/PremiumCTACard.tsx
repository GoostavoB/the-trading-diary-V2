import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface PremiumCTACardProps {
  className?: string;
}

export const PremiumCTACard = memo(({ className }: PremiumCTACardProps) => {
  return (
    <GlassCard className={className} role="article" aria-labelledby="premium-cta-title">
      <div className="space-y-4 text-center">
        <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 id="premium-cta-title" className="text-lg font-semibold">Upgrade to Pro</h3>
          <p className="text-sm text-muted-foreground">
            Unlock advanced analytics, AI insights, and unlimited trade history
          </p>
        </div>
        
        <Button 
          className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="sm"
          aria-label="Upgrade to Pro plan"
        >
          Get Started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Starting at $9.99/month
        </p>
      </div>
    </GlassCard>
  );
});

PremiumCTACard.displayName = 'PremiumCTACard';
