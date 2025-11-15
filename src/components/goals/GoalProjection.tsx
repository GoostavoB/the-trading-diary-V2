import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_type: 'profit' | 'capital' | 'win_rate' | 'trades' | 'roi';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  deadline?: string;
  baseline_value?: number;
  capital_target_type?: 'absolute' | 'relative';
}

// Lightweight trade interface for projection calculations
interface Trade {
  trade_date: string | null;
  opened_at?: string | null;
  pnl?: number | null;
  profit_loss?: number | null;
  roi?: number | null;
}

interface GoalProjectionProps {
  goals: Goal[];
  trades: Trade[];
  onDelete?: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
}

export const GoalProjection = ({ goals, trades, onDelete, onEdit }: GoalProjectionProps) => {
  const activeGoals = goals.filter(g => (g.current_value / g.target_value) < 1);
  
  if (activeGoals.length === 0) {
    return null;
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm bg-muted/30 rounded-lg border border-dashed">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">Need more trade history</p>
        <p className="text-xs mt-1">Complete at least 5 trades to see projections</p>
      </div>
    );
  }

  const calculateProjection = (goal: Goal) => {
    // Calculate historical period from uploaded trades only
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.opened_at || a.trade_date).getTime() - new Date(b.opened_at || b.trade_date).getTime()
    );
    
    const firstTradeDate = new Date(sortedTrades[0]?.opened_at || sortedTrades[0]?.trade_date);
    const lastTradeDate = new Date(sortedTrades[sortedTrades.length - 1]?.opened_at || sortedTrades[sortedTrades.length - 1]?.trade_date);
    
    // Calculate unique trading days
    const uniqueTradingDays = new Set(
      trades.map(t => new Date(t.trade_date).toISOString().split('T')[0])
    ).size;
    
    // Add 1 to include both first and last day (inclusive count)
    const daysPassed = differenceInDays(lastTradeDate, firstTradeDate) + 1;
    
    console.log('🎯 Goal Projection Debug:', {
      goalTitle: goal.title,
      totalTrades: trades.length,
      firstTradeDate: firstTradeDate.toISOString().split('T')[0],
      lastTradeDate: lastTradeDate.toISOString().split('T')[0],
      daysPassed,
      uniqueTradingDays,
      tradingDaysWithTrades: uniqueTradingDays,
      daysInPeriod: daysPassed,
    });
    
    // Calculate total PnL for growth-based goals
    const totalPnL = trades.reduce((sum, t) => sum + ((t.pnl ?? t.profit_loss) || 0), 0);
    
    console.log('💰 PnL Calculation:', {
      totalPnL,
      avgPnLPerDay: totalPnL / daysPassed
    });
    
    let dailyRate = 0;
    switch (goal.goal_type) {
      case 'profit':
        dailyRate = totalPnL / daysPassed;
        break;
      case 'capital':
        dailyRate = totalPnL / daysPassed; // Growth rate, not total value
        break;
      case 'trades':
        dailyRate = trades.length / daysPassed;
        break;
      case 'win_rate':
        const winningTrades = trades.filter(t => ((t.pnl ?? t.profit_loss) || 0) > 0).length;
        dailyRate = ((winningTrades / trades.length) * 100) / daysPassed;
        break;
      case 'roi':
        const avgRoi = trades.reduce((sum, t) => sum + ((t.roi || 0)), 0) / trades.length;
        dailyRate = avgRoi / daysPassed;
        break;
    }

    // Project future values
    const today = new Date();
    const projectionData = [];
    const daysToProject = goal.deadline 
      ? differenceInDays(new Date(goal.deadline), today)
      : 30;
    
    for (let i = 0; i <= Math.min(daysToProject, 90); i += Math.max(1, Math.floor(daysToProject / 10))) {
      const date = addDays(today, i);
      const projectedValue = goal.current_value + (dailyRate * i);
      projectionData.push({
        date: format(date, 'MMM dd'),
        value: Math.max(0, projectedValue),
        target: goal.target_value,
      });
    }

    // Calculate if on track
    const valueNeeded = goal.target_value - goal.current_value;
    const daysRemaining = goal.deadline 
      ? differenceInDays(new Date(goal.deadline), today)
      : 30;
    const requiredDailyRate = valueNeeded / daysRemaining;
    const isOnTrack = dailyRate >= requiredDailyRate * 0.8; // 80% threshold
    const projectedFinalValue = goal.current_value + (dailyRate * daysRemaining);
    const projectedProgress = (projectedFinalValue / goal.target_value) * 100;

    return {
      data: projectionData,
      isOnTrack,
      dailyRate,
      requiredDailyRate,
      projectedFinalValue,
      projectedProgress,
      daysRemaining,
    };
  };

  const formatValue = (value: number, type: Goal['goal_type']) => {
    switch (type) {
      case 'profit':
      case 'capital':
        return `$${value.toFixed(2)}`;
      case 'win_rate':
        return `${value.toFixed(1)}%`;
      case 'trades':
        return Math.round(value).toString();
      case 'roi':
        return `${value.toFixed(2)}%`;
      default:
        return value.toFixed(2);
    }
  };

  return (
    <div className="space-y-4">
      {activeGoals.map(goal => {
        const projection = calculateProjection(goal);
        
        return (
          <Card key={goal.id} className="overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{goal.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {goal.deadline && `Due ${format(new Date(goal.deadline), 'MMM dd, yyyy')} • ${projection.daysRemaining} days left`}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(goal)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8"
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(goal.id)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {projection.isOnTrack ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 px-3 py-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    On Track - {Math.min(95, Math.round(projection.projectedProgress))}% likely to succeed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 px-3 py-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Behind - {Math.max(20, Math.round(projection.projectedProgress * 0.6))}% likely
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Current</p>
                  <p className="text-xl font-bold">{formatValue(goal.current_value, goal.goal_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Target</p>
                  <p className="text-xl font-bold">{formatValue(goal.target_value, goal.goal_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Progress</p>
                  <p className="text-xl font-bold">{Math.round((goal.current_value / goal.target_value) * 100)}%</p>
                </div>
              </div>

              {/* Projection Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projection.data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatValue(value, goal.goal_type)}
                    />
                    <ReferenceLine 
                      y={goal.target_value} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Target', position: 'right', fontSize: 10 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={projection.isOnTrack ? "hsl(var(--primary))" : "hsl(var(--destructive))"} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Current Pace:
                  </span>
                  <span className="font-semibold">{formatValue(projection.dailyRate, goal.goal_type)}/day</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Need:
                  </span>
                  <span className="font-semibold">{formatValue(projection.requiredDailyRate, goal.goal_type)}/day</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Projected by deadline:</span>
                  <span className="font-bold text-base">
                    {formatValue(projection.projectedFinalValue, goal.goal_type)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({projection.projectedProgress.toFixed(0)}%)
                    </span>
                  </span>
                </div>
              </div>

              {!projection.isOnTrack && (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                      ⚠️ To reach your goal, increase your daily rate by{' '}
                      <span className="font-semibold">
                        {formatValue(Math.abs(projection.requiredDailyRate - projection.dailyRate), goal.goal_type)}
                      </span>
                    </p>
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      💡 At current pace: {formatValue(projection.projectedFinalValue, goal.goal_type)} by deadline ({projection.projectedProgress.toFixed(0)}% of goal)
                    </p>
                  </div>
                </div>
              )}
              
              {projection.isOnTrack && (
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 dark:text-green-200">
                    🎯 Great pace! You're projected to reach {formatValue(projection.projectedFinalValue, goal.goal_type)} by deadline
                  </p>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
