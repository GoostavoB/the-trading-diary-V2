import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Gift, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

export const OnboardingFlow = ({ open, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const { success } = useHapticFeedback();

  // Trigger haptic feedback on step 0 (welcome)
  useEffect(() => {
    if (open && step === 0) {
      success();
    }
  }, [open, step, success]);

  const steps = [
    {
      icon: Gift,
      title: "Welcome! 🎁",
      description: "You got 5 free uploads to start your trading journey.",
      buttonText: "Let's Go"
    },
    {
      icon: ArrowRight,
      title: "Try it now",
      description: "Upload your first trade and see the magic happen.",
      buttonText: "Start Trading"
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      onComplete();
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CurrentIcon className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
                <p className="text-muted-foreground">{steps[step].description}</p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === step
                        ? 'w-8 bg-primary'
                        : i < step
                        ? 'w-2 bg-primary/50'
                        : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                {steps[step].buttonText}
                {step < steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                {step === steps.length - 1 && <Check className="ml-2 h-4 w-4" />}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
