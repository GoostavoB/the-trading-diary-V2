import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Tier3PreviewModalProps {
  open: boolean;
  onClose: () => void;
  totalXP: number;
  currentTier: number;
}

export function Tier3PreviewModal({ open, onClose, totalXP, currentTier }: Tier3PreviewModalProps) {
  const navigate = useNavigate();

  const previewWidgets = [
    { name: 'AI Trade Insights', description: 'Get personalized AI recommendations', icon: Sparkles },
    { name: 'Advanced Metrics Dashboard', description: 'Deep dive into performance analytics', icon: TrendingUp },
    { name: 'Risk/Reward Heatmap', description: 'Visualize your risk patterns', icon: Lock },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            You're Halfway to Tier 3! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            At <span className="font-bold text-primary">{totalXP} XP</span>, you're 50% of the way to unlocking premium features!
          </p>

          <div className="space-y-3 mt-6">
            <p className="text-sm font-semibold text-muted-foreground">COMING AT 4,000 XP:</p>
            {previewWidgets.map((widget, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="mt-1">
                  <widget.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{widget.name}</p>
                  <p className="text-sm text-muted-foreground">{widget.description}</p>
                </div>
                <Lock className="w-4 h-4 text-muted-foreground ml-auto mt-1" />
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <Button
              className="w-full gap-2"
              onClick={onClose}
            >
              Keep Grinding! 💪
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigate('/pricing');
                onClose();
              }}
            >
              Unlock Now with Pro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
