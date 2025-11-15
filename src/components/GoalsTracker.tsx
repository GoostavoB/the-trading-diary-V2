import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Target, TrendingUp, DollarSign, Percent, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_type: 'pnl' | 'win_rate' | 'trades' | 'roi';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  created_at: string;
  deadline?: string;
}

interface GoalsTrackerProps {
  trades: Trade[];
}

export const GoalsTracker = ({ trades }: GoalsTrackerProps) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    target_value: '',
    goal_type: 'pnl' as Goal['goal_type'],
    period: 'monthly' as Goal['period'],
    deadline: '',
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  useEffect(() => {
    if (goals.length > 0 && trades.length > 0) {
      updateGoalsProgress();
    }
  }, [trades, goals.length]);

  const fetchGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('trading_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals((data || []) as Goal[]);
  };

  const getTradesInScope = (goal: any) => {
    // Step 1: Filter by period window
    let periodFilteredTrades = trades;
    
    if (goal.period_type === 'custom_range') {
      const periodStart = new Date(goal.period_start);
      const periodEnd = new Date(goal.period_end);
      periodFilteredTrades = trades.filter(t => {
        const tradeDate = new Date(t.trade_date);
        return tradeDate >= periodStart && tradeDate <= periodEnd;
      });
    } else if (goal.period_type === 'all_time' && goal.deadline) {
      const periodEnd = new Date(goal.deadline);
      periodFilteredTrades = trades.filter(t => new Date(t.trade_date) <= periodEnd);
    }

    // Step 2: Apply baseline_date filter only for start_from_scratch mode
    if (goal.calculation_mode === 'start_from_scratch' && goal.baseline_date) {
      const baselineDate = new Date(goal.baseline_date);
      return periodFilteredTrades.filter(t => new Date(t.trade_date) >= baselineDate);
    }

    return periodFilteredTrades;
  };

  const calculateCurrentValue = (goal: any, relevantTrades: Trade[]) => {
    switch (goal.goal_type) {
      case 'capital':
        // For capital goals, we need account equity
        // For now, use cumulative PnL as a proxy (would need actual account data in production)
        const totalPnl = relevantTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        if (goal.capital_target_type === 'relative') {
          // For relative, calculate percentage growth from baseline
          const baseline = goal.baseline_value || 0;
          return baseline > 0 ? ((totalPnl / baseline) * 100) : 0;
        }
        return totalPnl; // For absolute, return total capital (would be starting capital + PnL)
      
      case 'profit':
      case 'pnl':
        return relevantTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      
      case 'win_rate':
        const wins = relevantTrades.filter(t => (t.profit_loss || 0) > 0).length;
        return relevantTrades.length > 0 ? (wins / relevantTrades.length) * 100 : 0;
      
      case 'trades':
        return relevantTrades.length;
      
      case 'roi':
        const totalRoiPnl = relevantTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        const totalMargin = relevantTrades.reduce((sum, t) => sum + (t.margin || 0), 0);
        return totalMargin > 0 ? (totalRoiPnl / totalMargin) * 100 : 0;
      
      case 'streak':
        // Calculate current winning streak
        let currentStreak = 0;
        const sortedTrades = [...relevantTrades].sort((a, b) => 
          new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
        );
        for (const trade of sortedTrades) {
          if ((trade.profit_loss || 0) > 0) {
            currentStreak++;
          } else {
            break;
          }
        }
        return currentStreak;
      
      default:
        return 0;
    }
  };

  const updateGoalsProgress = async () => {
    const updates = goals.map(goal => {
      const relevantTrades = getTradesInScope(goal);
      const currentValue = calculateCurrentValue(goal, relevantTrades);
      return { id: goal.id, current_value: currentValue };
    });

    for (const update of updates) {
      await supabase
        .from('trading_goals')
        .update({ current_value: update.current_value })
        .eq('id', update.id);
    }

    fetchGoals();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const goalData = {
      user_id: user.id,
      title: formData.title,
      target_value: parseFloat(formData.target_value),
      goal_type: formData.goal_type,
      period: formData.period,
      deadline: formData.deadline || null,
      current_value: 0,
    };

    if (editingGoal) {
      const { error } = await supabase
        .from('trading_goals')
        .update(goalData)
        .eq('id', editingGoal.id);

      if (error) {
        toast.error('Failed to update goal');
        return;
      }
      toast.success('Goal updated successfully');
    } else {
      const { error } = await supabase
        .from('trading_goals')
        .insert(goalData);

      if (error) {
        toast.error('Failed to create goal');
        return;
      }
      toast.success('Goal created successfully');
    }

    setIsOpen(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      target_value: '',
      goal_type: 'pnl',
      period: 'monthly',
      deadline: '',
    });
    fetchGoals();
  };

  const handleDelete = async (goalId: string) => {
    const { error } = await supabase
      .from('trading_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      toast.error('Failed to delete goal');
      return;
    }

    toast.success('Goal deleted');
    fetchGoals();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target_value: goal.target_value.toString(),
      goal_type: goal.goal_type,
      period: goal.period,
      deadline: goal.deadline || '',
    });
    setIsOpen(true);
  };

  const getGoalIcon = (type: Goal['goal_type']) => {
    switch (type) {
      case 'pnl':
        return DollarSign;
      case 'win_rate':
        return Percent;
      case 'trades':
        return TrendingUp;
      case 'roi':
        return Target;
    }
  };

  const formatValue = (value: number, type: Goal['goal_type']) => {
    switch (type) {
      case 'pnl':
        return `$${value.toFixed(2)}`;
      case 'win_rate':
      case 'roi':
        return `${value.toFixed(1)}%`;
      case 'trades':
        return value.toFixed(0);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Trading Goals
          </h3>
          <p className="text-sm text-muted-foreground">Set and track your trading targets</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly Profit Target"
                  required
                />
              </div>
              <div>
                <Label htmlFor="goal_type">Goal Type</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value: Goal['goal_type']) =>
                    setFormData({ ...formData, goal_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pnl">Total P&L ($)</SelectItem>
                    <SelectItem value="win_rate">Win Rate (%)</SelectItem>
                    <SelectItem value="trades">Number of Trades</SelectItem>
                    <SelectItem value="roi">ROI (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_value">Target Value</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="period">Time Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: Goal['period']) =>
                    setFormData({ ...formData, period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingGoal(null);
                    setFormData({
                      title: '',
                      target_value: '',
                      goal_type: 'pnl',
                      period: 'monthly',
                      deadline: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No goals set yet. Create your first trading goal to start tracking progress!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const Icon = getGoalIcon(goal.goal_type);
            const progress = (goal.current_value / goal.target_value) * 100;
            const isCompleted = progress >= 100;

            return (
              <Card
                key={goal.id}
                className={`p-4 ${
                  isCompleted
                    ? 'bg-neon-green/10 border-neon-green/30'
                    : 'bg-card border-border'
                } transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-neon-green/20' : 'bg-primary/20'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isCompleted ? 'text-neon-green' : 'text-primary'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{goal.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {goal.period}
                        </Badge>
                        {isCompleted && (
                          <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                            <Check className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {formatValue(goal.current_value, goal.goal_type)} of{' '}
                          {formatValue(goal.target_value, goal.goal_type)}
                        </span>
                        {goal.deadline && (
                          <span className="text-xs">
                            • Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(goal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress
                    value={Math.min(progress, 100)}
                    className={isCompleted ? '[&>div]:bg-neon-green' : ''}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(1)}% complete</span>
                    {progress < 100 && (
                      <span>
                        {formatValue(goal.target_value - goal.current_value, goal.goal_type)} to
                        go
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};
