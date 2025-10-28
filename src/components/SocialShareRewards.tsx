import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Twitter, Linkedin, Facebook, Share2, CheckCircle2, Gift, Loader2 } from "lucide-react";
import { useSocialSharing } from "@/hooks/useSocialSharing";

type Platform = 'twitter' | 'linkedin' | 'facebook';

interface SocialPlatform {
  name: Platform;
  displayName: string;
  icon: React.ReactNode;
  color: string;
  xpReward: number;
}

export const SocialShareRewards = () => {
  const { t } = useTranslation();
  const { recordShare, getShareUrl, canShare, sharesThisWeek, isLoading } = useSocialSharing();
  const [loading, setLoading] = useState<Platform | null>(null);

  const platforms: SocialPlatform[] = [
    {
      name: "twitter",
      displayName: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      color: "hover:text-[#1DA1F2]",
      xpReward: 50
    },
    {
      name: "linkedin",
      displayName: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "hover:text-[#0A66C2]",
      xpReward: 50
    },
    {
      name: "facebook",
      displayName: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "hover:text-[#1877F2]",
      xpReward: 50
    }
  ];

  const handleShare = async (platform: SocialPlatform) => {
    setLoading(platform.name);

    try {
      const shareText = t('social.shareText') || "Check out The Trading Diary - AI-powered crypto trading journal!";
      const shareUrl = window.location.origin;
      
      // Open share window
      const shareWindow = window.open(
        getShareUrl(platform.name, shareText, shareUrl),
        '_blank',
        'width=600,height=400'
      );

      // Wait for user to complete the share
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close the share window if still open
      if (shareWindow && !shareWindow.closed) {
        shareWindow.close();
      }

      // Record the share and award XP
      await recordShare(platform.name, 'general');

    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setLoading(null);
    }
  };

  const totalXPEarned = sharesThisWeek * 50;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle>{t('social.shareRewards')}</CardTitle>
        </div>
        <CardDescription>
          Share on social media and earn 50 XP per share (3 shares per week max)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Summary */}
        {totalXPEarned > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold">This Week's Rewards</span>
              </div>
              <span className="text-2xl font-bold text-primary">+{totalXPEarned} XP</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sharesThisWeek}/3 shares completed
            </p>
          </div>
        )}

        {/* Share Buttons */}
        <div className="grid gap-3">
          {platforms.map((platform) => {
            const isDisabled = !canShare || loading !== null;
            
            return (
              <Button
                key={platform.name}
                variant={!canShare ? "outline" : "default"}
                className={`w-full justify-between ${platform.color} transition-colors`}
                onClick={() => handleShare(platform)}
                disabled={isDisabled}
              >
                <div className="flex items-center gap-2">
                  {loading === platform.name ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    platform.icon
                  )}
                  <span>Share on {platform.displayName}</span>
                </div>
                {!canShare ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <span className="text-sm font-semibold">+{platform.xpReward} XP</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          <div className={canShare ? 'text-primary font-medium' : 'text-destructive'}>
            {sharesThisWeek}/3 shares this week
          </div>
          {!canShare && (
            <p className="mt-1">
              You've reached the weekly limit. Come back next week!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
