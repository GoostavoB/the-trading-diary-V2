import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTierPreview } from '@/hooks/useTierPreview';
import { TierProgressCard } from '@/components/tier/TierProgressCard';
import { TierBenefitsComparison } from '@/components/tier/TierBenefitsComparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function TierPreview() {
  const navigate = useNavigate();
  const {
    tierData,
    currentTierInfo,
    nextTierInfo,
    progressToNextTier,
    xpToNextTier,
    currentXP,
    isMaxTier
  } = useTierPreview();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tier System</h1>
          <p className="text-muted-foreground">Progress through tiers and unlock powerful features</p>
        </div>
      </motion.div>

      {/* Current Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-primary" size={24} />
                  Your Progress
                </CardTitle>
                <CardDescription>
                  {isMaxTier ? 'You\'ve reached the maximum tier!' : `${xpToNextTier.toLocaleString()} XP until ${nextTierInfo?.name}`}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentXP.toLocaleString()} XP</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isMaxTier && nextTierInfo && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentTierInfo.name}</span>
                  <span>{nextTierInfo.name}</span>
                </div>
                <Progress value={progressToNextTier} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(progressToNextTier)}% Complete</span>
                  <span>{xpToNextTier.toLocaleString()} XP Remaining</span>
                </div>
              </div>
            )}
            {isMaxTier && (
              <div className="text-center py-4">
                <Zap className="mx-auto text-primary mb-2" size={32} />
                <p className="text-lg font-medium">Congratulations! You're at the Elite tier!</p>
                <p className="text-sm text-muted-foreground">Continue earning XP to maintain your status</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="overview">Tier Overview</TabsTrigger>
          <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {tierData.map((tier, index) => (
              <TierProgressCard
                key={tier.level}
                tierInfo={tier}
                currentXP={currentXP}
                isUnlocked={currentXP >= tier.xpRequired}
                isCurrent={tier.level === currentTierInfo.level}
                index={index}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center p-6 bg-muted/30 rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-2">How to Earn XP</h3>
            <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Log Trades</p>
                <p>Earn XP for every trade you log</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Daily Login</p>
                <p>Get bonus XP for consecutive days</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Achievements</p>
                <p>Complete goals for XP rewards</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <TierBenefitsComparison 
            tierData={tierData} 
            currentTier={currentTierInfo.level} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
