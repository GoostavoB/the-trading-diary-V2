import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, LogOut, KeyRound, ArrowUpCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { currentPlan, isLoading: planLoading } = useSubscriptionContext();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to format plan name for display
  const formatPlanName = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'Starter';
      case 'pro':
        return 'Pro';
      case 'elite':
        return 'Elite';
      default:
        return 'Starter';
    }
  };

  // Helper to get plan badge color
  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'pro':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'elite':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 dark:from-yellow-900 dark:to-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Show upgrade button only for basic and pro plans
  const shouldShowUpgrade = currentPlan === 'basic' || currentPlan === 'pro';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password change form
    const result = passwordChangeSchema.safeParse({
      newPassword,
      confirmPassword
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully');
        setChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        // Sign out and redirect to login
        await signOut();
        navigate('/auth');
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset email sent');
        setChangePasswordOpen(false);
      }
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Get display name from user metadata or email
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Hello, {displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* User Email */}
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>

          {/* Current Plan Display */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan:</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getPlanBadgeClass(currentPlan)}`}>
                {currentPlan === 'elite' && <Crown className="w-3 h-3" />}
                {formatPlanName(currentPlan)}
              </div>
            </div>
          </div>

          {/* Upgrade Button (conditional) */}
          {shouldShowUpgrade && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="sm"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Choose how you'd like to change your password
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border rounded-md space-y-3">
              <h3 className="font-medium">Change Now</h3>
              <p className="text-sm text-muted-foreground">
                Update your password immediately and sign out
              </p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="p-4 border rounded-md space-y-3">
              <h3 className="font-medium">Send Reset Email</h3>
              <p className="text-sm text-muted-foreground">
                We'll send a password reset link to <strong>{user.email}</strong>
              </p>
              <Button
                variant="outline"
                onClick={sendPasswordResetEmail}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
