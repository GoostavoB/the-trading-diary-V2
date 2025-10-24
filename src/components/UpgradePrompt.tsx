import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradePrompt({ open, onClose, feature = 'this feature' }: UpgradePromptProps) {
  const navigate = useNavigate();

  const proFeatures = [
    'Fully customizable dashboard',
    'Drag & drop widget placement',
    'Access to all advanced widgets',
    'Add widgets from Insights section',
    'Save custom layouts',
    'Priority support',
  ];

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
            Upgrade to Pro or Elite
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock {feature} and many more premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {proFeatures.map((feature, index) => (
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
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              onClick={() => {
                navigate('/pricing');
                onClose();
              }}
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
