import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinButton } from './PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Goal {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  deadline: string;
}

export function PersonalGoalsWidget() {
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const { user } = useAuth();
  const { isPinned, togglePin } = usePinnedWidgets();
  const widgetId = 'goals' as const;

  const fetchActiveGoal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trading_goals')
        .select('id, title, current_value, target_value, deadline')
        .eq('user_id', user.id)
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveGoal(data);
    } catch (error) {
      console.error('Error fetching goal:', error);
    }
  };

  useEffect(() => {
    fetchActiveGoal();
  }, [user]);

  const progress = activeGoal 
    ? Math.min((activeGoal.current_value / activeGoal.target_value) * 100, 100)
    : 0;

  const daysLeft = activeGoal
    ? Math.ceil((new Date(activeGoal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <Card className="relative p-4 hover:shadow-lg transition-all">
        <div className="absolute top-2 right-2">
          <PinButton isPinned={isPinned(widgetId)} onToggle={() => togglePin(widgetId)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Personal Goal</span>
          </div>

          {activeGoal ? (
            <>
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{activeGoal.title}</h3>
                <p className="text-2xl font-bold mt-1">
                  {progress.toFixed(0)}%
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${activeGoal.current_value.toLocaleString()}</span>
                  <span>${activeGoal.target_value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {daysLeft > 0 
                  ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                  : 'Goal deadline reached'}
              </p>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">No active goals</p>
              <CreateGoalDialog onGoalCreated={fetchActiveGoal} />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
