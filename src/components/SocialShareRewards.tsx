import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Twitter, Linkedin, Facebook, Share2, CheckCircle2, Gift } from "lucide-react";
import { toast } from "sonner";

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: (text: string, url: string) => string;
  reward: number;
}

export const SocialShareRewards = () => {
  const { t } = useTranslation();
  const [sharedPlatforms, setSharedPlatforms] = useState<Set<string>>(new Set());

  const platforms: SocialPlatform[] = [
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      color: "hover:text-[#1DA1F2]",
      shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      reward: 2
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "hover:text-[#0A66C2]",
      shareUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      reward: 2
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "hover:text-[#1877F2]",
      shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reward: 2
    }
  ];

  const handleShare = (platform: SocialPlatform) => {
    const shareText = t('social.shareText') || "Check out The Trading Diary - AI-powered crypto trading journal!";
    const shareUrl = window.location.origin;
    
    // Open share window
    window.open(
      platform.shareUrl(shareText, shareUrl),
      '_blank',
      'width=600,height=400'
    );

    // Mark as shared (in production, this would be tracked in the database)
    setSharedPlatforms(prev => new Set(prev).add(platform.name));

    toast.success(t('social.shareSuccess', { platform: platform.name, uploads: platform.reward }), {
      description: t('social.shareRewardDescription'),
      icon: <Gift className="h-5 w-5 text-primary" />
    });
  };

  const totalRewards = Array.from(sharedPlatforms).reduce((sum, platformName) => {
    const platform = platforms.find(p => p.name === platformName);
    return sum + (platform?.reward || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle>{t('social.shareRewards')}</CardTitle>
        </div>
        <CardDescription>
          {t('social.shareDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reward Summary */}
        {totalRewards > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t('social.earnedRewards')}</span>
              </div>
              <span className="text-2xl font-bold text-primary">+{totalRewards}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('social.uploadsEarned')}
            </p>
          </div>
        )}

        {/* Share Buttons */}
        <div className="grid gap-3">
          {platforms.map((platform) => {
            const isShared = sharedPlatforms.has(platform.name);
            
            return (
              <Button
                key={platform.name}
                variant={isShared ? "outline" : "default"}
                className={`w-full justify-between ${platform.color} transition-colors`}
                onClick={() => handleShare(platform)}
                disabled={isShared}
              >
                <div className="flex items-center gap-2">
                  {platform.icon}
                  <span>{t('social.shareOn', { platform: platform.name })}</span>
                </div>
                {isShared ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <span className="text-sm font-semibold">+{platform.reward} uploads</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          {t('social.shareLimit')}
        </div>
      </CardContent>
    </Card>
  );
};
