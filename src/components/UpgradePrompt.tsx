import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePromoStatus } from '@/hooks/usePromoStatus';
import { Badge } from '@/components/ui/badge';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  trigger?: 'daily_cap' | 'widget_lock' | 'upload_limit';
}

export function UpgradePrompt({ open, onClose, feature = 'this feature', trigger = 'widget_lock' }: UpgradePromptProps) {
  const navigate = useNavigate();
  const promoStatus = usePromoStatus();

  const getContent = () => {
    switch (trigger) {
      case 'daily_cap':
        return {
          title: 'Daily XP Limit Reached!',
          description: "You've earned your maximum XP for today",
          features: [
            'Free: 750 XP per day',
            'Pro: 1,500 XP per day (2x more)',
            'Elite: Unlimited XP earning',
            'Keep your progress momentum',
            'Unlock faster tier progression',
            'Priority support',
          ]
        };
      case 'upload_limit':
        return {
          title: 'Upload Limit Reached',
          description: 'Upgrade to upload more trades today',
          features: [
            'Free: 1 upload per day',
            'Pro: 5 uploads per day',
            'Elite: 20 uploads per day',
            'Bulk CSV import',
            'Advanced trade analysis',
            'Priority support',
          ]
        };
      default:
        return {
          title: 'Upgrade to Pro or Elite',
          description: `Unlock ${feature} and many more premium features`,
          features: [
            'Fully customizable dashboard',
            'Drag & drop widget placement',
            'Access to all advanced widgets',
            'Add widgets from Insights section',
            'Save custom layouts',
            'Priority support',
          ]
        };
    }
  };

  const content = getContent();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {promoStatus.isActive && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Limited Time Offer
                </Badge>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {promoStatus.daysRemaining > 0 
                    ? `${promoStatus.daysRemaining} days remaining`
                    : `${promoStatus.hoursRemaining} hours remaining`
                  }
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold line-through text-muted-foreground">$15</span>
                <span className="text-3xl font-bold text-primary">$12</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                🎉 Save 40% during launch offer
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="p-1 rounded-full bg-primary/10">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-primary-foreground"
              onClick={() => {
                navigate('/pricing');
                onClose();
              }}
              aria-label="View pricing plans to upgrade account"
            >
              <Sparkles className="w-4 h-4" />
              View Pricing Plans
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
