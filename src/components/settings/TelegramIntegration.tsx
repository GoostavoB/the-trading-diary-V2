import { useCallback, useEffect, useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, RefreshCw, Unlink } from 'lucide-react';

interface TelegramLink {
  telegram_username: string | null;
  linked_at: string;
}

interface TelegramPrefs {
  daily_digest: boolean;
  daily_digest_hour_local: number;
  weekly_digest: boolean;
  alert_on_trade_close: boolean;
}

const DEFAULT_PREFS: TelegramPrefs = {
  daily_digest: true,
  daily_digest_hour_local: 22,
  weekly_digest: true,
  alert_on_trade_close: true,
};

export const TelegramIntegration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [prefs, setPrefs] = useState<TelegramPrefs>(DEFAULT_PREFS);

  const fetchState = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: linkRow } = await supabase
        .from('telegram_users')
        .select('telegram_username, linked_at')
        .eq('user_id', user.id)
        .maybeSingle();
      setLink(linkRow);

      const { data: prefRow } = await supabase
        .from('telegram_preferences')
        .select('daily_digest, daily_digest_hour_local, weekly_digest, alert_on_trade_close')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prefRow) setPrefs(prefRow);
    } catch {
      // non-fatal: card renders in unlinked state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchState().catch(() => {});
  }, [fetchState]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-generate-link', {
        body: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: (navigator.language || 'en').slice(0, 2),
        },
      });
      if (error || !data?.deepLink) throw new Error(error?.message || 'No link returned');
      window.open(data.deepLink, '_blank', 'noopener');
      toast.info('Telegram opened — tap Start there, then come back and refresh.');
    } catch {
      toast.error('Could not generate the Telegram link. Try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    const { error } = await supabase.from('telegram_users').delete().eq('user_id', user.id);
    if (error) {
      toast.error('Could not disconnect. Try again.');
      return;
    }
    setLink(null);
    toast.success('Telegram disconnected. The bot will stay silent.');
  };

  const updatePref = async <K extends keyof TelegramPrefs>(key: K, value: TelegramPrefs[K]) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from('telegram_preferences')
      .upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) toast.error('Could not save the preference.');
  };

  return (
    <PremiumCard className="p-6 glass">
      <div className="flex items-start gap-4">
        <Send className="h-8 w-8 text-primary shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Telegram bot</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trade alerts, nightly digests and your stats — delivered where you already are.
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground mt-4">—</p>
          ) : !link ? (
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? 'Generating link…' : 'Connect Telegram'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fetchState().catch(() => {})}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm">
                Connected{link.telegram_username ? <> as <span className="font-medium">@{link.telegram_username}</span></> : null}
                {' · '}since {new Date(link.linked_at).toLocaleDateString()}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nightly digest</p>
                    <p className="text-sm text-muted-foreground">Daily recap of P&L, trades and lessons</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="bg-background border border-border rounded-md px-2 py-1 text-sm font-num"
                      value={prefs.daily_digest_hour_local}
                      onChange={(e) => updatePref('daily_digest_hour_local', Number(e.target.value))}
                      disabled={!prefs.daily_digest}
                      aria-label="Digest hour"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <Switch
                      checked={prefs.daily_digest}
                      onCheckedChange={(v) => updatePref('daily_digest', v)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly digest</p>
                    <p className="text-sm text-muted-foreground">Sunday recap of the week</p>
                  </div>
                  <Switch
                    checked={prefs.weekly_digest}
                    onCheckedChange={(v) => updatePref('weekly_digest', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trade-closed alerts</p>
                    <p className="text-sm text-muted-foreground">Ping when a trade you log today closes</p>
                  </div>
                  <Switch
                    checked={prefs.alert_on_trade_close}
                    onCheckedChange={(v) => updatePref('alert_on_trade_close', v)}
                  />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-1" /> Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
};
