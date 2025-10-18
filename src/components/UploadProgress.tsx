import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Upload, Search, Database, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  step: 1 | 2 | 3 | 4;
  processingMessage?: string;
}

const STEPS = [
  { id: 1, label: 'Uploading your trade...', icon: Upload, progress: 25 },
  { id: 2, label: 'Extracting data...', icon: Search, progress: 50 },
  { id: 3, label: 'Checking for duplicates...', icon: Database, progress: 75 },
  { id: 4, label: 'Saving to database...', icon: Database, progress: 100 },
];

const THINKING_PHRASES = [
  "Analyzing your screenshot...",
  "Reading trade details...",
  "Processing numbers...",
  "Almost there...",
  "Finalizing data...",
];

export function UploadProgress({ step, processingMessage }: UploadProgressProps) {
  const currentStep = STEPS.find(s => s.id === step);
  const StepIcon = currentStep?.icon || Upload;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-6 p-6 rounded-lg bg-card border border-border"
    >
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={currentStep?.progress || 0} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {step} of 4</span>
          <span className="text-muted-foreground">{currentStep?.progress}%</span>
        </div>
      </div>

      {/* Current Step */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-full bg-accent/10">
          <StepIcon className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{currentStep?.label}</h3>
          {processingMessage && (
            <motion.p
              key={processingMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {processingMessage}
            </motion.p>
          )}
        </div>
        {step < 4 ? (
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-neon-green" />
        )}
      </motion.div>

      {/* All Steps Overview */}
      <div className="space-y-2 pt-4 border-t border-border">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isCompleted = s.id < step;
          const isCurrent = s.id === step;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 text-sm ${
                isCompleted ? 'text-muted-foreground' : isCurrent ? 'text-foreground' : 'text-muted-foreground/50'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{s.label.replace('...', '')}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function getRandomThinkingPhrase() {
  return THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
}
