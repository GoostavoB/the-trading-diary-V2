import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Calendar, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalProjection } from './GoalProjection';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GoalProjection {
  daily_progress: number;
  projected_completion: string | null;
  required_daily_rate: number;
  days_remaining: number;
  on_track: boolean;
  probability: number;
}

export function GoalWidget() {
  const { user } = useAuth();
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const { data: goals = [], refetch, isLoading, isError } = useQuery({
    queryKey: ['goals-widget', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_goals')
        .select('*')
        .eq('user_id', user!.id)
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch trades for projection calculations
  const { data: trades = [] } = useQuery({
    queryKey: ['trades-for-projection', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('trade_date, opened_at, pnl, profit_loss, roi')
        .eq('user_id', user!.id)
        .not('trade_date', 'is', null)
        .order('trade_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Compute current values for all goal types based on calculation mode and timeframe
  const { data: currentValues } = useQuery({
    queryKey: ['goal-current-values', goals.map(g => ({ id: g.id, type: g.goal_type, calc: g.calculation_mode, period: g.period_type, start: g.period_start, end: g.period_end, deadline: g.deadline, baseline: g.baseline_value }))],
    queryFn: async () => {
      const results = await Promise.all(
        goals.map(async (goal) => {
          let current = 0;

          // Determine date range based on calculation mode and period type
          let startDate: string | null = null;
          let endDate: string | null = null;

          if (goal.calculation_mode === 'start_from_scratch' && goal.baseline_date) {
            startDate = new Date(goal.baseline_date).toISOString();
            endDate = goal.period_type === 'custom_range' && goal.period_end
              ? new Date(goal.period_end).toISOString()
              : new Date(goal.deadline).toISOString();
          } else if (goal.calculation_mode === 'current_performance') {
            if (goal.period_type === 'custom_range') {
              startDate = goal.period_start ? new Date(goal.period_start).toISOString() : null;
              endDate = goal.period_end ? new Date(goal.period_end).toISOString() : null;
            } else {
              // all_time: no start, end at deadline
              startDate = null;
              endDate = new Date(goal.deadline).toISOString();
            }
          }

          // Fetch analytics for the timeframe
          const { data, error } = await supabase.rpc('get_trading_analytics' as any, {
            user_uuid: user!.id,
            start_date: startDate,
            end_date: endDate,
          });

          if (error) {
            console.error('Analytics error for goal', goal.id, error);
            return { goalId: goal.id, current: 0 };
          }

          const analytics = data as any;
          const totalPnl = analytics?.total_pnl ?? 0;
          const totalTrades = analytics?.total_trades ?? 0;
          const winRate = analytics?.win_rate ?? 0;

          // Calculate current value based on goal type
          switch (goal.goal_type) {
            case 'profit':
              current = totalPnl;
              break;
            case 'trades':
              current = totalTrades;
              break;
            case 'win_rate':
              current = winRate;
              break;
            case 'roi':
              const baseline = goal.baseline_value ?? 1;
              current = baseline > 0 ? (totalPnl / baseline) * 100 : 0;
              break;
            case 'capital':
              if (goal.capital_target_type === 'absolute') {
                current = (goal.baseline_value ?? 0) + totalPnl;
              } else {
                const baseCapital = goal.baseline_value ?? 1;
                current = baseCapital > 0 ? (totalPnl / baseCapital) * 100 : 0;
              }
              break;
            default:
              current = goal.current_value ?? 0;
          }

          return { goalId: goal.id, current };
        })
      );
      return results as Array<{ goalId: string; current: number }>;
    },
    enabled: goals.length > 0 && !!user,
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

  const formatValue = (value: number, type: string, capitalType?: string) => {
    if (type === 'profit' || type === 'pnl') {
      return <BlurredCurrency amount={value} className="inline" />;
    }
    if (type === 'capital') {
      if (capitalType === 'absolute') {
        return <BlurredCurrency amount={value} className="inline" />;
      } else {
        return <BlurredPercent value={value} className="inline" />;
      }
    }
    if (type === 'win_rate' || type === 'roi') {
      return <BlurredPercent value={value} className="inline" />;
    }
    if (type === 'trades') {
      return `${Math.floor(value)}`;
    }
    if (type === 'streak') {
      return `${Math.floor(value)} days`;
    }
    return value.toString();
  };

  // Transform goals for GoalProjection component
  const transformedGoals = goals.map(goal => {
    const currentValue = currentValues?.find(v => v.goalId === goal.id)?.current ?? goal.current_value ?? 0;
    return {
      id: goal.id,
      title: goal.title,
      target_value: goal.target_value,
      current_value: currentValue,
      goal_type: goal.goal_type as 'profit' | 'capital' | 'win_rate' | 'trades' | 'roi',
      period: 'all_time' as const,
      deadline: goal.deadline,
      baseline_value: goal.baseline_value,
      capital_target_type: goal.capital_target_type as 'absolute' | 'relative' | undefined,
    };
  });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load goals. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals
          </CardTitle>
          <CreateGoalDialog 
            onGoalCreated={refetch}
            editingGoal={editingGoal}
            onClose={() => setEditingGoal(null)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No Active Goals</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your trading objectives
            </p>
            <CreateGoalDialog onGoalCreated={refetch} />
          </div>
        ) : (
          <>
            <GoalProjection 
              goals={transformedGoals}
              trades={trades}
              onDelete={(goalId) => setDeletingGoalId(goalId)}
              onEdit={(goal) => setEditingGoal(goal)}
            />
          </>
        )}
      </CardContent>

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
    </Card>
  );
}