import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import posthog from 'posthog-js';

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'telegram' | 'whatsapp';
type ContentType = 'trade' | 'achievement' | 'milestone' | 'general';

interface ShareResult {
  success: boolean;
  message: string;
  xp_awarded: number;
  shares_this_week: number;
  new_xp?: number;
}

interface UseSocialSharingReturn {
  sharesThisWeek: number;
  canShare: boolean;
  isLoading: boolean;
  recordShare: (platform: Platform, contentType: ContentType, contentId?: string) => Promise<ShareResult>;
  getShareUrl: (platform: Platform, text: string, url: string) => string;
  refetch: () => Promise<void>;
}

export const useSocialSharing = (): UseSocialSharingReturn => {
  const [sharesThisWeek, setSharesThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchShareCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get start of current week (Monday)
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('social_share_log')
        .select('id')
        .eq('user_id', user.id)
        .gte('shared_at', weekStart.toISOString());

      if (error) throw error;

      setSharesThisWeek(data?.length || 0);
    } catch (error) {
      console.error('Error fetching share count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShareCount();
  }, []);

  const recordShare = async (
    platform: Platform,
    contentType: ContentType,
    contentId?: string
  ): Promise<ShareResult> => {
    try {
      const { data, error } = await supabase.rpc('record_social_share', {
        p_platform: platform,
        p_content_type: contentType,
        p_content_id: contentId || null
      });

      if (error) throw error;

      const result = data as unknown as ShareResult;

      if (result.success) {
        // Update local count
        setSharesThisWeek(result.shares_this_week);

        // Show success toast
        toast({
          title: "🎉 Share Successful!",
          description: `+${result.xp_awarded} XP earned! (${result.shares_this_week}/3 shares this week)`,
        });

        // Confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Track analytics
        posthog.capture('social_share_completed', {
          platform,
          content_type: contentType,
          xp_awarded: result.xp_awarded,
          shares_this_week: result.shares_this_week
        });
      } else {
        // Show limit reached toast
        toast({
          title: "Share Limit Reached",
          description: result.message,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error recording share:', error);
      toast({
        title: "Error",
        description: "Failed to record share. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        message: 'Failed to record share',
        xp_awarded: 0,
        shares_this_week: sharesThisWeek
      };
    }
  };

  const getShareUrl = (platform: Platform, text: string, url: string): string => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    const shareUrls: Record<Platform, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    };

    return shareUrls[platform];
  };

  return {
    sharesThisWeek,
    canShare: sharesThisWeek < 3,
    isLoading,
    recordShare,
    getShareUrl,
    refetch: fetchShareCount
  };
};
