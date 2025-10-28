import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { X, Plus, Edit2, Check, Upload, Download, User, Bell, TrendingUp, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { DataManagement } from '@/components/DataManagement';
import { CapitalManagement } from '@/components/CapitalManagement';
import { ThemeSelector } from '@/components/ThemeSelector';
import { CurrencySelector } from '@/components/settings/CurrencySelector';
import { BlurSettings } from '@/components/settings/BlurSettings';
import { SocialShareRewards } from '@/components/SocialShareRewards';
import { ReferralProgram } from '@/components/ReferralProgram';
import { useCalmMode } from '@/contexts/CalmModeContext';
import { SkipToContent } from '@/components/SkipToContent';

const Settings = () => {
  const { user } = useAuth();
  const { calmModeEnabled, soundEnabled, toggleCalmMode, toggleSound } = useCalmMode();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [settings, setSettings] = useState({ blur_enabled: false, sidebar_style: 'matte' });
  const [reminderIntensity, setReminderIntensity] = useState('normal');
  const [setups, setSetups] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [newSetupName, setNewSetupName] = useState('');
  const [newSetupColor, setNewSetupColor] = useState('#A18CFF');
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);
  const [editingSetupName, setEditingSetupName] = useState('');
  const [editingSetupColor, setEditingSetupColor] = useState('#A18CFF');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState({
    email_trades: true,
    email_milestones: true,
    email_weekly_summary: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSettings();
      fetchSetups();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile({ full_name: data.full_name || '', email: data.email || '' });
      setAvatarUrl(data.avatar_url || null);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setSettings({ 
        blur_enabled: data.blur_enabled, 
        sidebar_style: data.sidebar_style
      });
    }

    // Fetch reminder preferences
    const { data: xpData } = await supabase
      .from('user_xp_tiers')
      .select('reminder_intensity')
      .eq('user_id', user.id)
      .single();
    
    if (xpData) {
      setReminderIntensity(xpData.reminder_intensity || 'normal');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
      // Trigger profile update event to refresh UserMenu
      window.dispatchEvent(new Event('profileUpdated'));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;

    setUploading(true);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload avatar');
      setUploading(false);
      return;
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    if (urlData) {
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.signedUrl })
        .eq('id', user.id);

      if (updateError) {
        toast.error('Failed to update profile');
      } else {
        setAvatarUrl(urlData.signedUrl);
        toast.success('Avatar updated!');
      }
    }

    setUploading(false);
  };

  const handleExportData = async () => {
    if (!user) return;

    toast.info('Preparing export...');

    // Fetch all user trades
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (!trades) {
      toast.error('No data to export');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(trades[0]).filter(key => key !== 'user_id');
    const csv = [
      headers.join(','),
      ...trades.map(trade => 
        headers.map(header => {
          const value = trade[header as keyof typeof trade];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-export-${new Date().toISOString()}.csv`;
    a.click();

    toast.success('Data exported successfully!');
  };

  const handleToggleBlur = async (checked: boolean) => {
    if (!user) return;

    setSettings({ ...settings, blur_enabled: checked });
    
    const { error } = await supabase
      .from('user_settings')
      .update({ blur_enabled: checked })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update setting');
    } else {
      toast.success('Setting updated!');
    }
  };

  const fetchSetups = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (data && !error) {
      setSetups(data);
    }
  };

  const handleAddSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSetupName.trim()) return;

    const { error } = await supabase
      .from('user_setups')
      .insert({ user_id: user.id, name: newSetupName.trim(), color: newSetupColor });

    if (error) {
      if (error.code === '23505') {
        toast.error('This setup already exists');
      } else {
        toast.error('Failed to add setup');
      }
    } else {
      toast.success('Setup added!');
      setNewSetupName('');
      setNewSetupColor('#A18CFF');
      fetchSetups();
    }
  };

  const handleUpdateSetup = async (id: string) => {
    if (!editingSetupName.trim()) return;

    const { error } = await supabase
      .from('user_setups')
      .update({ name: editingSetupName.trim(), color: editingSetupColor })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        toast.error('This setup name already exists');
      } else {
        toast.error('Failed to update setup');
      }
    } else {
      toast.success('Setup updated!');
      setEditingSetupId(null);
      setEditingSetupName('');
      setEditingSetupColor('#A18CFF');
      fetchSetups();
    }
  };

  const handleDeleteSetup = async (id: string) => {
    const { error } = await supabase
      .from('user_setups')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete setup');
    } else {
      toast.success('Setup deleted!');
      fetchSetups();
    }
  };

  const startEditingSetup = (id: string, name: string, color: string) => {
    setEditingSetupId(id);
    setEditingSetupName(name);
    setEditingSetupColor(color || '#A18CFF');
  };

  const handleUpdateReminderIntensity = async (intensity: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_xp_tiers')
      .update({ reminder_intensity: intensity })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update reminder settings');
      console.error('Error updating reminder intensity:', error);
    } else {
      setReminderIntensity(intensity);
      
      // Clear cache to force refetch in useEngagementReminders
      sessionStorage.removeItem('daily_activity_cache');
      
      toast.success('Reminder settings updated!', {
        description: intensity === 'minimal' 
          ? 'You\'ll only see reminders if inactive for 2+ days' 
          : intensity === 'normal'
          ? 'You\'ll see welcome back toasts once per day'
          : 'You\'ll receive more frequent reminders'
      });
    }
  };

  return (
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-bold mb-2" id="settings-heading">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" aria-hidden="true" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="trading">
              <TrendingUp className="w-4 h-4 mr-2" aria-hidden="true" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="setups">
              <Edit2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Setups
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="data">
              <Download className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 glass">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={profile.email}
                    disabled
                    className="mt-1 opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <CapitalManagement />
          </TabsContent>

          <TabsContent value="setups" className="space-y-6">
            <Card className="p-6 glass">
              <h2 className="text-xl font-semibold mb-4">Trade Setups</h2>
              <p className="text-sm text-muted-foreground mb-4">Manage your custom trade setup tags. These will be available when logging trades.</p>
              
              <form onSubmit={handleAddSetup} className="mb-4">
                <div className="flex gap-2">
                  <Input
                    value={newSetupName}
                    onChange={(e) => setNewSetupName(e.target.value)}
                    placeholder="Enter new setup name (e.g., Breakout, Reversal)"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newSetupColor}
                    onChange={(e) => setNewSetupColor(e.target.value)}
                    className="w-12 h-10 rounded-md border border-border cursor-pointer"
                    title="Choose setup color"
                  />
                  <Button type="submit" disabled={!newSetupName.trim()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                {setups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No setups yet. Add your first setup above.
                  </p>
                ) : (
                  setups.map((setup) => (
                    <div key={setup.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      {editingSetupId === setup.id ? (
                        <>
                          <Input
                            value={editingSetupName}
                            onChange={(e) => setEditingSetupName(e.target.value)}
                            className="flex-1 h-8"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={editingSetupColor}
                            onChange={(e) => setEditingSetupColor(e.target.value)}
                            className="w-8 h-8 rounded-md border border-border cursor-pointer"
                            title="Choose setup color"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSetup(setup.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSetupId(null);
                              setEditingSetupName('');
                              setEditingSetupColor('#A18CFF');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge 
                            variant="secondary" 
                            className="flex-1 justify-start"
                            style={{ 
                              backgroundColor: setup.color || '#A18CFF',
                              color: 'white',
                              borderColor: setup.color || '#A18CFF'
                            }}
                          >
                            {setup.name}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingSetup(setup.id, setup.name, setup.color || '#A18CFF')}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSetup(setup.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>


      <TabsContent value="notifications" className="space-y-6">
        <Card className="p-6 glass">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose what updates you want to receive</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Trade Confirmations</p>
                <p className="text-sm text-muted-foreground">Get notified when trades are logged</p>
              </div>
              <Switch
                checked={notifications.email_trades}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, email_trades: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Milestone Alerts</p>
                <p className="text-sm text-muted-foreground">Celebrate when you hit profit milestones</p>
              </div>
              <Switch
                checked={notifications.email_milestones}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, email_milestones: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">Receive a weekly performance report</p>
              </div>
              <Switch
                checked={notifications.email_weekly_summary}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, email_weekly_summary: checked})
                }
              />
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-medium mb-2">Daily Engagement Reminders</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Control how often we remind you about incomplete daily goals
              </p>
              
              <Select value={reminderIntensity} onValueChange={handleUpdateReminderIntensity}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select reminder frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Minimal</span>
                      <span className="text-xs text-muted-foreground">
                        Only if inactive for 2+ days
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Normal (Recommended)</span>
                      <span className="text-xs text-muted-foreground">
                        Welcome back toast once per day
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="aggressive">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Aggressive</span>
                      <span className="text-xs text-muted-foreground">
                        Multiple reminders if goals incomplete
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Current setting:</strong> {reminderIntensity === 'minimal' ? 'You\'ll only see reminders if inactive' : reminderIntensity === 'normal' ? 'You\'ll see one reminder per day' : 'You\'ll see multiple reminders throughout the day'}
                </p>
              </div>
            </div>
          </div>
          </Card>
        </TabsContent>


        <TabsContent value="data" className="space-y-6">
        <Card className="p-6 glass">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Export Your Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your trading data in CSV format for use in other applications.
              </p>
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Trades to CSV
              </Button>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Contact support to delete your account
              </p>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  </main>
    </AppLayout>
  );
};

export default Settings;
