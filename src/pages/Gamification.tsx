import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { DailyChallengesPanel } from '@/components/gamification/DailyChallengesPanel';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { BadgeProgressionPanel } from '@/components/gamification/BadgeProgressionPanel';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Trophy, Zap, Target, TrendingUp, Award, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const Gamification = () => {
  const { xpData, loading: xpLoading, getXPForNextLevel, showLevelUp, setShowLevelUp } = useXPSystem();
  const { challenges, loading: challengesLoading } = useDailyChallenges();
  const [activeTab, setActiveTab] = useState('overview');

  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'Monstro';
    if (level >= 40) return 'Master Trader';
    if (level >= 30) return 'Expert Trader';
    if (level >= 20) return 'Advanced Trader';
    if (level >= 10) return 'Skilled Trader';
    return 'Novice Trader';
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 50) return 'from-yellow-500 to-orange-500';
    if (level >= 40) return 'from-purple-500 to-pink-500';
    if (level >= 30) return 'from-blue-500 to-cyan-500';
    if (level >= 20) return 'from-green-500 to-emerald-500';
    if (level >= 10) return 'from-primary to-purple-500';
    return 'from-gray-500 to-gray-600';
  };

  if (xpLoading || challengesLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <LevelUpModal 
        show={showLevelUp} 
        level={xpData.currentLevel} 
        onClose={() => setShowLevelUp(false)} 
      />
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Trading Progress</h1>
          <p className="text-muted-foreground">
            Track your journey, complete challenges, and level up your trading skills
          </p>
        </div>

        {/* Hero Card - Level & XP */}
        <Card className="p-8 glass-strong relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -z-10" />
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${getLevelBadgeColor(xpData.currentLevel)}`}
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Level</p>
                  <h2 className="text-4xl font-bold text-primary">{xpData.currentLevel}</h2>
                </div>
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="text-sm">
                  {getLevelTitle(xpData.currentLevel)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You've leveled up {xpData.levelUpCount} times
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="glass-subtle p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total XP</span>
                  </div>
                  <p className="text-2xl font-bold">{xpData.totalXPEarned.toLocaleString()}</p>
                </div>
                <div className="glass-subtle p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Next Level</span>
                  </div>
                  <p className="text-2xl font-bold">{xpData.currentLevel + 1}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-4">Level Progress</h3>
                <XPProgressBar
                  currentXP={xpData.currentXP}
                  currentLevel={xpData.currentLevel}
                  xpForNextLevel={getXPForNextLevel()}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-subtle p-3 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="text-lg font-bold">Top 10%</p>
                </div>
                <div className="glass-subtle p-3 rounded-lg">
                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Challenges</p>
                  <p className="text-lg font-bold">{challenges.filter(c => c.isCompleted).length}/{challenges.length}</p>
                </div>
                <div className="glass-subtle p-3 rounded-lg">
                  <Award className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Badges</p>
                  <p className="text-lg font-bold">12</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs for Challenges, Badges, XP History */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Daily Challenges</TabsTrigger>
            <TabsTrigger value="badges">Badge Progress</TabsTrigger>
            <TabsTrigger value="history">XP History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DailyChallengesPanel challenges={challenges} />
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <BadgeProgressionPanel />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent XP Activity</h3>
              <p className="text-muted-foreground text-sm">
                Track your recent XP gains and see how you're progressing.
              </p>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">Coming Soon...</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Gamification;
