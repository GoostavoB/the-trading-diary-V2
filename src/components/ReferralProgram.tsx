import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Copy, CheckCircle2, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const ReferralProgram = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate referral code based on user ID
  const referralCode = user?.id ? `TTD-${user.id.slice(0, 8).toUpperCase()}` : "TTD-XXXX";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('referral.copied'), {
        description: t('referral.copiedDescription')
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('referral.copyError'));
    }
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: t('referral.shareTitle'),
        text: t('referral.shareText'),
        url: referralLink
      }).catch(() => {
        // User cancelled share
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>{t('referral.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('referral.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reward Info */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Gift className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1">{t('referral.rewardAmount')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('referral.rewardDetails')}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('referral.yourLink')}</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button
          onClick={shareReferral}
          className="w-full gap-2"
          variant="default"
        >
          <Share2 className="h-4 w-4" />
          {t('referral.shareButton')}
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-xs text-muted-foreground">{t('referral.totalReferrals')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-xs text-muted-foreground">{t('referral.uploadsEarned')}</div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          {t('referral.terms')}
        </div>
      </CardContent>
    </Card>
  );
};
