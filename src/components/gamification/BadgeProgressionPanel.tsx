import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BadgeTier {
  id: string;
  badge_id: string;
  tier: string;
  requirement_multiplier: number;
  xp_reward: number;
}

interface UnlockedBadge {
  badge_id: string;
  tier: string;
  progress_to_next_tier: number;
  unlocked_at: string;
}

interface BadgeProgress {
  badgeId: string;
  name: string;
  description: string;
  currentTier: string | null;
  nextTier: string | null;
  progress: number;
  nextTierRequirement: number;
  xpReward: number;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const TIER_COLORS = {
  bronze: 'from-orange-700 to-orange-500',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-cyan-400 to-blue-500',
  diamond: 'from-purple-500 to-pink-500',
};

const BADGE_INFO: Record<string, { name: string; description: string; icon: any }> = {
  first_trade: { name: 'First Trade', description: 'Log your first trade', icon: Star },
  winning_streak: { name: 'Winning Streak', description: 'Win consecutive trades', icon: TrendingUp },
  consistency: { name: 'Consistency Master', description: 'Trade regularly', icon: Trophy },
  profit_milestone: { name: 'Profit Milestone', description: 'Reach profit goals', icon: Trophy },
};

export const BadgeProgressionPanel = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadgeProgress();
    }
  }, [user]);

  const fetchBadgeProgress = async () => {
    if (!user) return;

    try {
      // Fetch all badge tiers
      const { data: tierData } = await supabase
        .from('badge_tiers')
        .select('*')
        .order('badge_id, requirement_multiplier');

      // Fetch user's unlocked badges
      const { data: unlockedData } = await supabase
        .from('unlocked_badges')
        .select('badge_id, tier, progress_to_next_tier')
        .eq('user_id', user.id);

      if (!tierData) return;

      // Group tiers by badge
      const badgeMap = new Map<string, BadgeTier[]>();
      tierData.forEach((tier: BadgeTier) => {
        if (!badgeMap.has(tier.badge_id)) {
          badgeMap.set(tier.badge_id, []);
        }
        badgeMap.get(tier.badge_id)!.push(tier);
      });

      // Calculate progress for each badge
      const progressData: BadgeProgress[] = [];
      badgeMap.forEach((tiers, badgeId) => {
        const unlocked = unlockedData?.find((u: UnlockedBadge) => u.badge_id === badgeId);
        const currentTierIndex = unlocked 
          ? TIER_ORDER.indexOf(unlocked.tier)
          : -1;
        
        const nextTierIndex = currentTierIndex + 1;
        const nextTier = nextTierIndex < TIER_ORDER.length 
          ? tiers.find(t => t.tier === TIER_ORDER[nextTierIndex])
          : null;

        if (badgeId in BADGE_INFO) {
          progressData.push({
            badgeId,
            name: BADGE_INFO[badgeId].name,
            description: BADGE_INFO[badgeId].description,
            currentTier: unlocked?.tier || null,
            nextTier: nextTier?.tier || null,
            progress: unlocked?.progress_to_next_tier || 0,
            nextTierRequirement: nextTier?.requirement_multiplier || 100,
            xpReward: nextTier?.xp_reward || 0,
          });
        }
      });

      setBadges(progressData);
    } catch (error) {
      console.error('Error fetching badge progress:', error);
      toast.error('Failed to load badge progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 glass">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Badge Progression
      </h3>

      <div className="space-y-4">
        {badges.map((badge, index) => {
          const Icon = BADGE_INFO[badge.badgeId]?.icon || Trophy;
          const progressPercent = (badge.progress / badge.nextTierRequirement) * 100;

          return (
            <motion.div
              key={badge.badgeId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg glass-subtle border border-border/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    badge.currentTier 
                      ? TIER_COLORS[badge.currentTier as keyof typeof TIER_COLORS]
                      : 'from-muted to-muted'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
                {badge.currentTier ? (
                  <Badge variant="secondary" className="capitalize">
                    {badge.currentTier}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>

              {badge.nextTier && (
                <>
                  <Progress value={progressPercent} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {badge.progress.toFixed(0)} / {badge.nextTierRequirement}
                    </span>
                    <span className="flex items-center gap-1">
                      Next: <span className="capitalize font-medium text-primary">{badge.nextTier}</span>
                      <span className="text-primary">+{badge.xpReward} XP</span>
                    </span>
                  </div>
                </>
              )}

              {!badge.nextTier && badge.currentTier === 'diamond' && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  🏆 Maximum tier achieved!
                </p>
              )}
            </motion.div>
          );
        })}

        {badges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No badges available yet</p>
            <p className="text-xs mt-1">Start trading to unlock achievements!</p>
          </div>
        )}
      </div>
    </Card>
  );
};
