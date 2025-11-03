import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAccount } from '@/contexts/AccountContext';
import { useUserTier } from '@/hooks/useUserTier';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(40, 'Name must be at most 40 characters'),
  type: z.string().optional(),
  color: z.string().optional(),
});

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAccountDialog = ({ open, onOpenChange }: CreateAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchAccounts, accounts } = useAccount();
  const { tier } = useUserTier();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      color: '#4F46E5',
    },
  });

  // Check if user can create more accounts
  const canCreateAccount = tier === 'pro' || tier === 'elite' || accounts.length === 0;
  const isStarterLimitReached = (tier === 'free' || tier === 'basic') && accounts.length >= 1;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isStarterLimitReached) {
      window.location.href = '/#pricing-section';
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://qziawervfvptoretkjrn.supabase.co/functions/v1/accounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes('Plan limit reached')) {
          toast.error('Starter supports 1 account. Upgrade to Pro for unlimited accounts.', {
            action: {
              label: 'Upgrade',
              onClick: () => (window.location.href = '/#pricing-section'),
            },
          });
          onOpenChange(false);
          return;
        }
        throw new Error(`Account creation failed: ${response.status}`);
      }

      toast.success('Account created successfully');
      await refetchAccounts();
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Create different accounts like 'Scalp' or 'SunTrade'. Name them and switch from the top menu.
          </DialogDescription>
        </DialogHeader>

        {isStarterLimitReached ? (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-foreground mb-2">
                <strong>Starter supports 1 account.</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Pro for unlimited accounts.
              </p>
              <Button onClick={() => (window.location.href = '/#pricing-section')} className="w-full">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scalp, SunTrade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scalp, Swing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
