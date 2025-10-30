import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

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

  const { data: goals = [] } = useQuery({
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

  if (goals.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Set trading goals to track your progress and stay motivated
          </p>
          <button
            onClick={() => window.location.href = '/goals'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Your First Goal
          </button>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.current_value / goal.target_value) * 100);
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
                {!isOnTrack && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatValue(goal.current_value, goal.goal_type)} / {formatValue(goal.target_value, goal.goal_type)}
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
        })}
      </CardContent>
    </Card>
  );
}