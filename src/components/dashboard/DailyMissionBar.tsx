import { useUserTier } from '@/hooks/useUserTier';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown } from 'lucide-react';
import { useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { cn } from '@/lib/utils';

export function DailyMissionBar() {
  const { dailyXPEarned, dailyXPCap, tierName, tier, tierLevel, isLoading } = useUserTier();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Dev diagnostics
  console.debug('[DailyMissionBar]', {
    dailyXPEarned,
    dailyXPCap,
    tierLevel,
    tierName
  });

  if (isLoading) return null;

  const progress = dailyXPCap > 0 ? (dailyXPEarned / dailyXPCap) * 100 : 0;
  const isCapped = dailyXPEarned >= dailyXPCap;
  const isUnlimited = tierLevel === 4;

  // Color gradient based on progress (for the indicator bar)
  const getProgressColor = () => {
    if (isCapped) return 'bg-red-500';
    if (progress >= 75) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-green-500';
    return 'bg-primary';
  };

  console.debug('[DailyMissionBar] Progress calculation:', {
    progress: `${progress.toFixed(1)}%`,
    raw: `${dailyXPEarned}/${dailyXPCap}`,
    color: getProgressColor()
  });

  return (
    <>
      <div className="w-full bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              isCapped ? "text-red-500" : "text-primary"
            )} />
            <span className="font-semibold text-sm">Daily XP Progress</span>
            <span className="text-xs text-muted-foreground">({tierName})</span>
          </div>
          
          {isCapped && !isUnlimited && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradePrompt(true)}
              className="gap-2 text-xs"
            >
              <Crown className="w-3 h-3" />
              Upgrade for More
            </Button>
          )}
        </div>

        {isUnlimited ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 animate-pulse" />
            <span className="font-semibold text-amber-500">Unlimited XP</span>
          </div>
        ) : (
          <>
            <Progress 
              value={progress} 
              className="h-2 mb-2"
              indicatorClassName={getProgressColor()}
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "font-semibold",
                isCapped ? "text-red-500" : "text-muted-foreground"
              )}>
                {dailyXPEarned} / {dailyXPCap} XP
              </span>
              
              {isCapped ? (
                <span className="text-red-500 font-semibold">
                  Daily limit reached!
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {dailyXPCap - dailyXPEarned} XP remaining
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        trigger="daily_cap"
      />
    </>
  );
}
