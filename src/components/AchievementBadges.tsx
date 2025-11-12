import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, TrendingUp, Flame, Award, Star, Zap, Crown } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface AchievementBadgesProps {
  trades: Trade[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const AchievementBadgesComponent = ({ trades }: AchievementBadgesProps) => {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const totalPnl = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    
    // Calculate streaks
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );
    
    let maxWinStreak = 0;
    let currentWinStreak = 0;
    
    sortedTrades.forEach(trade => {
      if ((trade.profit_loss || 0) > 0) {
        currentWinStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentWinStreak = 0;
      }
    });

    // Beast mode days (days with >70% win rate)
    const tradesByDate = trades.reduce((acc, trade) => {
      const date = new Date(trade.trade_date).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);

    const beastModeDays = Object.values(tradesByDate).filter(dayTrades => {
      const wins = dayTrades.filter(t => (t.profit_loss || 0) > 0).length;
      const dayWinRate = (wins / dayTrades.length) * 100;
      return dayWinRate > 70;
    }).length;

    return { totalTrades, winRate, totalPnl, maxWinStreak, beastModeDays };
  }, [trades]);

  const { totalTrades, winRate, totalPnl, maxWinStreak, beastModeDays } = stats;

  // Define achievements
  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first_trade',
      title: 'First Trade',
      description: 'Complete your first trade',
      icon: Star,
      unlocked: totalTrades >= 1,
      rarity: 'common',
    },
    {
      id: 'consistent_trader',
      title: 'Consistent Trader',
      description: 'Log 10 trades',
      icon: TrendingUp,
      unlocked: totalTrades >= 10,
      progress: totalTrades,
      maxProgress: 10,
      rarity: 'common',
    },
    {
      id: 'veteran_trader',
      title: 'Veteran Trader',
      description: 'Log 100 trades',
      icon: Award,
      unlocked: totalTrades >= 100,
      progress: totalTrades,
      maxProgress: 100,
      rarity: 'rare',
    },
    {
      id: 'win_streak_3',
      title: 'Hot Streak',
      description: 'Win 3 trades in a row',
      icon: Flame,
      unlocked: maxWinStreak >= 3,
      progress: maxWinStreak,
      maxProgress: 3,
      rarity: 'common',
    },
    {
      id: 'win_streak_5',
      title: 'On Fire',
      description: 'Win 5 trades in a row',
      icon: Flame,
      unlocked: maxWinStreak >= 5,
      progress: maxWinStreak,
      maxProgress: 5,
      rarity: 'rare',
    },
    {
      id: 'win_streak_10',
      title: 'Unstoppable',
      description: 'Win 10 trades in a row',
      icon: Zap,
      unlocked: maxWinStreak >= 10,
      progress: maxWinStreak,
      maxProgress: 10,
      rarity: 'epic',
    },
    {
      id: 'profitable',
      title: 'First Profit',
      description: 'Reach $100 total profit',
      icon: Target,
      unlocked: totalPnl >= 100,
      progress: totalPnl,
      maxProgress: 100,
      rarity: 'common',
    },
    {
      id: 'high_roller',
      title: 'High Roller',
      description: 'Reach $1,000 total profit',
      icon: Trophy,
      unlocked: totalPnl >= 1000,
      progress: totalPnl,
      maxProgress: 1000,
      rarity: 'rare',
    },
    {
      id: 'master_trader',
      title: 'Master Trader',
      description: 'Reach $10,000 total profit',
      icon: Crown,
      unlocked: totalPnl >= 10000,
      progress: totalPnl,
      maxProgress: 10000,
      rarity: 'legendary',
    },
    {
      id: 'accuracy_70',
      title: 'Sharpshooter',
      description: 'Achieve 70% win rate with 20+ trades',
      icon: Target,
      unlocked: winRate >= 70 && totalTrades >= 20,
      progress: winRate,
      maxProgress: 70,
      rarity: 'rare',
    },
    {
      id: 'beast_mode',
      title: 'Beast Mode',
      description: 'Have 5 days with >70% win rate',
      icon: Trophy,
      unlocked: beastModeDays >= 5,
      progress: beastModeDays,
      maxProgress: 5,
      rarity: 'epic',
    },
  ], [totalTrades, winRate, totalPnl, maxWinStreak, beastModeDays]);

  const unlockedCount = useMemo(() => 
    achievements.filter(a => a.unlocked).length,
    [achievements]
  );

  const getRarityStyles = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400/30 bg-gray-400/5';
      case 'rare':
        return 'border-blue-400/30 bg-blue-400/5';
      case 'epic':
        return 'border-purple-400/30 bg-purple-400/5';
      case 'legendary':
        return 'border-yellow-400/30 bg-yellow-400/5';
    }
  };

  const getRarityBadgeStyles = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'rare':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'epic':
        return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'legendary':
        return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievement Badges
          </h3>
          <Badge variant="outline" className="text-sm">
            {unlockedCount}/{achievements.length} Unlocked
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Unlock badges by reaching trading milestones
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercent = achievement.maxProgress
            ? Math.min((achievement.progress || 0) / achievement.maxProgress * 100, 100)
            : 0;

          return (
            <Card
              key={achievement.id}
              className={`p-4 transition-all duration-300 ${
                achievement.unlocked
                  ? `${getRarityStyles(achievement.rarity)} hover:scale-105`
                  : 'bg-muted/20 border-muted opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    achievement.unlocked
                      ? 'bg-primary/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${getRarityBadgeStyles(achievement.rarity)}`}
                >
                  {achievement.rarity}
                </Badge>
                {achievement.unlocked ? (
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs whitespace-nowrap">
                    <Star className="w-3 h-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  achievement.maxProgress && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {progressPercent.toFixed(0)}%
                    </span>
                  )
                )}
              </div>

              {!achievement.unlocked && achievement.maxProgress && (
                <div className="mt-3 space-y-1">
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/50 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {achievement.progress?.toFixed(0)} / {achievement.maxProgress}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

export const AchievementBadges = memo(AchievementBadgesComponent);
