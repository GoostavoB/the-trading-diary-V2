import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface MysteryRewardModalProps {
  show: boolean;
  rewardType: string;
  rewardValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation: 'normal' | 'rare' | 'epic' | 'legendary';
  onClose: () => void;
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-600',
};

const rarityEmojis = {
  common: '📦',
  rare: '✨',
  epic: '💎',
  legendary: '🏆',
};

export const MysteryRewardModal = ({
  show,
  rewardType,
  rewardValue,
  rarity,
  animation,
  onClose,
}: MysteryRewardModalProps) => {
  const [stage, setStage] = useState<'box' | 'opening' | 'reveal'>('box');

  useEffect(() => {
    if (show) {
      setStage('box');
      // Auto-progress through stages
      const timer1 = setTimeout(() => setStage('opening'), 1000);
      const timer2 = setTimeout(() => setStage('reveal'), 2500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [show]);

  const getRewardMessage = () => {
    switch (rewardType) {
      case 'xp_boost':
        return `+${rewardValue} XP!`;
      case 'freeze_token':
        return 'Streak Freeze Token!';
      case 'theme_unlock':
        return 'New Theme Unlocked!';
      case 'badge_unlock':
        return 'Instant Badge Unlock!';
      case 'profile_frame':
        return 'New Profile Frame!';
      default:
        return 'Mystery Reward!';
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-none bg-background/95 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center py-8">
          <AnimatePresence mode="wait">
            {stage === 'box' && (
              <motion.div
                key="box"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-8xl"
              >
                🎁
              </motion.div>
            )}

            {stage === 'opening' && (
              <motion.div
                key="opening"
                initial={{ scale: 1, rotate: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 10, -10, 0],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="text-8xl"
              >
                🎁
              </motion.div>
            )}

            {stage === 'reveal' && (
              <motion.div
                key="reveal"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                {animation === 'legendary' && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 blur-xl" />
                  </motion.div>
                )}

                <motion.div
                  className={`text-7xl bg-gradient-to-br ${rarityColors[rarity]} bg-clip-text text-transparent`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {rarityEmojis[rarity]}
                </motion.div>

                <div className="text-center space-y-2">
                  <motion.h2
                    className="text-2xl font-bold"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Mystery Reward!
                  </motion.h2>
                  
                  <motion.p
                    className={`text-xl font-semibold bg-gradient-to-r ${rarityColors[rarity]} bg-clip-text text-transparent`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {getRewardMessage()}
                  </motion.p>

                  <motion.p
                    className="text-sm text-muted-foreground capitalize"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {rarity} Reward
                  </motion.p>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button onClick={onClose} variant="default" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Awesome!
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
