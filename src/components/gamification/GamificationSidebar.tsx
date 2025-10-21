import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Target } from 'lucide-react';
import { XPProgressBar } from './XPProgressBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Skeleton } from '@/components/ui/skeleton';

const GamificationSidebarComponent = () => {
  const { xpData, loading: xpLoading, getXPForNextLevel } = useXPSystem();
  const { challenges, loading: challengesLoading } = useDailyChallenges();

  const completedToday = challenges.filter(c => c.isCompleted).length;

  if (xpLoading || challengesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* XP Progress Card */}
      <Card className="p-4 glass-strong">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Level</p>
                <p className="text-lg font-bold text-primary">{xpData.currentLevel}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Zap className="w-6 h-6 text-primary" />
            </motion.div>
          </div>

          <XPProgressBar
            currentXP={xpData.currentXP}
            currentLevel={xpData.currentLevel}
            xpForNextLevel={getXPForNextLevel()}
            showDetails={false}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {xpData.currentXP.toLocaleString()} / {getXPForNextLevel().toLocaleString()} XP
            </span>
            <Badge variant="secondary" className="text-xs">
              {xpData.totalXPEarned.toLocaleString()} Total
            </Badge>
          </div>
        </div>
      </Card>

      {/* Daily Challenges Summary */}
      <Card className="p-4 glass-strong">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Today's Challenges</span>
          </div>
          <Badge variant={completedToday === challenges.length ? "default" : "secondary"}>
            {completedToday}/{challenges.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {challenges.slice(0, 3).map((challenge) => {
            const progress = (challenge.progress / challenge.target) * 100;
            return (
              <div key={challenge.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={challenge.isCompleted ? 'text-primary' : 'text-muted-foreground'}>
                    {challenge.title}
                  </span>
                  <span className="text-muted-foreground">
                    +{challenge.xpReward} XP
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${challenge.isCompleted ? 'bg-primary' : 'bg-primary/50'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export const GamificationSidebar = memo(GamificationSidebarComponent);
