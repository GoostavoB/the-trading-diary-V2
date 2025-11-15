import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { calculateTotalPnL } from "@/utils/pnl";
interface CreateGoalDialogProps {
  onGoalCreated: () => void;
  editingGoal?: any;
  onClose?: () => void;
}

export function CreateGoalDialog({ onGoalCreated, editingGoal, onClose }: CreateGoalDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(!!editingGoal);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingGoal?.title || '',
    description: editingGoal?.description || '',
    goal_type: editingGoal?.goal_type || 'profit',
    capital_target_type: editingGoal?.capital_target_type || 'absolute',
    target_value: editingGoal?.target_value || '',
    baseline_value: editingGoal?.baseline_value || '',
    period_type: editingGoal?.period_type || 'all_time',
    period_start: editingGoal?.period_start || '',
    period_end: editingGoal?.period_end || '',
    calculation_mode: editingGoal?.calculation_mode || 'current_performance',
    target_date: editingGoal?.deadline ? format(new Date(editingGoal.deadline), 'yyyy-MM-dd') : '',
  });

  // Fetch capital data for quick-fill buttons
  const { data: capitalData, isLoading: capitalLoading } = useQuery({
    queryKey: ['capital-quick-fill', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Get all capital log entries to sum total additions
      const { data: allEntries } = await supabase
        .from('capital_log')
        .select('amount_added, total_after, log_date')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });
      
      // Fetch all trades to compute total PnL (net of fees)
      const { data: allTrades } = await supabase
        .from('trades')
        .select('profit_loss, pnl, funding_fee, trading_fee')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      
      if (!allEntries || allEntries.length === 0) return null;
      
      // Initial Capital = SUM of all capital additions
      const totalCapitalAdded = allEntries.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
      
      // Total PnL (net) using standard util
      const totalPnLNet = calculateTotalPnL((allTrades || []) as any, { includeFees: true });
      
      // Current Capital = Total added capital + Total PnL (net)
      const currentCapital = totalCapitalAdded + totalPnLNet;
      
      return {
        initialCapital: totalCapitalAdded,
        currentCapital,
      };
    },
    enabled: !!user && open && (formData.goal_type === 'capital' || formData.goal_type === 'roi')
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title || '',
        description: editingGoal.description || '',
        goal_type: editingGoal.goal_type || 'profit',
        capital_target_type: editingGoal.capital_target_type || 'absolute',
        target_value: editingGoal.target_value || '',
        baseline_value: editingGoal.baseline_value || '',
        period_type: editingGoal.period_type || 'all_time',
        period_start: editingGoal.period_start ? format(new Date(editingGoal.period_start), 'yyyy-MM-dd') : '',
        period_end: editingGoal.period_end ? format(new Date(editingGoal.period_end), 'yyyy-MM-dd') : '',
        calculation_mode: editingGoal.calculation_mode || 'current_performance',
        target_date: editingGoal.deadline ? format(new Date(editingGoal.deadline), 'yyyy-MM-dd') : '',
      });
      setOpen(true);
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate baseline_value for capital and ROI goals
    if ((formData.goal_type === 'capital' || formData.goal_type === 'roi') && !formData.baseline_value) {
      toast.error('Starting capital is required for capital and ROI goals');
      return;
    }

    setLoading(true);
    try {
      const goalData: any = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || '',
        goal_type: formData.goal_type,
        target_value: parseFloat(formData.target_value),
        deadline: formData.target_date,
        current_value: editingGoal?.current_value || 0,
        period: editingGoal?.period || 'monthly',
        calculation_mode: formData.calculation_mode,
        period_type: formData.period_type,
      };

      // Add capital_target_type only for capital goals
      if (formData.goal_type === 'capital') {
        goalData.capital_target_type = formData.capital_target_type;
      }

      // Add period dates only if custom range is selected
      if (formData.period_type === 'custom_range') {
        goalData.period_start = formData.period_start || null;
        goalData.period_end = formData.period_end || null;
      } else {
        goalData.period_start = null;
        goalData.period_end = null;
      }

      // Set baseline_date for start_from_scratch mode
      if (formData.calculation_mode === 'start_from_scratch' && !editingGoal) {
        goalData.baseline_date = new Date().toISOString();
      }

      // Set baseline_value for capital and ROI goals
      if ((formData.goal_type === 'capital' || formData.goal_type === 'roi') && formData.baseline_value) {
        goalData.baseline_value = parseFloat(formData.baseline_value);
      } else if (!editingGoal) {
        goalData.baseline_value = null;
      }

      if (editingGoal) {
        const { error } = await supabase
          .from('trading_goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        
        if (error) throw error;
        toast.success("Goal updated successfully");
      } else {
        const { error } = await supabase
          .from('trading_goals')
          .insert(goalData);
        
        if (error) throw error;
        toast.success("Goal created successfully");
      }

      setOpen(false);
      onGoalCreated();
      if (onClose) onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        goal_type: 'profit',
        capital_target_type: 'absolute',
        target_value: '',
        baseline_value: '',
        period_type: 'all_time',
        period_start: '',
        period_end: '',
        calculation_mode: 'current_performance',
        target_date: '',
      });
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(error?.message || "Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  const goalTypes = [
    { value: 'capital', label: 'Capital' },
    { value: 'profit', label: 'Profit' },
    { value: 'win_rate', label: 'Win Rate' },
    { value: 'trades', label: 'Trades' },
    { value: 'roi', label: 'ROI' },
    { value: 'streak', label: 'Winning Streak' },
  ];

  const renderGoalTypeSection = () => {
    switch (formData.goal_type) {
      case 'capital':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Capital goal</h3>
            
            <div className="space-y-3">
              <Label>Target type</Label>
              <RadioGroup
                value={formData.capital_target_type}
                onValueChange={(value) => setFormData({ ...formData, capital_target_type: value })}
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="absolute" id="absolute" />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="absolute" className="font-medium cursor-pointer">
                      Amount
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Set a fixed capital value to reach.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="relative" id="relative" />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="relative" className="font-medium cursor-pointer">
                      Percentage
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Set how much you want your capital to grow.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="target_value">
                {formData.capital_target_type === 'absolute' ? 'Target capital' : 'Capital growth target'}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="target_value"
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder={formData.capital_target_type === 'absolute' ? '5,000' : '20'}
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {formData.capital_target_type === 'absolute' ? 'USDT' : '%'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {formData.capital_target_type === 'absolute'
                  ? 'Account value you want to reach by this goal\'s deadline.'
                  : 'Percentage growth you want from your starting capital in this goal.'}
              </p>
            </div>

            <div>
              <Label htmlFor="baseline_value">Starting capital *</Label>
              <div className="relative mt-1.5">
                <Input
                  id="baseline_value"
                  type="number"
                  step="any"
                  value={formData.baseline_value}
                  onChange={(e) => setFormData({ ...formData, baseline_value: e.target.value })}
                  placeholder="5,000"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  USDT
                </span>
              </div>
              
              {/* Quick-fill buttons */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (capitalData?.initialCapital) {
                      setFormData({ ...formData, baseline_value: capitalData.initialCapital.toString() });
                    }
                  }}
                  disabled={!capitalData?.initialCapital || capitalLoading}
                  className="flex-1 h-auto py-2"
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="text-xs font-normal">📊 My Initial Capital</span>
                    {capitalData?.initialCapital && (
                      <span className="text-sm font-semibold">${capitalData.initialCapital.toLocaleString()}</span>
                    )}
                    {!capitalData?.initialCapital && !capitalLoading && (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </div>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (capitalData?.currentCapital) {
                      setFormData({ ...formData, baseline_value: capitalData.currentCapital.toString() });
                    }
                  }}
                  disabled={!capitalData?.currentCapital || capitalLoading}
                  className="flex-1 h-auto py-2"
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="text-xs font-normal">💰 My Current Capital</span>
                    {capitalData?.currentCapital && (
                      <span className="text-sm font-semibold">${capitalData.currentCapital.toLocaleString()}</span>
                    )}
                    {!capitalData?.currentCapital && !capitalLoading && (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </div>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1.5">
                💡 Your current account balance/equity. Progress will be calculated from this starting point.
              </p>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              Progress is calculated from your starting capital (set above) plus/minus your trading PnL within the goal's timeframe.
            </p>
          </div>
        );
      
      case 'profit':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Profit goal</h3>
            <div>
              <Label htmlFor="target_value">Target profit</Label>
              <div className="relative mt-1.5">
                <Input
                  id="target_value"
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="1,000"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  USDT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Profit you want to earn within this goal's timeframe.
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              We use your realized PnL from trades to calculate progress toward this goal.
            </p>
          </div>
        );

      case 'win_rate':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Win rate goal</h3>
            <div>
              <Label htmlFor="target_value">Target win rate</Label>
              <div className="relative mt-1.5">
                <Input
                  id="target_value"
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="60"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Percentage of winning trades you want to achieve in this goal.
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              We calculate win rate using the trades inside your goal timeframe.
            </p>
          </div>
        );

      case 'trades':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Trades goal</h3>
            <div>
              <Label htmlFor="target_value">Target number of trades</Label>
              <Input
                id="target_value"
                type="number"
                step="1"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder="50"
                required
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Total number of trades you want to take inside this goal timeframe.
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              We count all trades in the selected timeframe to track this goal.
            </p>
          </div>
        );

      case 'roi':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">ROI goal</h3>
            <div>
              <Label htmlFor="target_value">Target ROI</Label>
              <div className="relative mt-1.5">
                <Input
                  id="target_value"
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="10"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Return on investment percentage you want to reach in this goal.
              </p>
            </div>

            <div>
              <Label htmlFor="baseline_value">Starting capital *</Label>
              <div className="relative mt-1.5">
                <Input
                  id="baseline_value"
                  type="number"
                  step="any"
                  value={formData.baseline_value}
                  onChange={(e) => setFormData({ ...formData, baseline_value: e.target.value })}
                  placeholder="5,000"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  USDT
                </span>
              </div>
              
              {/* Quick-fill buttons */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (capitalData?.initialCapital) {
                      setFormData({ ...formData, baseline_value: capitalData.initialCapital.toString() });
                    }
                  }}
                  disabled={!capitalData?.initialCapital || capitalLoading}
                  className="flex-1 h-auto py-2"
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="text-xs font-normal">📊 My Initial Capital</span>
                    {capitalData?.initialCapital && (
                      <span className="text-sm font-semibold">${capitalData.initialCapital.toLocaleString()}</span>
                    )}
                    {!capitalData?.initialCapital && !capitalLoading && (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </div>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (capitalData?.currentCapital) {
                      setFormData({ ...formData, baseline_value: capitalData.currentCapital.toString() });
                    }
                  }}
                  disabled={!capitalData?.currentCapital || capitalLoading}
                  className="flex-1 h-auto py-2"
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="text-xs font-normal">💰 My Current Capital</span>
                    {capitalData?.currentCapital && (
                      <span className="text-sm font-semibold">${capitalData.currentCapital.toLocaleString()}</span>
                    )}
                    {!capitalData?.currentCapital && !capitalLoading && (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </div>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1.5">
                💡 Your account balance at the start. ROI will be calculated as PnL / starting capital × 100.
              </p>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              ROI is calculated using your realized PnL divided by your starting capital within the goal's timeframe.
            </p>
          </div>
        );

      case 'streak':
        return (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Winning streak goal</h3>
            <div>
              <Label htmlFor="target_value">Target streak</Label>
              <div className="relative mt-1.5">
                <Input
                  id="target_value"
                  type="number"
                  step="1"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="5"
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  wins
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Number of consecutive winning trades you want to reach.
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              We track your active streak using trades inside your goal timeframe.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!editingGoal && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Goal title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Reach $10,000 profit"
              required
              className="mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Goal description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes about this goal..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          {/* Goal Type */}
          <div>
            <Label>Goal type *</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal_type: type.value })}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.goal_type === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-Specific Section */}
          {renderGoalTypeSection()}

          {/* Goal Timeframe */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <h3 className="font-medium">Goal timeframe</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which trades and results count for this goal.
              </p>
            </div>

            <RadioGroup
              value={formData.period_type}
              onValueChange={(value) => setFormData({ ...formData, period_type: value })}
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="all_time" id="all_time" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="all_time" className="font-medium cursor-pointer">
                    All data until deadline
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Use all your trading history up to this goal's deadline.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="custom_range" id="custom_range" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="custom_range" className="font-medium cursor-pointer">
                    Custom date range
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Use only trades inside a specific start and end date.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {formData.period_type === 'custom_range' && (
              <>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label htmlFor="period_start">From</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="period_end">To</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  We only use trades inside this date range for this goal.
                </p>
              </>
            )}
          </div>

          {/* Goal Calculation Mode */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <h3 className="font-medium">Goal calculation mode</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how progress is calculated.
              </p>
            </div>

            <RadioGroup
              value={formData.calculation_mode}
              onValueChange={(value) => setFormData({ ...formData, calculation_mode: value })}
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="current_performance" id="current_performance" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="current_performance" className="font-medium cursor-pointer">
                    Use current performance
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Use all data inside the timeframe. Your progress starts from your existing results.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="start_from_scratch" id="start_from_scratch" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="start_from_scratch" className="font-medium cursor-pointer">
                    Start from scratch today
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Ignore past data. Your progress starts at zero from today.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="target_date">Deadline *</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
