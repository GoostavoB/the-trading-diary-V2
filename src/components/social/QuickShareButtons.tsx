import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Facebook, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useSocialSharing } from '@/hooks/useSocialSharing';
import { useState } from 'react';

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'telegram' | 'whatsapp';
type ContentType = 'trade' | 'achievement' | 'milestone' | 'general';

interface QuickShareButtonsProps {
  text: string;
  url?: string;
  contentType?: ContentType;
  contentId?: string;
  compact?: boolean;
}

const platformConfig = [
  { 
    platform: 'twitter' as Platform, 
    icon: Twitter, 
    label: 'Twitter', 
    color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]' 
  },
  { 
    platform: 'linkedin' as Platform, 
    icon: Linkedin, 
    label: 'LinkedIn', 
    color: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]' 
  },
  { 
    platform: 'facebook' as Platform, 
    icon: Facebook, 
    label: 'Facebook', 
    color: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2]' 
  },
  { 
    platform: 'telegram' as Platform, 
    icon: Send, 
    label: 'Telegram', 
    color: 'hover:bg-[#0088cc]/10 hover:text-[#0088cc]' 
  },
  { 
    platform: 'whatsapp' as Platform, 
    icon: MessageCircle, 
    label: 'WhatsApp', 
    color: 'hover:bg-[#25D366]/10 hover:text-[#25D366]' 
  },
];

export const QuickShareButtons = ({ 
  text, 
  url = window.location.href,
  contentType = 'general',
  contentId,
  compact = false
}: QuickShareButtonsProps) => {
  const { recordShare, getShareUrl, canShare, sharesThisWeek } = useSocialSharing();
  const [sharingPlatform, setSharingPlatform] = useState<Platform | null>(null);

  const handleShare = async (platform: Platform) => {
    if (!canShare) return;

    setSharingPlatform(platform);

    // Open share window
    const shareUrl = getShareUrl(platform, text, url);
    const shareWindow = window.open(shareUrl, '_blank', 'width=600,height=400');

    // Wait a bit for user to share, then record
    setTimeout(async () => {
      if (shareWindow) {
        shareWindow.close();
      }
      
      await recordShare(platform, contentType, contentId);
      setSharingPlatform(null);
    }, 3000);
  };

  return (
    <div className="space-y-2">
      <div className={`flex ${compact ? 'gap-2' : 'gap-3'} flex-wrap`}>
        {platformConfig.map(({ platform, icon: Icon, label, color }) => (
          <Button
            key={platform}
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleShare(platform)}
            disabled={!canShare || sharingPlatform !== null}
            className={`${color} transition-colors`}
          >
            {sharingPlatform === platform ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {!compact && <span className="ml-2">{label}</span>}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Earn 50 XP per share</span>
        <span className={canShare ? 'text-primary' : 'text-destructive'}>
          {sharesThisWeek}/3 shares this week
        </span>
      </div>
    </div>
  );
};
