import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlurredCurrency } from "@/components/ui/BlurredValue";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalProjection } from "@/components/goals/GoalProjection";
// GamificationSidebar temporarily disabled - XP/Level/Challenges hidden
// import { GamificationSidebar } from "@/components/gamification/GamificationSidebar";
import { AchievementBadges } from "@/components/AchievementBadges";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, X, Trophy, Star, CircleDashed } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

  const activeGoals = goals?.filter(g => (g.current_value / g.target_value) < 1) || [];
  const completedGoals = goals?.filter(g => (g.current_value / g.target_value) >= 1) || [];
  const overdueGoals = activeGoals.filter(g => new Date(g.deadline) < new Date());

  const stats = [
    {
      label: "Active Goals",
      value: activeGoals.length,
      icon: CircleDashed,
      color: "text-blue-400",
      bgColor: "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
      hoverColor: "hover:from-blue-500/15 hover:to-blue-600/10",
      iconStroke: 1.5
    },
    {
      label: "Completed",
      value: completedGoals.length,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
      hoverColor: "hover:from-emerald-500/15 hover:to-emerald-600/10",
      iconStroke: 1.5
    },
    {
      label: "Overdue",
      value: overdueGoals.length,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-gradient-to-br from-red-500/10 to-red-600/5",
      hoverColor: "hover:from-red-500/15 hover:to-red-600/10",
      iconStroke: 1.5
    },
    {
      label: "Total Progress",
      value: activeGoals.length > 0 
        ? `${(activeGoals.reduce((sum, g) => sum + (g.current_value / g.target_value * 100), 0) / activeGoals.length).toFixed(0)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-gradient-to-br from-purple-500/10 to-purple-600/5",
      hoverColor: "hover:from-purple-500/15 hover:to-purple-600/10",
      iconStroke: 1.5
    }
  ];

  return (
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
              onGoalCreated={() => {
                refetch();
                toast.success("Goal saved successfully!");
              }}
              editingGoal={editingGoal}
              onClose={() => setEditingGoal(null)}
            />
          </header>

          {/* Stats Cards */}
          <section className={layout.grid.stats} aria-labelledby="goals-stats-heading">
            <h2 id="goals-stats-heading" className="sr-only">Goal Statistics</h2>
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className={`p-6 transition-all duration-300 cursor-default ${stat.bgColor} ${stat.hoverColor} hover:scale-[1.02] border-border/50 backdrop-blur-sm`} 
                role="article"
              >
                <div className={layout.flex.between}>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} aria-hidden="true" strokeWidth={stat.iconStroke} />
                  </div>
                </div>
              </Card>
            ))}
          </section>

          {/* Goal Projections */}
        {activeGoals.length > 0 && trades && trades.length > 0 && (
          <GoalProjection 
            goals={(goals || []) as any} 
            trades={trades as any} 
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
              All Goals ({goals?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4" role="region" aria-labelledby="active-goals-heading">
            <h2 id="active-goals-heading" className="sr-only">Active Goals</h2>
            {activeGoals.length === 0 ? (
              <Card className="p-16 text-center glass">
                <div className="mx-auto w-fit p-6 rounded-2xl bg-muted/20 mb-6">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/60" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Active Goals</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first goal to start tracking your progress
                </p>
                <CreateGoalDialog onGoalCreated={refetch} />
              </Card>
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
              <Card className="p-16 text-center glass">
                <div className="mx-auto w-fit p-6 rounded-2xl bg-muted/20 mb-6">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/60" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Completed Goals Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Keep working towards your active goals!
                </p>
              </Card>
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
            {!goals || goals.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Goals Created</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start setting goals to track your trading progress
                </p>
                <CreateGoalDialog onGoalCreated={refetch} />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
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
  );
}
