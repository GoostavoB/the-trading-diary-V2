import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  action?: {
    label: string;
    route: string;
  };
}

interface NextMissionCardProps {
  mission?: Mission;
  onDismiss?: () => void;
}

export function NextMissionCard({ mission, onDismiss }: NextMissionCardProps) {
  const navigate = useNavigate();

  // Default first-time mission
  const defaultMission: Mission = {
    id: 'first_upload',
    title: 'Upload Your First Trades',
    description: 'Upload 1-3 recent trades to start tracking your performance',
    xpReward: 150,
    progress: 0,
    total: 1,
    completed: false,
    action: {
      label: 'Upload Trades',
      route: '/upload'
    }
  };

  const currentMission = mission || defaultMission;
  const progressPercentage = (currentMission.progress / currentMission.total) * 100;

  if (currentMission.completed && onDismiss) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-5 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 hover:border-primary/40 transition-all">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {currentMission.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Target className="w-5 h-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">
                    {currentMission.completed ? 'Mission Complete!' : 'Next Mission'}
                  </h3>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    +{currentMission.xpReward} XP
                  </div>
                </div>
                
                <h4 className="font-bold text-base mb-1">
                  {currentMission.title}
                </h4>
                
                <p className="text-sm text-muted-foreground">
                  {currentMission.description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {!currentMission.completed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold">{currentMission.progress} / {currentMission.total}</span>
              </div>
              
              <Progress 
                value={progressPercentage} 
                className="h-2"
              />
            </div>
          )}

          {/* Action Button */}
          {currentMission.action && !currentMission.completed && (
            <Button
              onClick={() => navigate(currentMission.action!.route)}
              className="w-full gap-2"
              size="sm"
            >
              {currentMission.action.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {/* Completed state */}
          {currentMission.completed && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary font-semibold">
                ✨ Well done! Keep up the momentum.
              </p>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Glow effect for active missions */}
        {!currentMission.completed && (
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-lg blur-sm -z-10 opacity-50" />
        )}
      </Card>
    </motion.div>
  );
}
