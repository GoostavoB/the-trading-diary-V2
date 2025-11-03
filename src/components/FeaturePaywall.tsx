import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { trackUserJourney } from "@/utils/analyticsEvents";

interface FeaturePaywallProps {
  feature: string;
  requiredPlan?: 'pro' | 'elite';
  children: ReactNode;
  showUpgradeButton?: boolean;
}

export const FeaturePaywall = ({ 
  feature, 
  requiredPlan = 'pro',
  children,
  showUpgradeButton = true 
}: FeaturePaywallProps) => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isPro = subscription?.plan_type === 'pro';
  const isElite = subscription?.plan_type === 'elite';
  const hasAccess = (requiredPlan === 'pro' && (isPro || isElite)) || 
                    (requiredPlan === 'elite' && isElite);

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    trackUserJourney.paywallViewed(feature);
    trackUserJourney.upgradeClicked(`paywall_${feature}`);
    navigate('/upgrade');
  };

  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="pointer-events-none opacity-50 blur-sm select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 text-muted-foreground cursor-help">
                    <Lock className="w-8 h-8" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available for {requiredPlan === 'elite' ? 'Elite' : 'Pro'} users</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                {requiredPlan === 'elite' ? 'Elite' : 'Pro'} Feature
              </h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to {requiredPlan === 'elite' ? 'Elite' : 'Pro'} to unlock <strong>{feature}</strong>
              </p>
            </div>

            {showUpgradeButton && (
              <Button onClick={handleUpgrade} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
