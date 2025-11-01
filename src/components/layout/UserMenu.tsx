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
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, LogOut, KeyRound, Coins, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import { useAccount } from '@/contexts/AccountContext';

const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const UserMenu = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { balance, limit } = useUploadCredits();
  const { accounts, activeAccount, switchAccount } = useAccount();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Fetch profile name from database
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    };

    fetchProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  const handleLogout = async () => {
    console.log('[UserMenu] Logout clicked');
    try {
      await signOut();
      toast.success(t('auth.toast.signOutSuccess'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === activeAccount?.id) return;
    
    try {
      await switchAccount(accountId);
      toast.success('Account switched successfully');
    } catch (error) {
      toast.error('Failed to switch account');
    }
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
        toast.success(t('userMenu.dialog.success'));
        setChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        // Sign out and redirect to login
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

  if (!user) return null;

  // Get display name from profile, user metadata, or email
  const displayName = profileName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">{t('userMenu.hello')}, {displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{t('userMenu.myAccount')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* User Email */}
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Credits Display */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Upload Credits</span>
              </div>
              <span className="text-sm font-bold">{balance} / {limit}</span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="w-full mt-1 h-auto p-1 text-xs"
              onClick={() => navigate('/pricing')}
            >
              {balance < 5 ? 'Buy More Credits' : 'Manage Credits'}
            </Button>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Account Switcher Section */}
          {accounts.length > 1 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Accounts ({accounts.length})
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => handleSwitchAccount(account.id)}
                    className="gap-2"
                  >
                    {account.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                    )}
                    <span className="flex-1 truncate">{account.name}</span>
                    {account.id === activeAccount?.id && (
                      <span className="text-xs text-primary">Active</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/settings/accounts')}>
                <ChevronRight className="w-4 h-4 mr-2" />
                Manage Accounts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Settings */}
          <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            {t('userMenu.changePassword')}
          </DropdownMenuItem>
          
          {/* Logout */}
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            {t('userMenu.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
