import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import { supabase } from '@/integrations/supabase/client';
import { X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const DebugHUD = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, session } = useAuth();
  const { accounts, activeAccount } = useAccount();
  const credits = useUploadCredits();
  const [buildStamp] = useState(new Date().toISOString());

  useEffect(() => {
    // Show HUD if ?debug=1 is in URL
    const params = new URLSearchParams(window.location.search);
    setIsVisible(params.get('debug') === '1');
  }, []);

  const copyState = () => {
    const state = {
      buildStamp,
      auth: {
        email: user?.email,
        sessionExpiry: session?.expires_at,
      },
      accounts: {
        count: accounts.length,
        activeAccountId: activeAccount?.id,
        activeAccountName: activeAccount?.name,
      },
      credits: {
        balance: credits.balance,
        used: credits.used,
        limit: credits.limit,
        extraPurchased: credits.extraPurchased,
        canUpload: credits.canUpload,
      },
    };
    
    console.log('[DebugHUD] State:', state);
    navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    toast.success('Debug state copied to clipboard');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-black/95 border border-primary/50 rounded-lg p-4 text-xs font-mono text-white shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-primary font-bold">🔍 Debug HUD</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-muted-foreground">Build:</span>{' '}
          <span className="text-green-400">{buildStamp.slice(11, 19)}</span>
        </div>

        <div className="border-t border-primary/20 pt-2">
          <div className="text-primary font-semibold mb-1">Auth</div>
          <div>
            <span className="text-muted-foreground">Email:</span>{' '}
            <span className="text-blue-400">{user?.email || 'None'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Session:</span>{' '}
            <span className={session ? 'text-green-400' : 'text-red-400'}>
              {session ? '✓ Active' : '✗ None'}
            </span>
          </div>
        </div>

        <div className="border-t border-primary/20 pt-2">
          <div className="text-primary font-semibold mb-1">Accounts</div>
          <div>
            <span className="text-muted-foreground">Count:</span>{' '}
            <span className="text-yellow-400">{accounts.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Active:</span>{' '}
            <span className="text-blue-400">
              {activeAccount?.name || 'None'}
            </span>
          </div>
        </div>

        <div className="border-t border-primary/20 pt-2">
          <div className="text-primary font-semibold mb-1">Credits</div>
          <div>
            <span className="text-muted-foreground">Balance:</span>{' '}
            <span className={credits.balance > 0 ? 'text-green-400' : 'text-red-400'}>
              {credits.balance}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Used / Limit:</span>{' '}
            <span className="text-yellow-400">
              {credits.used} / {credits.limit}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Can Upload:</span>{' '}
            <span className={credits.canUpload ? 'text-green-400' : 'text-red-400'}>
              {credits.canUpload ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 h-7 text-xs"
          onClick={copyState}
        >
          <Copy className="h-3 w-3 mr-2" />
          Copy State
        </Button>
      </div>
    </div>
  );
};
