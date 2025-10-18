import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Mail, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NotificationSettings {
  email_notifications: boolean;
  trade_reminders: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
  performance_alerts: boolean;
  event_reminders: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    trade_reminders: true,
    weekly_summary: true,
    monthly_report: true,
    performance_alerts: true,
    event_reminders: true,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          email_notifications: data.email_notifications ?? true,
          trade_reminders: data.trade_reminders ?? true,
          weekly_summary: data.weekly_summary ?? true,
          monthly_report: data.monthly_report ?? true,
          performance_alerts: data.performance_alerts ?? true,
          event_reminders: data.event_reminders ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-muted-foreground">Loading notification settings...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize how and when you receive notifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Trade Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="space-y-0.5">
                <Label htmlFor="trade-reminders" className="text-base font-medium cursor-pointer">
                  Trade Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminders to log your trades daily
                </p>
              </div>
            </div>
            <Switch
              id="trade-reminders"
              checked={settings.trade_reminders}
              onCheckedChange={(checked) => updateSetting('trade_reminders', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>

        <Separator />

        {/* Weekly Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              <div className="space-y-0.5">
                <Label htmlFor="weekly-summary" className="text-base font-medium cursor-pointer">
                  Weekly Performance Summary
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly recap of your trading performance
                </p>
              </div>
            </div>
            <Switch
              id="weekly-summary"
              checked={settings.weekly_summary}
              onCheckedChange={(checked) => updateSetting('weekly_summary', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>

        <Separator />

        {/* Monthly Report */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="space-y-0.5">
                <Label htmlFor="monthly-report" className="text-base font-medium cursor-pointer">
                  Monthly Report
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive detailed monthly trading analytics
                </p>
              </div>
            </div>
            <Switch
              id="monthly-report"
              checked={settings.monthly_report}
              onCheckedChange={(checked) => updateSetting('monthly_report', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>

        <Separator />

        {/* Performance Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div className="space-y-0.5">
                <Label htmlFor="performance-alerts" className="text-base font-medium cursor-pointer">
                  Performance Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about significant changes in your performance
                </p>
              </div>
            </div>
            <Switch
              id="performance-alerts"
              checked={settings.performance_alerts}
              onCheckedChange={(checked) => updateSetting('performance_alerts', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>

        <Separator />

        {/* Event Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <div className="space-y-0.5">
                <Label htmlFor="event-reminders" className="text-base font-medium cursor-pointer">
                  Economic Event Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for important economic calendar events
                </p>
              </div>
            </div>
            <Switch
              id="event-reminders"
              checked={settings.event_reminders}
              onCheckedChange={(checked) => updateSetting('event_reminders', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </Card>
  );
};
