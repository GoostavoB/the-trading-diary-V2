import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeCurrentValue } from '@/hooks/useGoalCurrentValues';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Calendar, AlertTriangle, Edit, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalProjection } from './GoalProjection';
import { toast } from 'sonner';
import { useDateRange } from '@/contexts/DateRangeContext';
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

interface GoalWidgetProps {
  includeFeesInPnL?: boolean;
  tradesOverride?: Array<{ trade_date: string | null; opened_at?: string | null; pnl?: number | null; profit_loss?: number | null; roi?: number | null; funding_fee?: number | null; trading_fee?: number | null }>;
}

export function GoalWidget({ includeFeesInPnL = true, tradesOverride }: GoalWidgetProps) {
  const { user } = useAuth();
  const { dateRange } = useDateRange();
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

  // Fetch trades for projection calculations (skipped if override supplied)
  const { data: allTrades = [] } = useQuery({
    queryKey: ['trades-for-projection', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('trade_date, opened_at, closed_at, pnl, profit_loss, roi, funding_fee, trading_fee')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('closed_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !(tradesOverride && tradesOverride.length > 0),
  });

  // Apply date range filter to trades (prefer override if provided)
  const trades = useMemo(() => {
    const source = (tradesOverride && tradesOverride.length > 0) ? tradesOverride : allTrades;
    if (!dateRange?.from || !source.length) return source;

    return source.filter(trade => {
      const tradeDate = new Date((trade as any).trade_date || (trade as any).closed_at || (trade as any).opened_at);
      const from = dateRange.from!;
      const to = dateRange.to || new Date();
      return tradeDate >= from && tradeDate <= to;
    });
  }, [allTrades, tradesOverride, dateRange]);

  // Compute current values using shared logic
  const currentValues = useMemo(() => {
    if (!goals.length || !allTrades.length) return [] as Array<{ goalId: string; current: number }>;
    return goals.map(goal => ({
      goalId: goal.id,
      current: computeCurrentValue(goal, allTrades, includeFeesInPnL),
    }));
  }, [goals, allTrades, includeFeesInPnL]);

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
      <PremiumCard className="col-span-full">
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
      </PremiumCard>
    );
  }

  if (isError) {
    return (
      <PremiumCard className="col-span-full">
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
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals
            {dateRange?.from && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filtered
              </Badge>
            )}
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
              includeFeesInPnL={includeFeesInPnL}
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
    </PremiumCard>
  );
}