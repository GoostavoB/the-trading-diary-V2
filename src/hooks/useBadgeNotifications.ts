import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Trade } from '@/types/trade';
import { toast } from 'sonner';
import { Trophy, Star, Target, Flame, Award, Zap, Crown, type LucideIcon } from 'lucide-react';
import { calculateTradePnL, calculateTotalPnL } from '@/utils/pnl';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const getAchievementIcon = (achievementId: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    first_trade: Star,
    consistent_trader: Target,
    veteran_trader: Award,
    win_streak_3: Flame,
    win_streak_5: Flame,
    win_streak_10: Zap,
    profitable: Target,
    high_roller: Trophy,
    master_trader: Crown,
    accuracy_70: Target,
    beast_mode: Trophy,
  };
  return iconMap[achievementId] || Trophy;
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'text-gray-400';
    case 'rare':
      return 'text-blue-400';
    case 'epic':
      return 'text-purple-400';
    case 'legendary':
      return 'text-yellow-400';
    default:
      return 'text-primary';
  }
};

export function useBadgeNotifications(trades: Trade[]) {
  const { user } = useAuth();
  const previousAchievements = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!user || trades.length === 0) return;

    const checkAndNotifyBadges = async () => {
      // Calculate current achievements
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      const totalPnl = calculateTotalPnL(trades, { includeFees: true });
      
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
      );
      
      let maxWinStreak = 0;
      let currentWinStreak = 0;
      
      sortedTrades.forEach(trade => {
        if (calculateTradePnL(trade, { includeFees: true }) > 0) {
          currentWinStreak++;
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
          currentWinStreak = 0;
        }
      });

      const tradesByDate = trades.reduce((acc, trade) => {
        const date = new Date(trade.trade_date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(trade);
        return acc;
      }, {} as Record<string, Trade[]>);

      const beastModeDays = Object.values(tradesByDate).filter(dayTrades => {
        const wins = dayTrades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0).length;
        const dayWinRate = (wins / dayTrades.length) * 100;
        return dayWinRate > 70;
      }).length;

      const achievements: Achievement[] = [
        {
          id: 'first_trade',
          title: 'First Trade',
          description: 'Completed your first trade',
          icon: Star,
          rarity: 'common',
        },
        {
          id: 'consistent_trader',
          title: 'Consistent Trader',
          description: 'Logged 10 trades',
          icon: Target,
          rarity: 'common',
        },
        {
          id: 'veteran_trader',
          title: 'Veteran Trader',
          description: 'Logged 100 trades',
          icon: Award,
          rarity: 'rare',
        },
        {
          id: 'win_streak_3',
          title: 'Hot Streak',
          description: 'Won 3 trades in a row',
          icon: Flame,
          rarity: 'common',
        },
        {
          id: 'win_streak_5',
          title: 'On Fire',
          description: 'Won 5 trades in a row',
          icon: Flame,
          rarity: 'rare',
        },
        {
          id: 'win_streak_10',
          title: 'Unstoppable',
          description: 'Won 10 trades in a row',
          icon: Zap,
          rarity: 'epic',
        },
        {
          id: 'profitable',
          title: 'First Profit',
          description: 'Reached $100 total profit',
          icon: Target,
          rarity: 'common',
        },
        {
          id: 'high_roller',
          title: 'High Roller',
          description: 'Reached $1,000 total profit',
          icon: Trophy,
          rarity: 'rare',
        },
        {
          id: 'master_trader',
          title: 'Master Trader',
          description: 'Reached $10,000 total profit',
          icon: Crown,
          rarity: 'legendary',
        },
        {
          id: 'accuracy_70',
          title: 'Sharpshooter',
          description: 'Achieved 70% win rate with 20+ trades',
          icon: Target,
          rarity: 'rare',
        },
        {
          id: 'beast_mode',
          title: 'Beast Mode',
          description: 'Had 5 days with >70% win rate',
          icon: Trophy,
          rarity: 'epic',
        },
      ];

      // Check which badges are unlocked
      const unlockedBadges: Achievement[] = [];
      
      if (totalTrades >= 1) unlockedBadges.push(achievements.find(a => a.id === 'first_trade')!);
      if (totalTrades >= 10) unlockedBadges.push(achievements.find(a => a.id === 'consistent_trader')!);
      if (totalTrades >= 100) unlockedBadges.push(achievements.find(a => a.id === 'veteran_trader')!);
      if (maxWinStreak >= 3) unlockedBadges.push(achievements.find(a => a.id === 'win_streak_3')!);
      if (maxWinStreak >= 5) unlockedBadges.push(achievements.find(a => a.id === 'win_streak_5')!);
      if (maxWinStreak >= 10) unlockedBadges.push(achievements.find(a => a.id === 'win_streak_10')!);
      if (totalPnl >= 100) unlockedBadges.push(achievements.find(a => a.id === 'profitable')!);
      if (totalPnl >= 1000) unlockedBadges.push(achievements.find(a => a.id === 'high_roller')!);
      if (totalPnl >= 10000) unlockedBadges.push(achievements.find(a => a.id === 'master_trader')!);
      if (winRate >= 70 && totalTrades >= 20) unlockedBadges.push(achievements.find(a => a.id === 'accuracy_70')!);
      if (beastModeDays >= 5) unlockedBadges.push(achievements.find(a => a.id === 'beast_mode')!);

      // Fetch previously unlocked badges from database
      const { data: existingBadges } = await supabase
        .from('unlocked_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const existingBadgeIds = new Set(existingBadges?.map(b => b.badge_id) || []);

      // If this is the first check, just store the current state
      if (!hasInitialized.current) {
        previousAchievements.current = existingBadgeIds;
        hasInitialized.current = true;
        return;
      }

      // Check for newly unlocked badges
      for (const badge of unlockedBadges) {
        if (!existingBadgeIds.has(badge.id)) {
          // New badge unlocked! Save it and show notification
          await supabase
            .from('unlocked_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id,
              notified: true,
            });

          // Show notification with share option
          const Icon = getAchievementIcon(badge.id);
          const rarityColor = getRarityColor(badge.rarity);
          
          // 5% chance of rare animation (or if badge is legendary/epic)
          const isRareAnimation = badge.rarity === 'legendary' || badge.rarity === 'epic' || Math.random() < 0.05;
          
          if (isRareAnimation) {
            // Trigger extended celebration
            toast.success(
              `✨ RARE UNLOCK! ${badge.title} - ${badge.description}`,
              {
                duration: 8000,
                className: 'animate-pulse',
                action: {
                  label: 'Share',
                  onClick: () => shareAchievement(badge),
                },
              }
            );

            // Trigger screen shake effect
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('rare-achievement', {
                detail: { badge }
              });
              window.dispatchEvent(event);
            }
          } else {
            toast.success(
              `🎉 Achievement Unlocked: ${badge.title} - ${badge.description}`,
              {
                duration: 6000,
                action: {
                  label: 'Share',
                  onClick: () => shareAchievement(badge),
                },
              }
            );
          }

          previousAchievements.current.add(badge.id);
        }
      }
    };

    checkAndNotifyBadges();
  }, [user, trades]);
}

function shareAchievement(badge: Achievement) {
  const text = `🎉 I just unlocked the "${badge.title}" badge on The Trading Diary! ${badge.description}`;
  const url = window.location.origin;

  // Check if Web Share API is available (mobile devices)
  if (navigator.share) {
    navigator.share({
      title: 'Achievement Unlocked!',
      text: text,
      url: url,
    }).catch(() => {
      // If share fails, fall back to clipboard
      fallbackShare(text, url);
    });
  } else {
    // Desktop: offer multiple sharing options
    fallbackShare(text, url);
  }
}

function fallbackShare(text: string, url: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  // Show share options
  toast.info(
    'Share your achievement on Twitter, LinkedIn, Facebook, or copy the link!',
    {
      duration: 8000,
      action: {
        label: 'Copy Link',
        onClick: () => {
          navigator.clipboard.writeText(`${text} ${url}`);
          toast.success('Copied to clipboard!');
        },
      },
    }
  );

  // Open Twitter share in new tab
  setTimeout(() => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }, 500);
}
