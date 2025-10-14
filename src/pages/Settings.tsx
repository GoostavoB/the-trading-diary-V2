import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [settings, setSettings] = useState({ blur_enabled: false, sidebar_style: 'matte' });

  useEffect(() => {
    fetchProfile();
    fetchSettings();
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
      setSettings({ blur_enabled: data.blur_enabled, sidebar_style: data.sidebar_style });
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
    }
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
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

        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Blur Sensitive Data</p>
                <p className="text-sm text-muted-foreground">Hide financial numbers by default</p>
              </div>
              <Switch
                checked={settings.blur_enabled}
                onCheckedChange={handleToggleBlur}
              />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
