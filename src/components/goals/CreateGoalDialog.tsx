import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

// Get today's date in local timezone as YYYY-MM-DD
const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(Date.now() - offset).toISOString().slice(0, 10);
};

// Normalize numeric input (handle "5,000" or "5.000" formats)
const normalizeNumericInput = (value: string): number => {
  if (!value) return 0;
  // Remove thousand separators (comma or period) and parse
  const normalized = value.replace(/[,\s]/g, '');
  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) throw new Error('Invalid number');
  return parsed;
};

const formSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  goal_type: z.enum(['profit', 'win_rate', 'trades', 'streak', 'roi'], {
    required_error: 'Please select a goal type',
  }),
  target_value: z.string()
    .min(1, 'Target value is required')
    .refine((val) => {
      try {
        const num = normalizeNumericInput(val);
        return num > 0;
      } catch {
        return false;
      }
    }, 'Target value must be greater than 0'),
  target_date: z.string()
    .min(1, 'Target date is required')
    .refine((date) => {
      const selected = new Date(date + 'T00:00:00');
      const today = new Date(getTodayLocal() + 'T00:00:00');
      return selected >= today;
    }, 'Target date must be today or in the future'),
});

interface CreateGoalDialogProps {
  onGoalCreated: () => void;
  editingGoal?: any;
  onClose?: () => void;
}

export function CreateGoalDialog({ onGoalCreated, editingGoal, onClose }: CreateGoalDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(!!editingGoal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingGoal?.title || '',
      description: editingGoal?.description || '',
      goal_type: editingGoal?.goal_type || 'profit',
      target_value: editingGoal?.target_value?.toString() || '',
      target_date: editingGoal?.deadline ? format(new Date(editingGoal.deadline), 'yyyy-MM-dd') : '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to create goals');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Normalize target value
      const normalizedValue = normalizeNumericInput(values.target_value);
      
      // Convert date to end-of-day local time as ISO timestamptz
      const deadlineISO = new Date(values.target_date + 'T23:59:59').toISOString();

      console.info('[CreateGoal] Submitting goal:', { 
        title: values.title, 
        type: values.goal_type, 
        value: normalizedValue,
        date: values.target_date 
      });

      const goalData = {
        user_id: user.id,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        goal_type: values.goal_type,
        target_value: normalizedValue.toString(), // Send as string for Postgres numeric
        deadline: deadlineISO,
        current_value: editingGoal?.current_value || 0,
        period: editingGoal?.period || 'monthly',
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('trading_goals')
          .update(goalData)
          .eq('id', editingGoal.id)
          .select()
          .single();

        if (error) {
          console.error('[CreateGoal] Update error:', error);
          throw new Error(error.message || 'Failed to update goal');
        }
        
        console.info('[CreateGoal] Goal updated successfully');
        toast.success("Goal updated successfully");
      } else {
        const { data, error } = await supabase
          .from('trading_goals')
          .insert(goalData)
          .select()
          .single();

        if (error) {
          console.error('[CreateGoal] Insert error:', error);
          throw new Error(error.message || 'Failed to create goal');
        }
        
        console.info('[CreateGoal] Goal created successfully:', data?.id);
        toast.success("Goal created successfully");
      }

      // Close dialog and refresh
      setOpen(false);
      form.reset();
      onGoalCreated();
      if (onClose) onClose();
      
    } catch (error: any) {
      console.error('[CreateGoal] Error saving goal:', error);
      toast.error(error?.message || "Failed to save goal. Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goalTypes = [
    { value: 'profit', label: 'Profit Target', unit: '$' },
    { value: 'win_rate', label: 'Win Rate', unit: '%' },
    { value: 'trades', label: 'Number of Trades', unit: 'trades' },
    { value: 'streak', label: 'Winning Streak', unit: 'days' },
    { value: 'roi', label: 'ROI Percentage', unit: '%' },
  ];

  const todayLocal = getTodayLocal();

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Reach $10,000 profit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add more details about your goal..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goalTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Target Value * 
                    ({goalTypes.find(t => t.value === form.watch('goal_type'))?.unit})
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      placeholder="Enter target value"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      min={todayLocal}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
