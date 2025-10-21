import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakWarningModalProps {
  show: boolean;
  streakDays: number;
  daysLeft: number;
  hasFreezeTokens: number;
  onUseFreezeToken: () => void;
  onClose: () => void;
}

export const StreakWarningModal = ({
  show,
  streakDays,
  daysLeft,
  hasFreezeTokens,
  onUseFreezeToken,
  onClose,
}: StreakWarningModalProps) => {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-orange-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <AlertTriangle className="w-6 h-6" />
            </motion.div>
            Streak At Risk!
          </DialogTitle>
          <DialogDescription>
            Your {streakDays}-day trading streak is at risk!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🔥
            </motion.div>
            <p className="text-lg font-semibold">
              {daysLeft === 0 
                ? 'Trade today to keep your streak!' 
                : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left to maintain streak`
              }
            </p>
          </div>

          {hasFreezeTokens > 0 && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold">Streak Freeze Available</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You have {hasFreezeTokens} freeze token{hasFreezeTokens > 1 ? 's' : ''}. Use one to protect your streak for 24 hours.
              </p>
              <Button 
                onClick={onUseFreezeToken} 
                variant="default"
                className="w-full gap-2"
              >
                <Shield className="w-4 h-4" />
                Use Freeze Token
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              I'll Trade Today
            </Button>
            {hasFreezeTokens === 0 && (
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Remind Me Later
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
