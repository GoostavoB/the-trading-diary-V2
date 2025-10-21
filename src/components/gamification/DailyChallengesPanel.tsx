import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Trophy, Flame, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Challenge {
  id: string;
  type: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  isCompleted: boolean;
  icon: typeof Target;
}

interface DailyChallengesPanelProps {
  challenges: Challenge[];
  onChallengeClick?: (challenge: Challenge) => void;
}

const DailyChallengesPanelComponent = ({ challenges, onChallengeClick }: DailyChallengesPanelProps) => {
  const completedCount = challenges.filter(c => c.isCompleted).length;
  const progressPercent = (completedCount / challenges.length) * 100;

  return (
    <Card className="p-6 glass-strong">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Daily Challenges
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete challenges to earn bonus XP
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {completedCount}/{challenges.length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="space-y-3">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            const progress = Math.min((challenge.progress / challenge.target) * 100, 100);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onChallengeClick?.(challenge)}
                className={`
                  relative p-4 rounded-xl border transition-all cursor-pointer
                  ${challenge.isCompleted 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'glass-subtle hover:scale-[1.02]'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${challenge.isCompleted ? 'bg-primary/20' : 'bg-muted/30'}
                  `}>
                    {challenge.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-medium leading-none mb-1">
                          {challenge.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {challenge.description}
                        </p>
                      </div>
                      <Badge variant={challenge.isCompleted ? "default" : "secondary"} className="shrink-0">
                        +{challenge.xpReward} XP
                      </Badge>
                    </div>

                    {!challenge.isCompleted && (
                      <div className="space-y-1.5">
                        <Progress value={progress} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{challenge.progress} / {challenge.target}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    {challenge.isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 text-xs text-primary mt-2"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="font-medium">Challenge Complete!</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {challenge.isCompleted && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">New challenges coming soon!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export const DailyChallengesPanel = memo(DailyChallengesPanelComponent);
