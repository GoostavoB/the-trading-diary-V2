import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { analytics } from '@/utils/analytics';
import { getTierName } from '@/utils/xpEngine';

interface LockedWidgetOverlayProps {
  requiredTier: number;
  currentTier: number;
  widgetName: string;
  children: React.ReactNode;
}

export function LockedWidgetOverlay({
  requiredTier,
  currentTier,
  widgetName,
  children,
}: LockedWidgetOverlayProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const isLocked = currentTier < requiredTier;

  if (!isLocked) {
    return <>{children}</>;
  }

  const handleUnlockClick = () => {
    analytics.trackWidgetLocked(widgetName, {
      requiredTier,
      currentTier,
      tierGap: requiredTier - currentTier,
    });
    setShowUpgradePrompt(true);
  };

  return (
    <>
      <div className="relative group">
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary/50 transition-all group-hover:bg-background/90 group-hover:border-primary">
          <div className="text-center p-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{widgetName}</h3>
              <p className="text-sm text-muted-foreground">
                Unlock at <span className="font-semibold text-primary">Tier {requiredTier}</span>
              </p>
            </div>

            <Button
              onClick={handleUnlockClick}
              className="gap-2 group-hover:scale-105 transition-transform"
              variant="default"
            >
              <Sparkles className="w-4 h-4" />
              Unlock Now
            </Button>
          </div>
        </div>
      </div>

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={widgetName}
        trigger="widget_lock"
      />
    </>
  );
}
