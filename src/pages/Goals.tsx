import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalProjection } from "@/components/goals/GoalProjection";
import { GamificationSidebar } from "@/components/gamification/GamificationSidebar";
import { AchievementBadges } from "@/components/AchievementBadges";
import { Target, TrendingUp, Award, CheckCircle, Zap, X, Trophy, Star } from "lucide-react";
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
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl relative">
        {/* Main Content */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8" />
              Goals & Milestones
            </h1>
            <p className="text-muted-foreground mt-1">
              Set and track your trading objectives
            </p>
          </div>
          <CreateGoalDialog 
            onGoalCreated={refetch}
            editingGoal={editingGoal}
            onClose={() => setEditingGoal(null)}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

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

          <TabsContent value="active" className="space-y-4">
            {activeGoals.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                <p className="text-sm text-muted-foreground mb-4">
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
              <Card className="p-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Completed Goals Yet</h3>
                <p className="text-sm text-muted-foreground">
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

        {/* Full-Screen Glassmorphic Gamification Overlay */}
        <AnimatePresence>
          {showGamification && (
            <>
              {/* Backdrop with blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-xl"
                onClick={() => setShowGamification(false)}
              />
              
              {/* Floating Glass Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="fixed inset-4 md:inset-8 z-[101] overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl" />
                
                <div className="relative h-full overflow-y-auto custom-scrollbar">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Performance Overview</h2>
                          <p className="text-sm text-muted-foreground">Track your progress and achievements</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowGamification(false)}
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full hover:bg-muted/50"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-8">
                    {/* XP & Challenges Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6 glass-strong backdrop-blur-xl bg-card/40 border-border/50">
                        <GamificationSidebar />
                      </Card>

                      {/* Quick Stats */}
                      <Card className="p-6 glass-strong backdrop-blur-xl bg-card/40 border-border/50">
                        <div className="flex items-center gap-3 mb-6">
                          <Trophy className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Recent Wins</h3>
                        </div>
                        <div className="space-y-4">
                          {trades?.slice(0, 5).filter(t => (t.pnl || 0) > 0).map((trade, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <div className="flex items-center gap-3">
                                <Star className="h-4 w-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium">{trade.symbol}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(trade.trade_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                                +${Math.abs(trade.pnl || 0).toFixed(2)}
                              </Badge>
                            </div>
                          ))}
                          {(!trades || trades.filter(t => (t.pnl || 0) > 0).length === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">No winning trades yet</p>
                              <p className="text-xs">Keep trading to see your wins here!</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Achievements Section */}
                    <div className="glass-strong backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
                      <AchievementBadges trades={trades as any || []} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Lightning Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Button
            onClick={() => setShowGamification(!showGamification)}
            size="lg"
            className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-primary/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <Zap className="h-7 w-7 text-primary-foreground animate-pulse" />
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
