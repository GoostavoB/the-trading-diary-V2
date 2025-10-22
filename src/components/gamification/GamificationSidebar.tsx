import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Target, Award, Medal, Crown, Star, Flame, Sparkles, Shield } from 'lucide-react';
import { XPProgressBar } from './XPProgressBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const GamificationSidebarComponent = () => {
  const { xpData, loading: xpLoading, getXPForNextLevel } = useXPSystem();
  const { challenges, loading: challengesLoading } = useDailyChallenges();

  const { data: unlockedBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['unlocked-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('unlocked_badges')
        .select('*, badge_tiers(name, tier, icon, description)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const completedToday = challenges.filter(c => c.isCompleted).length;

  const getBadgeIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      medal: Medal,
      crown: Crown,
      star: Star,
      flame: Flame,
      sparkles: Sparkles,
      award: Award,
      shield: Shield,
    };
    return icons[iconName?.toLowerCase()] || Trophy;
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'text-amber-700';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      case 'diamond': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getChallengeTooltip = (type: string, target: number) => {
    switch (type) {
      case 'trade_count':
        return `Execute ${target} trades today. Each trade you make (win or loss) counts toward this challenge.`;
      case 'win_rate':
        return `Win ${target} consecutive trades in a row without a loss. Your streak resets if you lose a trade.`;
      case 'profit_target':
        return `Earn $${target} in total profit today. All your winning trades' profits are added together.`;
      case 'journal_entry':
        return `Write ${target} journal entry today. Document your trading thoughts, emotions, or lessons learned.`;
      case 'daily_login':
        return `Log in to your account for ${target} consecutive days. Don't miss a day to keep your streak!`;
      default:
        return 'Complete this challenge to earn XP.';
    }
  };

  if (xpLoading || challengesLoading || badgesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
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

        <TooltipProvider>
          <div className="space-y-2">
            {challenges.slice(0, 3).map((challenge) => {
              const progress = (challenge.progress / challenge.target) * 100;
              return (
                <Tooltip key={challenge.id}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
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
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs bg-background border-2 border-primary/20 shadow-xl z-[100]">
                    <p className="font-semibold mb-1 text-foreground">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{getChallengeTooltip(challenge.type, challenge.target)}</p>
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs">
                        <span className="text-primary font-medium">Progress:</span>{' '}
                        <span className="text-foreground font-semibold">{challenge.progress} / {challenge.target}</span>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </Card>

      {/* Badges Grid */}
      <Card className="p-4 glass-strong">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Your Badges</span>
          </div>
          <Badge variant="secondary">{unlockedBadges.length}</Badge>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-4 gap-3">
            {unlockedBadges.length === 0 ? (
              <div className="col-span-4 text-center py-6">
                <p className="text-xs text-muted-foreground">
                  No badges yet. Complete challenges to earn badges!
                </p>
              </div>
            ) : (
              unlockedBadges.map((badge: any) => {
                const IconComponent = getBadgeIcon(badge.badge_tiers?.icon);
                const tierColor = getTierColor(badge.badge_tiers?.tier);
                
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center justify-center p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30 cursor-pointer"
                      >
                        <IconComponent className={`w-6 h-6 ${tierColor}`} />
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs bg-background border-2 border-primary/20 shadow-xl z-[100]">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{badge.badge_tiers?.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.badge_tiers?.description}</p>
                        <Badge variant="outline" className="mt-1">{badge.badge_tiers?.tier}</Badge>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </div>
        </TooltipProvider>
      </Card>
    </div>
  );
};

export const GamificationSidebar = memo(GamificationSidebarComponent);
