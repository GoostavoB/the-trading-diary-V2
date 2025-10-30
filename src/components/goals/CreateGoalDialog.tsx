import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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
    target_value: editingGoal?.target_value || '',
    target_date: editingGoal?.deadline ? format(new Date(editingGoal.deadline), 'yyyy-MM-dd') : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate target date is not in the past
    const targetDate = new Date(formData.target_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (targetDate < today) {
      toast.error("Target date cannot be in the past");
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || '',
        goal_type: formData.goal_type,
        target_value: parseFloat(formData.target_value),
        deadline: formData.target_date,
        current_value: editingGoal?.current_value || 0,
        period: editingGoal?.period || 'monthly',
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('trading_goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast.success("Goal updated successfully");
      } else {
        const { error } = await supabase
          .from('trading_goals')
          .insert(goalData);
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
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
        target_value: '',
        target_date: '',
      });
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast.error(error?.message || "Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  const goalTypes = [
    { value: 'profit', label: 'Profit Target', unit: '$' },
    { value: 'win_rate', label: 'Win Rate', unit: '%' },
    { value: 'trades', label: 'Number of Trades', unit: 'trades' },
    { value: 'streak', label: 'Winning Streak', unit: 'days' },
    { value: 'roi', label: 'ROI Percentage', unit: '%' },
  ];

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Reach $10,000 profit"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details about your goal..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goal_type">Goal Type *</Label>
            <Select value={formData.goal_type} onValueChange={(value) => setFormData({ ...formData, goal_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target_value">
              Target Value * 
              ({goalTypes.find(t => t.value === formData.goal_type)?.unit})
            </Label>
            <Input
              id="target_value"
              type="number"
              step="any"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              placeholder="Enter target value"
              required
            />
          </div>

          <div>
            <Label htmlFor="target_date">Target Date *</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
