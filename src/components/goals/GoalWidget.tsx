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

  const { data: projections } = useQuery({
    queryKey: ['goal-projections', goals.map(g => g.id)],
    queryFn: async () => {
      const results = await Promise.all(
        goals.map(async (goal) => {
          const { data, error } = await supabase.rpc('calculate_goal_projection' as any, {
            p_goal_id: goal.id,
            p_user_id: user!.id
          });
          
          if (error) {
            console.error('Projection error:', error);
            return { goalId: goal.id, projection: null };
          }
          
          return { goalId: goal.id, projection: data as GoalProjection };
        })
      );
      return results;
    },
    enabled: goals.length > 0,
  });

  // Compute current values based on calculation mode and timeframe
  const { data: currentValues } = useQuery({
    queryKey: ['goal-current-values', goals.map(g => ({ id: g.id, type: g.goal_type, calc: g.calculation_mode, period: g.period_type, start: g.period_start, end: g.period_end, deadline: g.deadline }))],
    queryFn: async () => {
      const results = await Promise.all(
        goals.map(async (goal) => {
          // Default: use stored current_value
          let current = goal.current_value ?? 0;

          // For Profit goals with "Use current performance", compute from trades within timeframe
          if (goal.goal_type === 'profit' && goal.calculation_mode === 'current_performance') {
            const startDate = goal.period_type === 'custom_range' && goal.period_start
              ? new Date(goal.period_start).toISOString()
              : null;
            const endDate = goal.period_type === 'custom_range' && goal.period_end
              ? new Date(goal.period_end).toISOString()
              : new Date(goal.deadline).toISOString();

            const { data, error } = await supabase.rpc('get_trading_analytics' as any, {
              user_uuid: user!.id,
              start_date: startDate,
              end_date: endDate,
            });

            if (error) {
              console.error('Current value calc error:', error);
            } else if (data) {
              current = (data as any).total_pnl ?? 0;
            }
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

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'profit':
      case 'pnl':
        return <BlurredCurrency amount={value} className="inline" />;
      case 'win_rate':
      case 'roi':
        return <BlurredPercent value={value} className="inline" />;
      case 'trades':
        return `${Math.floor(value)}`;
      case 'streak':
        return `${Math.floor(value)} days`;
      default:
        return value.toString();
    }
  };

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
          goals.map((goal) => {
          const currentRec = currentValues?.find(v => v.goalId === goal.id);
          const currentVal = currentRec?.current ?? (goal.current_value ?? 0);
          const progress = Math.min(100, (currentVal / goal.target_value) * 100);
          const projection = projections?.find(p => p.goalId === goal.id)?.projection;
          const isOnTrack = projection?.on_track ?? true;

          return (
            <div key={goal.id} className="space-y-2 p-4 rounded-lg border bg-card/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                    {projection && (
                      <span className={isOnTrack ? 'text-green-600' : 'text-destructive'}>
                        • {Math.round(projection.probability)}% likely
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isOnTrack && (
                    <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => setEditingGoal(goal)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingGoalId(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatValue(currentVal, goal.goal_type)} / {formatValue(goal.target_value, goal.goal_type)}
                </span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>

              {projection && (
                <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div>
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Daily: {formatValue(projection.daily_progress, goal.goal_type)}
                  </div>
                  <div>
                    Required: {formatValue(projection.required_daily_rate, goal.goal_type)}/day
                  </div>
                  {projection.projected_completion && (
                    <div>
                      ETA: {format(new Date(projection.projected_completion), 'MMM dd')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
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