import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_type: 'pnl' | 'win_rate' | 'trades' | 'roi';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  deadline?: string;
}

interface Trade {
  trade_date: string;
  pnl?: number;
  roi?: number;
}

interface GoalProjectionProps {
  goals: Goal[];
  trades: Trade[];
}

export const GoalProjection = ({ goals, trades }: GoalProjectionProps) => {
  const activeGoals = goals.filter(g => (g.current_value / g.target_value) < 1);
  
  if (activeGoals.length === 0 || trades.length === 0) {
    return null;
  }

  const calculateProjection = (goal: Goal) => {
    // Calculate average daily performance
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );
    
    const firstTradeDate = new Date(sortedTrades[0]?.trade_date);
    const lastTradeDate = new Date(sortedTrades[sortedTrades.length - 1]?.trade_date);
    const daysPassed = differenceInDays(lastTradeDate, firstTradeDate) || 1;
    
    let dailyRate = 0;
    switch (goal.goal_type) {
      case 'pnl':
        dailyRate = goal.current_value / daysPassed;
        break;
      case 'trades':
        dailyRate = trades.length / daysPassed;
        break;
      case 'win_rate':
        const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
        dailyRate = ((winningTrades / trades.length) * 100) / daysPassed;
        break;
      case 'roi':
        dailyRate = goal.current_value / daysPassed;
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
      case 'pnl':
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
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold">Goal Projections</h3>
      </div>
      
      {activeGoals.map(goal => {
        const projection = calculateProjection(goal);
        
        return (
          <Card key={goal.id} className="p-6 glass-strong">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{goal.title}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{goal.period} goal</p>
                </div>
                <Badge 
                  variant={projection.isOnTrack ? "default" : "destructive"}
                  className="gap-1"
                >
                  {projection.isOnTrack ? (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      On Track
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Behind
                    </>
                  )}
                </Badge>
              </div>

              {/* Current Status */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-lg font-semibold">
                    {formatValue(goal.current_value, goal.goal_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-lg font-semibold">
                    {formatValue(goal.target_value, goal.goal_type)}
                  </p>
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
                      stroke="hsl(var(--accent))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Target', position: 'right', fontSize: 10 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={projection.isOnTrack ? "hsl(var(--accent))" : "hsl(var(--destructive))"} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Projection Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Daily Rate</p>
                  <p className="font-medium">
                    {formatValue(projection.dailyRate, goal.goal_type)}/day
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Required Rate</p>
                  <p className="font-medium">
                    {formatValue(projection.requiredDailyRate, goal.goal_type)}/day
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projected Final</p>
                  <p className={`font-medium ${projection.projectedProgress >= 100 ? 'text-accent' : 'text-destructive'}`}>
                    {formatValue(projection.projectedFinalValue, goal.goal_type)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Progress</p>
                  <p className={`font-medium ${projection.projectedProgress >= 100 ? 'text-accent' : 'text-destructive'}`}>
                    {projection.projectedProgress.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Warning if behind */}
              {!projection.isOnTrack && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Action Required</p>
                    <p className="text-muted-foreground">
                      You need to increase your daily rate by{' '}
                      <span className="font-semibold">
                        {formatValue(projection.requiredDailyRate - projection.dailyRate, goal.goal_type)}
                      </span>
                      {' '}to reach this goal{goal.deadline ? ' by the deadline' : ''}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
