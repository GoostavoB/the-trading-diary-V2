import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, TrendingUp, Trophy, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function WelcomeOnboardingModal({ isOpen, onClose, onComplete }: WelcomeOnboardingModalProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onComplete();
      onClose();
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-primary/20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Welcome, Trader.
                </h2>
                
                <p className="text-muted-foreground text-lg">
                  Ready to see what really drives your performance?
                </p>
              </div>

              {/* Visual */}
              <div className="relative h-48 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl"
                >
                  📈
                </motion.div>
                
                {/* Floating XP badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 right-4 bg-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold"
                >
                  +150 XP
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold"
                >
                  Level Up!
                </motion.div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  Let's Start
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">
                  You'll build discipline like a game.
                </h2>
                <p className="text-muted-foreground">
                  Track progress, earn rewards, unlock insights
                </p>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Upload trades</h3>
                    <p className="text-sm text-muted-foreground">
                      Every trade logged earns you XP
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Track emotions</h3>
                    <p className="text-sm text-muted-foreground">
                      Tag feelings to get deeper insights
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Unlock tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Level up to access advanced widgets
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* CTA */}
              <Button
                onClick={handleNext}
                className="w-full gap-2"
                size="lg"
              >
                Upload my first trades
                <Upload className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
