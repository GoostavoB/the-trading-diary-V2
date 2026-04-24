import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { SEO } from "@/components/SEO";
import { pageMeta } from "@/utils/seoHelpers";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlurredCurrency } from "@/components/ui/BlurredValue";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalProjection } from "@/components/goals/GoalProjection";
// GamificationSidebar temporarily disabled - XP/Level/Challenges hidden
// import { GamificationSidebar } from "@/components/gamification/GamificationSidebar";
// import { AchievementBadges } from "@/components/AchievementBadges";
import { Target, TrendingUp, Award, CheckCircle, X, Trophy, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useGoalCurrentValues } from "@/hooks/useGoalCurrentValues";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { layout, spacing, typography } from "@/styles/design-tokens";
import { SkipToContent } from "@/components/SkipToContent";

export default function Goals() {
  const { user } = useAuth();
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [showGamification, setShowGamification] = useState(false);

  const { data: goals, refetch } = useQuery({
    queryKey: ['trading-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: trades } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleDelete = async () => {
    if (!deletingGoalId) return;

    try {
      const { error } = await supabase
        .from('trading_goals')
        .delete()
        .eq('id', deletingGoalId);

      if (error) throw error;
      toast.success("Goal deleted successfully");
      refetch();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error("Failed to delete goal");
    } finally {
      setDeletingGoalId(null);
    }
  };

  const { valuesMap } = useGoalCurrentValues(goals || [], user?.id);

  // Enrich goals with real-time current_value
  const enrichedGoals = (goals || []).map(g => ({
    ...g,
    current_value: valuesMap.get(g.id) ?? g.current_value,
  }));

  const activeGoals = enrichedGoals.filter(g => (g.current_value / g.target_value) < 1);
  const completedGoals = enrichedGoals.filter(g => (g.current_value / g.target_value) >= 1);
  const overdueGoals = activeGoals.filter(g => new Date(g.deadline) < new Date());

  const stats = [
    {
      label: "Active Goals",
      value: activeGoals.length,
      icon: Target,
      color: "text-blue-600"
    },
    {
      label: "Completed",
      value: completedGoals.length,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      label: "Overdue",
      value: overdueGoals.length,
      icon: Award,
      color: "text-red-600"
    },
    {
      label: "Total Progress",
      value: activeGoals.length > 0
        ? `${(activeGoals.reduce((sum, g) => sum + (g.current_value / g.target_value * 100), 0) / activeGoals.length).toFixed(0)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  return (
    <>
      <SEO
        title={pageMeta.goals.title}
        description={pageMeta.goals.description}
        keywords={pageMeta.goals.keywords}
        canonical={pageMeta.goals.canonical}
        noindex={true}
      />
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className={layout.container}>
        <div className={spacing.section}>
          {/* Header */}
          <header className={layout.flex.between}>
            <div>
              <h1 className={`${typography.pageTitle} flex items-center gap-2`} id="goals-heading">
                <Target className="h-8 w-8" aria-hidden="true" />
                Goals & Milestones
              </h1>
              <p className={typography.pageSubtitle}>
                Set and track your trading objectives
              </p>
            </div>
            <CreateGoalDialog
              onGoalCreated={refetch}
              editingGoal={editingGoal}
              onClose={() => setEditingGoal(null)}
            />
          </header>

          {/* Stats Cards */}
          <section className={layout.grid.stats} aria-labelledby="goals-stats-heading">
            <h2 id="goals-stats-heading" className="sr-only">Goal Statistics</h2>
            {stats.map((stat, index) => (
              <PremiumCard key={index} className="p-4" role="article">
                <div className={layout.flex.between}>
                  <div>
                    <p className={typography.body}>{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} aria-hidden="true" />
                </div>
              </PremiumCard>
            ))}
          </section>

          {/* Goal Projections */}
          {activeGoals.length > 0 && trades && trades.length > 0 && (
            <GoalProjection
              goals={(goals || []) as any}
              trades={trades as any}
              onDelete={setDeletingGoalId}
            />
          )}

          {/* Goals Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedGoals.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Goals ({enrichedGoals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4" role="region" aria-labelledby="active-goals-heading">
              <h2 id="active-goals-heading" className="sr-only">Active Goals</h2>
              {activeGoals.length === 0 ? (
                <PremiumCard className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first goal to start tracking your progress
                  </p>
                  <CreateGoalDialog onGoalCreated={refetch} />
                </PremiumCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeletingGoalId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedGoals.length === 0 ? (
                <PremiumCard className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Goals Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep working towards your active goals!
                  </p>
                </PremiumCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeletingGoalId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {enrichedGoals.length === 0 ? (
                <PremiumCard className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Goals Created</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start setting goals to track your trading progress
                  </p>
                  <CreateGoalDialog onGoalCreated={refetch} />
                </PremiumCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrichedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeletingGoalId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingGoalId} onOpenChange={() => setDeletingGoalId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this goal? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Full-Screen Glassmorphic Gamification Overlay - Temporarily disabled */}
          {/* <AnimatePresence>
          {showGamification && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-xl"
                onClick={() => setShowGamification(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="fixed inset-4 md:inset-8 z-[101] overflow-hidden rounded-2xl"
              >
                <div className="p-8 space-y-8">
                  <div className="glass-strong backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
                    <AchievementBadges trades={trades as any || []} />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence> */}

          {/* Floating Action Button - Temporarily disabled */}
        </div>
      </main>
    </AppLayout>
    </>
  );
}
