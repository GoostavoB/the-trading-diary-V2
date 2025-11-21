import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, LogOut, KeyRound, Settings, Target, Crown, HelpCircle, Palette, Plus, Trash2, Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { IconPicker, getIconComponent } from '@/components/sub-account/IconPicker';
import { ColorPicker } from '@/components/sub-account/ColorPicker';

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

interface SubAccount {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export const UserAccountMenu = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { subAccounts, activeSubAccount, refreshSubAccounts } = useSubAccount();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [createSubAccountOpen, setCreateSubAccountOpen] = useState(false);
  const [editSubAccountOpen, setEditSubAccountOpen] = useState(false);
  const [deleteSubAccountId, setDeleteSubAccountId] = useState<string | null>(null);
  const [editingSubAccount, setEditingSubAccount] = useState<SubAccount | null>(null);
  const [newSubAccountName, setNewSubAccountName] = useState('');
  const [newSubAccountDesc, setNewSubAccountDesc] = useState('');
  const [newSubAccountIcon, setNewSubAccountIcon] = useState('Circle');
  const [newSubAccountColor, setNewSubAccountColor] = useState('hsl(221, 83%, 53%)');

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

  const handleCreateSubAccount = async () => {
    if (!user || !newSubAccountName.trim()) {
      toast.error('Nome da sub-conta é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sub_accounts')
        .insert({
          user_id: user.id,
          name: newSubAccountName,
          description: newSubAccountDesc || null,
          icon: newSubAccountIcon,
          color: newSubAccountColor,
          is_active: false,
        });

      if (error) throw error;

      toast.success('Sub-conta criada com sucesso!');
      setCreateSubAccountOpen(false);
      setNewSubAccountName('');
      setNewSubAccountDesc('');
      setNewSubAccountIcon('Circle');
      setNewSubAccountColor('hsl(221, 83%, 53%)');
      await refreshSubAccounts();
    } catch (error) {
      console.error('Error creating sub account:', error);
      toast.error('Erro ao criar sub-conta');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubAccount = async () => {
    if (!editingSubAccount || !newSubAccountName.trim()) return;

    try {
      const { error } = await supabase
        .from('sub_accounts')
        .update({
          name: newSubAccountName.trim(),
          description: newSubAccountDesc.trim() || null,
          icon: newSubAccountIcon,
          color: newSubAccountColor,
        })
        .eq('id', editingSubAccount.id);

      if (error) throw error;

      toast.success('Sub-account updated');
      setEditSubAccountOpen(false);
      setEditingSubAccount(null);
      setNewSubAccountName('');
      setNewSubAccountDesc('');
      setNewSubAccountIcon('Circle');
      setNewSubAccountColor('hsl(221, 83%, 53%)');
      await refreshSubAccounts();
    } catch (error) {
      console.error('Error updating sub-account:', error);
      toast.error('Failed to update sub-account');
    }
  };

  const handleDeleteSubAccount = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sub_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Sub-conta deletada com sucesso!');
      setDeleteSubAccountId(null);
      await refreshSubAccounts();
    } catch (error) {
      console.error('Error deleting sub account:', error);
      toast.error('Erro ao deletar sub-conta');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubAccount = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sub_accounts')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Sub-conta ativada!');
      // Recarregar a página para aplicar os dados da sub-conta
      window.location.reload();
    } catch (error) {
      console.error('Error activating sub account:', error);
      toast.error('Erro ao ativar sub-conta');
    } finally {
      setLoading(false);
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

          {/* Sub Accounts Section */}
          <div className="py-3 px-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Sub Accounts</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (subscriptionData?.plan_type === 'free') {
                    toast.info('Upgrade to Pro or Elite to create sub-accounts');
                    return;
                  }
                  setCreateSubAccountOpen(true);
                }}
                disabled={subscriptionData?.plan_type === 'free'}
                className={subscriptionData?.plan_type === 'free' ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Plus className="w-3 h-3 mr-1" />
                Create
              </Button>
            </div>

            {subAccounts.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {subAccounts.map((account) => {
                  const isActive = account.id === activeSubAccount?.id;
                  const isMainAccount = account.name === 'Main';
                  
                  return (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        isActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => !isActive && handleActivateSubAccount(account.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        {(() => {
                          const IconComponent = getIconComponent(account.icon || 'Circle');
                          return (
                            <div 
                              className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                              style={{ 
                                backgroundColor: account.color ? `${account.color}20` : 'hsl(var(--muted))',
                                color: account.color || 'hsl(var(--foreground))'
                              }}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                          );
                        })()}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{account.name}</p>
                              
                              {isMainAccount && (
                                <Badge variant="main" className="text-[10px] px-1.5 py-0">
                                  Main
                                </Badge>
                              )}
                            </div>
                          
                          {account.description && (
                            <p className="text-xs text-muted-foreground truncate">{account.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubAccount(account);
                            setNewSubAccountName(account.name);
                            setNewSubAccountDesc(account.description || '');
                            setNewSubAccountIcon(account.icon || 'Circle');
                            setNewSubAccountColor(account.color || 'hsl(221, 83%, 53%)');
                            setEditSubAccountOpen(true);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMainAccount) {
                              toast.error("Cannot delete Main account");
                              return;
                            }
                            setDeleteSubAccountId(account.id);
                          }}
                          disabled={isMainAccount}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No sub-accounts yet
              </p>
            )}
          </div>

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

      {/* Create Sub Account Dialog */}
      <Dialog open={createSubAccountOpen} onOpenChange={setCreateSubAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub Account</DialogTitle>
            <DialogDescription>
              Create a new sub-account with isolated data and metrics. Perfect for separating scalp trades, swing trades, or different strategies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Account Name *</label>
              <Input
                value={newSubAccountName}
                onChange={(e) => setNewSubAccountName(e.target.value)}
                placeholder="e.g., Scalping Account"
                className="mt-1"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={newSubAccountDesc}
                onChange={(e) => setNewSubAccountDesc(e.target.value)}
                placeholder="e.g., Short-term trades only"
                className="mt-1"
                maxLength={100}
              />
            </div>
            
            <IconPicker 
              selectedIcon={newSubAccountIcon}
              onSelectIcon={setNewSubAccountIcon}
              color={newSubAccountColor}
            />
            
            <ColorPicker
              selectedColor={newSubAccountColor}
              onSelectColor={setNewSubAccountColor}
            />
            
            <IconPicker 
              selectedIcon={newSubAccountIcon}
              onSelectIcon={setNewSubAccountIcon}
              color={newSubAccountColor}
            />
            
            <ColorPicker
              selectedColor={newSubAccountColor}
              onSelectColor={setNewSubAccountColor}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateSubAccountOpen(false);
                  setNewSubAccountName('');
                  setNewSubAccountDesc('');
                  setNewSubAccountIcon('Circle');
                  setNewSubAccountColor('hsl(221, 83%, 53%)');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubAccount}
                disabled={loading || !newSubAccountName.trim()}
              >
                {loading ? 'Creating...' : 'Create Sub Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sub Account Dialog */}
      <Dialog open={editSubAccountOpen} onOpenChange={setEditSubAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub Account</DialogTitle>
            <DialogDescription>
              Update the name and description of this sub-account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Account Name *</label>
              <Input
                value={newSubAccountName}
                onChange={(e) => setNewSubAccountName(e.target.value)}
                placeholder="e.g., Scalping Account"
                className="mt-1"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={newSubAccountDesc}
                onChange={(e) => setNewSubAccountDesc(e.target.value)}
                placeholder="e.g., Short-term trades only"
                className="mt-1"
                maxLength={100}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditSubAccountOpen(false);
                  setEditingSubAccount(null);
                  setNewSubAccountName('');
                  setNewSubAccountDesc('');
                  setNewSubAccountIcon('Circle');
                  setNewSubAccountColor('hsl(221, 83%, 53%)');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubAccount}
                disabled={loading || !newSubAccountName.trim()}
              >
                {loading ? 'Updating...' : 'Update Sub Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Sub Account Confirmation */}
      <AlertDialog open={!!deleteSubAccountId} onOpenChange={() => setDeleteSubAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sub Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data associated with this sub-account will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubAccountId && handleDeleteSubAccount(deleteSubAccountId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
