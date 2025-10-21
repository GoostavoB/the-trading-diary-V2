import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, BarChart3, Target, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  action?: string;
  actionLabel?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Trading Diary! 🎉',
    description: 'Track, analyze, and improve your trading performance with powerful analytics and insights.',
    icon: Sparkles,
  },
  {
    id: 'upload',
    title: 'Upload Your First Trade',
    description: 'Start by adding your trades manually or import from CSV. Your data stays secure and private.',
    icon: Upload,
    action: '/upload',
    actionLabel: 'Upload Trade',
  },
  {
    id: 'analyze',
    title: 'Analyze Your Performance',
    description: 'View detailed analytics, charts, and insights to understand your trading patterns.',
    icon: BarChart3,
    action: '/analytics',
    actionLabel: 'View Analytics',
  },
  {
    id: 'goals',
    title: 'Set Your Trading Goals',
    description: 'Define targets and track your progress toward becoming a better trader.',
    icon: Target,
    action: '/dashboard',
    actionLabel: 'Set Goals',
  },
];

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Mark onboarding as complete
      if (user) {
        await supabase
          .from('user_settings')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
      }
      toast.success('Welcome aboard! Let\'s start trading! 🚀');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase
        .from('user_settings')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
    }
    onComplete();
  };

  const handleAction = () => {
    if (step.action) {
      navigate(step.action);
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 p-8 glass-strong border-2 border-primary/20">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="text-center space-y-6 animate-scale-in">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold gradient-text">{step.title}</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {step.description}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 py-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-4">
            {step.action ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNext}
                  className="min-w-[120px]"
                >
                  Skip Step
                </Button>
                <Button
                  size="lg"
                  onClick={handleAction}
                  className="min-w-[120px] gap-2"
                >
                  {step.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={handleNext}
                className="min-w-[200px] gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        {currentStep === 0 && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Pro Tip:</strong> You can customize your dashboard layout after completing this guide
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
