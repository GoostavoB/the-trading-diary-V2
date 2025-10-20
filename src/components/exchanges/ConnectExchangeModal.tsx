import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectExchangeModalProps {
  exchange: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectExchangeModal({
  exchange,
  isOpen,
  onClose,
  onSuccess,
}: ConnectExchangeModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            exchange,
            apiKey,
            apiSecret,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`Successfully connected to ${exchange}`);
      setApiKey('');
      setApiSecret('');
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) {
      toast.error('Please fill in all fields');
      return;
    }
    connectMutation.mutate();
  };

  const exchangeInfo: Record<string, { name: string; docsUrl: string }> = {
    binance: {
      name: 'Binance',
      docsUrl: 'https://www.binance.com/en/support/faq/detail/360002502072',
    },
    bingx: {
      name: 'BingX',
      docsUrl: 'https://bingx.com/en/wiki/detail/api',
    },
    bybit: {
      name: 'Bybit',
      docsUrl: 'https://www.bybit.com/en/help-center/article/How-to-create-your-API-key',
    },
    mexc: {
      name: 'MEXC',
      docsUrl: 'https://www.mexc.com/user/openapi',
    },
  };

  const info = exchangeInfo[exchange] || { name: exchange, docsUrl: '#' };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to {info.name}</DialogTitle>
          <DialogDescription>
            Enter your {info.name} API credentials to sync your trades automatically
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">Important Security Notice:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Only use read-only API keys</li>
              <li>Never grant trading, withdrawal, or transfer permissions</li>
              <li>Your credentials are encrypted and stored securely</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret *</Label>
            <div className="relative">
              <Input
                id="apiSecret"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => window.open(info.docsUrl, '_blank')}
          >
            How to get {info.name} API keys
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={connectMutation.isPending}
              className="flex-1"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
