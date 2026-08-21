import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassphrase, setApiPassphrase] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [syncStartDate, setSyncStartDate] = useState(todayStr);
  const [includeSpot, setIncludeSpot] = useState(true);
  const [includeSwap, setIncludeSwap] = useState(true);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const marketTypes = [
        ...(includeSpot ? ['spot'] : []),
        ...(includeSwap ? ['swap'] : []),
      ];

      const { data, error } = await supabase.functions.invoke('connect-exchange', {
        body: {
          exchange,
          apiKey,
          apiSecret,
          apiPassphrase: apiPassphrase || undefined,
          syncStartDate: new Date(syncStartDate).toISOString(),
          marketTypes: marketTypes.length > 0 ? marketTypes : undefined,
        },
      });

      if (error) throw new Error(error.message || 'Connection failed');

      return data;
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
      toast.error(t('exchanges.connect.fillAllFields'));
      return;
    }
    connectMutation.mutate();
  };

  const exchangeInfo: Record<string, { name: string; docsUrl: string; requiresPassphrase?: boolean; passphraseLabel?: string }> = {
    binance: { name: 'Binance', docsUrl: 'https://www.binance.com/en/support/faq/detail/360002502072' },
    bingx: { name: 'BingX', docsUrl: 'https://bingx.com/en/wiki/detail/api' },
    bybit: { name: 'Bybit', docsUrl: 'https://www.bybit.com/en/help-center/article/How-to-create-your-API-key' },
    mexc: { name: 'MEXC', docsUrl: 'https://www.mexc.com/user/openapi' },
    coinbase: { name: 'Coinbase', docsUrl: 'https://docs.cloud.coinbase.com/exchange/docs' },
    kraken: { name: 'Kraken', docsUrl: 'https://docs.kraken.com/rest/' },
    bitfinex: { name: 'Bitfinex', docsUrl: 'https://docs.bitfinex.com/docs' },
    kucoin: { name: 'KuCoin', docsUrl: 'https://docs.kucoin.com/', requiresPassphrase: true, passphraseLabel: 'API Passphrase' },
    okx: { name: 'OKX', docsUrl: 'https://www.okx.com/docs-v5/en/', requiresPassphrase: true, passphraseLabel: 'API Passphrase' },
    gateio: { name: 'Gate.io', docsUrl: 'https://www.gate.io/docs/developers/apiv4' },
    bitstamp: { name: 'Bitstamp', docsUrl: 'https://www.bitstamp.net/api/', requiresPassphrase: true, passphraseLabel: 'Customer ID' },
  };

  const info = exchangeInfo[exchange] || { name: exchange, docsUrl: '#' };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exchanges.connect.title')} {info.name}</DialogTitle>
          <DialogDescription>
            {t('exchanges.connect.description', { exchange: info.name })}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">{t('exchanges.connect.securityNotice')}</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t('exchanges.connect.readOnlyKeys')}</li>
              <li>{t('exchanges.connect.neverGrant')}</li>
              <li>{t('exchanges.connect.encrypted')}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">{t('exchanges.connect.apiKey')} *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('exchanges.connect.enterApiKey')}
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
            <Label htmlFor="apiSecret">{t('exchanges.connect.apiSecret')} *</Label>
            <div className="relative">
              <Input
                id="apiSecret"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={t('exchanges.connect.enterApiSecret')}
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

          {info.requiresPassphrase && (
            <div className="space-y-2">
              <Label htmlFor="apiPassphrase">{info.passphraseLabel} *</Label>
              <div className="relative">
                <Input
                  id="apiPassphrase"
                  type={showPassphrase ? 'text' : 'password'}
                  value={apiPassphrase}
                  onChange={(e) => setApiPassphrase(e.target.value)}
                  placeholder={t('exchanges.connect.enterPassphrase')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                >
                  {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="syncStartDate">Import trades starting from *</Label>
            <Input
              id="syncStartDate"
              type="date"
              value={syncStartDate}
              max={todayStr}
              onChange={(e) => setSyncStartDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Trades before this date are never imported, on this sync or any future sync. You can
              change this later from the connection settings.
            </p>
          </div>

          {exchange === 'bingx' && (
            <div className="space-y-2">
              <Label>Markets to sync</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeSpot"
                  checked={includeSpot}
                  onCheckedChange={(checked) => setIncludeSpot(checked === true)}
                />
                <Label htmlFor="includeSpot" className="font-normal text-sm">Spot</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeSwap"
                  checked={includeSwap}
                  onCheckedChange={(checked) => setIncludeSwap(checked === true)}
                />
                <Label htmlFor="includeSwap" className="font-normal text-sm">
                  Perpetual futures (swap)
                </Label>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => window.open(info.docsUrl, '_blank')}
          >
            {t('exchanges.connect.howToGet', { exchange: info.name })}
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={connectMutation.isPending}
              className="flex-1"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('exchanges.connect.testing')}
                </>
              ) : (
                t('exchanges.connect.connect')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
