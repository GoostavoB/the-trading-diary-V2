import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface PremiumFeatureLockProps {
  requiredPlan: "pro" | "elite";
  children: React.ReactNode;
  isLocked?: boolean;
  className?: string;
  blurAmount?: "sm" | "md" | "lg";
}

export const PremiumFeatureLock = ({
  requiredPlan,
  children,
  isLocked = true,
  className,
  blurAmount = "md"
}: PremiumFeatureLockProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const blurClass = {
    sm: "blur-[2px]",
    md: "blur-[4px]",
    lg: "blur-[8px]"
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred Content */}
      <div className={cn("pointer-events-none select-none", blurClass[blurAmount])}>
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {requiredPlan === "elite" ? t('premium.eliteFeature') : t('premium.proFeature')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('premium.upgradeMessage', { plan: requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1) })}
            </p>
          </div>
          <Button
            onClick={() => navigate('/pricing')}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            {t('premium.upgradeCTA')}
          </Button>
        </div>
      </div>
    </div>
  );
};
