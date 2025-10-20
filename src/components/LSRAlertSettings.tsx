import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLSRNotifications } from '@/hooks/useLSRNotifications';
import { toast } from 'sonner';
import { Bell, TrendingUp, TrendingDown, ArrowUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT'];

interface AlertConfig {
  id?: string;
  symbol: string;
  alert_type: 'rapid_change' | 'cross_below_1' | 'cross_above_1';
  is_enabled: boolean;
  threshold_percentage?: number;
  direction?: 'up' | 'down' | 'both';
  cooldown_minutes: number;
}

interface AlertHistory {
  id: string;
  symbol: string;
  alert_type: string;
  ratio_value: number;
  change_percentage: number;
  direction: string;
  triggered_at: string;
}

export const LSRAlertSettings = () => {
  const { user } = useAuth();
  const { permission, requestPermission, isEnabled } = useLSRNotifications();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Default alert configs
  const defaultAlerts: AlertConfig[] = [
    {
      symbol: selectedSymbol,
      alert_type: 'rapid_change',
      is_enabled: false,
      threshold_percentage: 5,
      direction: 'both',
      cooldown_minutes: 60,
    },
    {
      symbol: selectedSymbol,
      alert_type: 'cross_below_1',
      is_enabled: false,
      cooldown_minutes: 60,
    },
    {
      symbol: selectedSymbol,
      alert_type: 'cross_above_1',
      is_enabled: false,
      cooldown_minutes: 60,
    },
  ];

  useEffect(() => {
    if (user) {
      loadAlerts();
      loadHistory();
    }
  }, [user, selectedSymbol]);

  const loadAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lsr_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', selectedSymbol);

    if (error) {
      console.error('Error loading alerts:', error);
      return;
    }

    if (data && data.length > 0) {
      setAlerts(data as AlertConfig[]);
    } else {
      setAlerts(defaultAlerts);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lsr_alert_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', selectedSymbol)
      .order('triggered_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading history:', error);
      return;
    }

    setHistory((data as AlertHistory[]) || []);
  };

  const saveAlert = async (alertConfig: AlertConfig) => {
    if (!user) return;

    setLoading(true);

    try {
      const alertData = {
        user_id: user.id,
        ...alertConfig,
      };

      if (alertConfig.id) {
        // Update existing
        const { error } = await supabase
          .from('lsr_alerts')
          .update(alertData)
          .eq('id', alertConfig.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('lsr_alerts')
          .insert(alertData);

        if (error) throw error;
      }

      toast.success('Alert settings saved');
      loadAlerts();
    } catch (error: any) {
      console.error('Error saving alert:', error);
      toast.error('Failed to save alert settings');
    } finally {
      setLoading(false);
    }
  };

  const updateAlert = (index: number, updates: Partial<AlertConfig>) => {
    const newAlerts = [...alerts];
    newAlerts[index] = { ...newAlerts[index], ...updates };
    setAlerts(newAlerts);
  };

  const testNotification = async () => {
    if (permission !== 'granted') {
      await requestPermission();
      return;
    }

    new Notification('🔔 Test Alert: ' + selectedSymbol, {
      body: 'This is a test notification for LSR alerts.\nRatio: 1.23 (+5.2%)',
      icon: '/favicon.png',
    });

    toast.success('Test notification sent!');
  };

  const saveAllAlerts = async () => {
    for (const alert of alerts) {
      await saveAlert(alert);
    }
  };

  const rapidChangeAlert = alerts.find(a => a.alert_type === 'rapid_change') || defaultAlerts[0];
  const crossBelowAlert = alerts.find(a => a.alert_type === 'cross_below_1') || defaultAlerts[1];
  const crossAboveAlert = alerts.find(a => a.alert_type === 'cross_above_1') || defaultAlerts[2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Long/Short Ratio Alerts</h2>
        <p className="text-muted-foreground">
          Get notified when market sentiment shifts dramatically
        </p>
      </div>

      {/* Notification Permission */}
      {permission !== 'granted' && (
        <Card className="border-neon-green/50 bg-neon-green/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-neon-green" />
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Allow browser notifications to receive real-time alerts
                  </p>
                </div>
              </div>
              <Button onClick={requestPermission} variant="default">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symbol Selector */}
      <div className="space-y-2">
        <Label>Select Symbol</Label>
        <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SYMBOLS.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
                {symbol.replace('USDT', '/USDT')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rapid Change Alert */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-neon-green/10 to-transparent blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-green/10">
                <TrendingUp className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <CardTitle>Rapid Change Alerts</CardTitle>
                <CardDescription>Get notified of sudden sentiment shifts</CardDescription>
              </div>
            </div>
            <Switch
              checked={rapidChangeAlert.is_enabled}
              onCheckedChange={(checked) => {
                const index = alerts.findIndex(a => a.alert_type === 'rapid_change');
                if (index >= 0) {
                  updateAlert(index, { is_enabled: checked });
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={rapidChangeAlert.direction}
              onValueChange={(value) => {
                const index = alerts.findIndex(a => a.alert_type === 'rapid_change');
                if (index >= 0) {
                  updateAlert(index, { direction: value as 'up' | 'down' | 'both' });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Both Directions
                  </div>
                </SelectItem>
                <SelectItem value="up">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    Up Only (Bullish)
                  </div>
                </SelectItem>
                <SelectItem value="down">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    Down Only (Bearish)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sensitivity</Label>
              <Badge variant="outline">{rapidChangeAlert.threshold_percentage}%</Badge>
            </div>
            <Slider
              value={[rapidChangeAlert.threshold_percentage || 5]}
              onValueChange={(value) => {
                const index = alerts.findIndex(a => a.alert_type === 'rapid_change');
                if (index >= 0) {
                  updateAlert(index, { threshold_percentage: value[0] });
                }
              }}
              min={2}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Alert when ratio changes by more than {rapidChangeAlert.threshold_percentage}%
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cooldown</Label>
              <Badge variant="outline">{rapidChangeAlert.cooldown_minutes} min</Badge>
            </div>
            <Slider
              value={[rapidChangeAlert.cooldown_minutes]}
              onValueChange={(value) => {
                const index = alerts.findIndex(a => a.alert_type === 'rapid_change');
                if (index >= 0) {
                  updateAlert(index, { cooldown_minutes: value[0] });
                }
              }}
              min={15}
              max={240}
              step={15}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cross Below 1.0 Alert */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <CardTitle>Cross Below 1.0 (Bearish)</CardTitle>
                <CardDescription>Alert when sentiment turns bearish</CardDescription>
              </div>
            </div>
            <Switch
              checked={crossBelowAlert.is_enabled}
              onCheckedChange={(checked) => {
                const index = alerts.findIndex(a => a.alert_type === 'cross_below_1');
                if (index >= 0) {
                  updateAlert(index, { is_enabled: checked });
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cooldown</Label>
              <Badge variant="outline">{crossBelowAlert.cooldown_minutes} min</Badge>
            </div>
            <Slider
              value={[crossBelowAlert.cooldown_minutes]}
              onValueChange={(value) => {
                const index = alerts.findIndex(a => a.alert_type === 'cross_below_1');
                if (index >= 0) {
                  updateAlert(index, { cooldown_minutes: value[0] });
                }
              }}
              min={15}
              max={240}
              step={15}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cross Above 1.0 Alert */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-neon-green/10 to-transparent blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-green/10">
                <TrendingUp className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <CardTitle>Cross Above 1.0 (Bullish)</CardTitle>
                <CardDescription>Alert when sentiment turns bullish</CardDescription>
              </div>
            </div>
            <Switch
              checked={crossAboveAlert.is_enabled}
              onCheckedChange={(checked) => {
                const index = alerts.findIndex(a => a.alert_type === 'cross_above_1');
                if (index >= 0) {
                  updateAlert(index, { is_enabled: checked });
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cooldown</Label>
              <Badge variant="outline">{crossAboveAlert.cooldown_minutes} min</Badge>
            </div>
            <Slider
              value={[crossAboveAlert.cooldown_minutes]}
              onValueChange={(value) => {
                const index = alerts.findIndex(a => a.alert_type === 'cross_above_1');
                if (index >= 0) {
                  updateAlert(index, { cooldown_minutes: value[0] });
                }
              }}
              min={15}
              max={240}
              step={15}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={saveAllAlerts} disabled={loading || !user} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
        <Button onClick={testNotification} variant="outline">
          Test Alert
        </Button>
      </div>

      {/* Alert History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Last 10 triggered alerts for {selectedSymbol}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {alert.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-neon-green" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {alert.alert_type === 'rapid_change' && 'Rapid Change'}
                        {alert.alert_type === 'cross_below_1' && 'Crossed Below 1.0'}
                        {alert.alert_type === 'cross_above_1' && 'Crossed Above 1.0'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.triggered_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {alert.ratio_value.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.change_percentage > 0 ? '+' : ''}
                      {alert.change_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
