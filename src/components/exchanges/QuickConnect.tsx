import { useState } from 'react';
import { Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SnapTradeService } from '@/services/exchanges/aggregator/SnapTradeService';
import { SUPPORTED_BROKERS } from '@/types/aggregator';
import { cn } from '@/lib/utils';

interface QuickConnectProps {
  onConnected?: () => void;
}

/**
 * Big "Connect with one click" hero. Opens SnapTrade's hosted Connection
 * Portal in a popup. When user finishes (or cancels), we refetch connections.
 *
 * Flow:
 *   1. Ensure SnapTrade user exists (registerUser is idempotent)
 *   2. Get redirect URI (with optional preselected broker)
 *   3. Open in popup
 *   4. Poll/listen for popup close → call onConnected to refresh list
 */
export function QuickConnect({ onConnected }: QuickConnectProps) {
  const [loadingBroker, setLoadingBroker] = useState<string | null>(null);

  const handleConnect = async (brokerSlug?: string) => {
    setLoadingBroker(brokerSlug || 'any');
    try {
      // 1. Ensure SnapTrade user is registered
      await SnapTradeService.registerUser();

      // 2. Get the connection portal URL
      const { redirectURI } = await SnapTradeService.getConnectPortalUrl({
        broker: brokerSlug,
        redirect: `${window.location.origin}/exchanges?connected=1`,
      });

      // 3. Open in popup (centered)
      const w = 540;
      const h = 720;
      const left = (window.screen.width - w) / 2;
      const top = (window.screen.height - h) / 2;
      const popup = window.open(
        redirectURI,
        'snaptrade-connect',
        `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0`,
      );

      if (!popup) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      // 4. Poll for close
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          setLoadingBroker(null);
          toast.success('Connection ready! Refreshing your accounts...');
          onConnected?.();
        }
      }, 600);
    } catch (err) {
      console.error('[QuickConnect]', err);
      toast.error((err as Error).message || 'Could not start connection flow');
      setLoadingBroker(null);
    }
  };

  return (
    <div className="card-premium-highlight p-6 md:p-8 ring-gradient-electric rounded-ios-card">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="chip chip-electric h-10 w-10 flex items-center justify-center !p-0 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-electric leading-tight">
            Connect in one click
          </h2>
          <p className="text-sm text-space-300 mt-1.5 max-w-md">
            Skip the API-key dance. Sign in to your exchange, and we automatically
            sync your trades — read-only, encrypted, revocable anytime.
          </p>
        </div>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-apple-green shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-space-100">Read-only</div>
            <div className="text-[11px] text-space-300">Cannot trade or move funds</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-electric shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-space-100">Auto-sync</div>
            <div className="text-[11px] text-space-300">New trades pulled automatically</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-apple-purple shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-space-100">No keys</div>
            <div className="text-[11px] text-space-300">Login flow handled by SnapTrade</div>
          </div>
        </div>
      </div>

      {/* Big primary CTA */}
      <button
        type="button"
        onClick={() => handleConnect()}
        disabled={loadingBroker !== null}
        className="btn-primary w-full h-12 text-base mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingBroker === 'any' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening secure connection...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Connect an exchange
          </>
        )}
      </button>

      {/* Quick brokers grid */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-space-400 font-medium">
          Or jump straight to
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SUPPORTED_BROKERS.map((b) => (
            <button
              key={b.slug}
              type="button"
              onClick={() => handleConnect(b.slug)}
              disabled={loadingBroker !== null}
              className={cn(
                'glass-thin rounded-ios px-3 py-2.5 flex flex-col items-center gap-1',
                'text-[11px] font-medium text-space-200',
                'hover:bg-white/8 hover:border-electric/40 transition-all',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
              title={`Connect ${b.label}`}
            >
              {loadingBroker === b.slug ? (
                <Loader2 className="h-5 w-5 animate-spin text-electric" />
              ) : (
                <img
                  src={b.logo}
                  alt={b.label}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="truncate w-full text-center">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-5 text-[11px] text-space-400 leading-relaxed">
        Powered by SnapTrade. Your credentials are never seen by The Trading Diary —
        SnapTrade handles authentication and only shares trade history with us.
        Disconnect any time from this page.
      </p>
    </div>
  );
}
