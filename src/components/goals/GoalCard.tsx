import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Calendar, Award, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { BlurredCurrency, BlurredPercent } from "@/components/ui/BlurredValue";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    goal_type: string;
    target_value: number;
    current_value: number;
    deadline: string;
    period?: string;
    created_at: string;
    calculation_mode?: string;
    capital_target_type?: string;
    period_type?: string;
    period_start?: string;
    period_end?: string;
  };
  onEdit: (goal: any) => void;
  onDelete: (id: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = Math.min(100, (goal.current_value / goal.target_value) * 100);
  const isCompleted = progress >= 100;
  const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;
  
  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-600';
    if (isOverdue) return 'bg-red-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const getGoalTypeIcon = () => {
    switch (goal.goal_type) {
      case 'capital': return <TrendingUp className="h-4 w-4" />;
      case 'profit': return <TrendingUp className="h-4 w-4" />;
      case 'pnl': return <TrendingUp className="h-4 w-4" />;
      case 'win_rate': return <Target className="h-4 w-4" />;
      case 'streak': return <Award className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number, type: string, capitalTargetType?: string) => {
    switch (type) {
      case 'capital':
        if (capitalTargetType === 'relative') {
          return <BlurredPercent value={value} className="inline" />;
        }
        return <BlurredCurrency amount={value} className="inline" />;
      case 'profit':
      case 'pnl':
        return <BlurredCurrency amount={value} className="inline" />;
      case 'win_rate':
        return <BlurredPercent value={value} className="inline" />;
      case 'roi':
        return <BlurredPercent value={value} className="inline" />;
      case 'trades':
        return `${Math.floor(value)} trades`;
      case 'streak':
        return `${Math.floor(value)} wins`;
      default:
        return value.toString();
    }
  };

  return (
    <Card className={`p-5 transition-all ${isCompleted ? 'border-green-500' : isOverdue ? 'border-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${getStatusColor()} bg-opacity-10`}>
            {getGoalTypeIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={isCompleted ? 'default' : 'outline'} className={getStatusColor()}>
                {isCompleted ? 'Completed' : 'Active'}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(goal.deadline), 'MMM dd, yyyy')}
              </Badge>
              {goal.calculation_mode === 'start_from_scratch' && (
                <Badge variant="outline" className="text-xs">
                  Fresh Start
                </Badge>
              )}
              {goal.period_type === 'custom_range' && (
                <Badge variant="outline" className="text-xs">
                  Custom Range
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onEdit(goal)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(goal.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Current: {formatValue(goal.current_value, goal.goal_type, goal.capital_target_type)}
          </span>
          <span className="text-muted-foreground">
            Target: {formatValue(goal.target_value, goal.goal_type, goal.capital_target_type)}
          </span>
        </div>
      </div>

      {isCompleted && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
          <Award className="h-4 w-4" />
          Goal Achieved!
        </div>
      )}

      {isOverdue && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600 dark:text-red-400">
          Overdue by {Math.floor((new Date().getTime() - new Date(goal.deadline).getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      )}
    </Card>
  );
}
