import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, LogOut, KeyRound, Settings, Target, Crown, HelpCircle, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';

const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface SubscriptionData {
  plan_type: string;
  upload_credits_balance: number;
  monthly_upload_limit: number;
  created_at: string;
}

export const UserAccountMenu = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan_type, upload_credits_balance, monthly_upload_limit, created_at')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setSubscriptionData(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
    toast.success(t('auth.toast.signOutSuccess'));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        toast.success(t('userMenu.dialog.success'));
        setChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        await signOut();
        navigate('/auth');
      }
    } catch (error) {
      toast.error(t('userMenu.dialog.error'));
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
        toast.success(t('userMenu.dialog.resetEmailSent'));
        setChangePasswordOpen(false);
      }
    } catch (error) {
      toast.error(t('userMenu.dialog.resetError'));
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'elite':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 font-semibold">
            <Crown className="w-3 h-3 mr-1" />
            Elite
          </Badge>
        );
      case 'pro':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 font-semibold">
            <Target className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Free
          </Badge>
        );
    }
  };

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const creditsPercentage = subscriptionData 
    ? (subscriptionData.upload_credits_balance / subscriptionData.monthly_upload_limit) * 100 
    : 0;
  
  const memberSince = subscriptionData?.created_at 
    ? format(new Date(subscriptionData.created_at), 'MMM yyyy')
    : '';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">{t('userMenu.hello')}, {displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-4">
          {/* Header with Email */}
          <DropdownMenuLabel className="px-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold">My Account</span>
              {subscriptionData && getPlanBadge(subscriptionData.plan_type)}
            </div>
            <p className="text-sm font-normal text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Credits Section */}
          {subscriptionData && (
            <div className="py-3 px-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Credits</span>
                  <span className="text-sm font-bold">
                    {subscriptionData.upload_credits_balance} left
                  </span>
                </div>
                <Progress value={creditsPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Using monthly credits
                </p>
              </div>
            </div>
          )}

          {/* Member Since */}
          {memberSince && (
            <>
              <DropdownMenuSeparator />
              <div className="py-2 px-0">
                <p className="text-xs text-muted-foreground">
                  Member since <span className="font-medium text-foreground">{memberSince}</span>
                </p>
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <div className="space-y-1">
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/settings?tab=customization')} className="cursor-pointer">
              <Palette className="w-4 h-4 mr-2" />
              Customization
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)} className="cursor-pointer">
              <KeyRound className="w-4 h-4 mr-2" />
              {t('userMenu.changePassword')}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/user-guide')} className="cursor-pointer">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              {t('userMenu.logout')}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userMenu.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('userMenu.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border rounded-md space-y-3">
              <h3 className="font-medium">{t('userMenu.dialog.changeNow')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('userMenu.dialog.changeNowDescription')}
              </p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">{t('userMenu.dialog.newPassword')}</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('userMenu.dialog.newPasswordPlaceholder')}
                    minLength={6}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('userMenu.dialog.confirmPassword')}</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('userMenu.dialog.confirmPasswordPlaceholder')}
                    minLength={6}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? t('userMenu.dialog.updating') : t('userMenu.dialog.updatePassword')}
                </Button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('userMenu.dialog.or')}</span>
              </div>
            </div>

            <div className="p-4 border rounded-md space-y-3">
              <h3 className="font-medium">{t('userMenu.dialog.sendResetEmail')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('userMenu.dialog.sendResetEmailDescription')} <strong>{user.email}</strong>
              </p>
              <Button
                variant="outline"
                onClick={sendPasswordResetEmail}
                disabled={loading}
                className="w-full"
              >
                {loading ? t('userMenu.dialog.sending') : t('userMenu.dialog.sendEmail')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
