import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { usePromoStatus } from '@/hooks/usePromoStatus';
import { Badge } from '@/components/ui/badge';

interface PremiumCTACardProps {
  className?: string;
}

export const PremiumCTACard = memo(({ className }: PremiumCTACardProps) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const promoStatus = usePromoStatus();
  
  const handleUpgrade = () => {
    const pricingPath = currentLang === 'en' ? '/pricing' : `/${currentLang}/pricing`;
    navigate(pricingPath);
  };

  return (
    <GlassCard className={className} role="article" aria-labelledby="premium-cta-title">
      <div className="space-y-4 text-center p-6 md:p-8 pb-8">
        {promoStatus.isActive && (
          <Badge variant="destructive" className="mb-2 flex items-center gap-1 w-fit mx-auto animate-pulse">
            <Clock className="w-3 h-3" />
            {promoStatus.daysRemaining > 0 
              ? `Offer ends in ${promoStatus.daysRemaining}d`
              : `Ends in ${promoStatus.hoursRemaining}h`
            }
          </Badge>
        )}
        
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
          onClick={handleUpgrade}
          className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="sm"
          aria-label="Upgrade to Pro plan"
        >
          Get Started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        
        {promoStatus.isActive ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground line-through">$15/month</span>
              <span className="text-base font-bold text-primary">$12/month</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              🎉 Save 40% during launch offer
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Starting at $15/month
          </p>
        )}
      </div>
    </GlassCard>
  );
});

PremiumCTACard.displayName = 'PremiumCTACard';
