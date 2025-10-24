import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ConnectExchangeModal } from '@/components/exchanges/ConnectExchangeModal';
import { SyncHistoryWidget } from '@/components/exchanges/SyncHistoryWidget';
import { TradePreviewModal } from '@/components/exchanges/TradePreviewModal';
import { SyncTradesDialog } from '@/components/exchanges/SyncTradesDialog';
import { ExchangeLogo } from '@/components/ExchangeLogo';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { SkipToContent } from '@/components/SkipToContent';

interface ExchangeConnection {
  id: string;
  exchange_name: string;
  is_active: boolean;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  created_at: string;
}

export default function ExchangeConnections() {
  const { t } = useTranslation();
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewConnectionId, setPreviewConnectionId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncConnectionId, setSyncConnectionId] = useState<string | null>(null);
  const [syncExchangeName, setSyncExchangeName] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['exchange-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExchangeConnection[];
    },
  });

  // Auto-detect and reset stuck syncs
  useEffect(() => {
    const checkStuckSyncs = async () => {
      const stuckConnections = connections.filter((conn) => {
        if (conn.sync_status !== 'syncing') return false;
        const updatedAt = new Date(conn.created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return updatedAt < fiveMinutesAgo;
      });

      for (const conn of stuckConnections) {
        console.log(`Resetting stuck sync for ${conn.exchange_name}`);
        await supabase
          .from('exchange_connections')
          .update({
            sync_status: 'error',
            sync_error: 'Sync timed out. Please try again.',
          })
          .eq('id', conn.id);
      }

      if (stuckConnections.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
        toast.error('Some syncs timed out. Please try again.');
      }
    };

    if (connections.length > 0) {
      checkStuckSyncs();
    }
  }, [connections, queryClient]);

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-exchange-trades`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            connectionId,
            mode: 'preview'
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      return { ...await response.json(), connectionId };
    },
    onSuccess: (data) => {
      toast.success(`Fetched ${data.tradesFetched} trades. Review and select which to import.`);
      setPreviewConnectionId(data.connectionId);
      setIsPreviewModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ connectionId, deleteTrades }: { connectionId: string; deleteTrades: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disconnect-exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ connectionId, deleteTrades }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Disconnect failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Exchange disconnected successfully');
      queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
    },
    onError: (error: Error) => {
      toast.error(`Disconnect failed: ${error.message}`);
    },
  });

  const exchanges = [
    {
      id: 'binance',
      name: 'Binance',
      description: t('exchanges.descriptions.binance'),
      comingSoon: false,
      sizeScale: 1.0, // No change
    },
    {
      id: 'bybit',
      name: 'Bybit',
      description: 'Leading derivatives exchange - sync spot & futures trades',
      comingSoon: false,
      sizeScale: 0.92, // -8%
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      description: 'US market leader - sync your trading activity',
      comingSoon: false,
      sizeScale: 0.86, // -14%
    },
    {
      id: 'kraken',
      name: 'Kraken',
      description: 'European leader - comprehensive trade history sync',
      comingSoon: false,
      sizeScale: 0.88, // -12%
    },
    {
      id: 'bitfinex',
      name: 'Bitfinex',
      description: 'OG exchange since 2012 - sync all your trades',
      comingSoon: false,
      sizeScale: 0.94, // -6%
    },
    {
      id: 'bingx',
      name: 'BingX',
      description: 'Copy trading platform - sync spot & futures',
      comingSoon: false,
      sizeScale: 0.96, // -4%
    },
    {
      id: 'mexc',
      name: 'MEXC',
      description: 'Altcoin specialist - sync your diverse portfolio',
      comingSoon: false,
      sizeScale: 0.90, // -10%
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      description: 'Popular in Asia - requires API passphrase',
      comingSoon: false,
      sizeScale: 0.97, // -3%
    },
    {
      id: 'okx',
      name: 'OKX',
      description: 'Major derivatives exchange - requires API passphrase',
      comingSoon: false,
      sizeScale: 1.06, // +6%
    },
    {
      id: 'gateio',
      name: 'Gate.io',
      description: 'Comprehensive trading platform - full sync support',
      comingSoon: false,
      sizeScale: 1.08, // +8%
    },
    {
      id: 'bitstamp',
      name: 'Bitstamp',
      description: 'Oldest exchange since 2011 - requires customer ID',
      comingSoon: false,
      sizeScale: 1.10, // +10%
    },
  ];

  const getConnection = (exchangeName: string) =>
    connections.find((c) => c.exchange_name === exchangeName);

  const handleConnect = (exchangeName: string) => {
    setSelectedExchange(exchangeName);
    setIsModalOpen(true);
  };

  const handleSync = (connectionId: string, exchangeName: string) => {
    setSyncConnectionId(connectionId);
    setSyncExchangeName(exchangeName);
    setIsSyncDialogOpen(true);
  };

  const handleSyncComplete = () => {
    // After fetching trades, open preview modal
    setPreviewConnectionId(syncConnectionId);
    setIsPreviewModalOpen(true);
  };

  const handleDisconnect = (connectionId: string) => {
    if (confirm('Are you sure you want to disconnect? This will not delete your synced trades.')) {
      disconnectMutation.mutate({ connectionId, deleteTrades: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className="container max-w-7xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold" id="exchanges-heading">{t('exchanges.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('exchanges.subtitle')}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
        {exchanges.map((exchange) => {
          const connection = getConnection(exchange.id);
          const isConnected = !!connection;
          const isSyncing = connection?.sync_status === 'syncing';

          return (
            <Card key={exchange.id} className="glass-card border-border/50">
              <CardHeader>
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
                      <div style={{ transform: `scale(${exchange.sizeScale})` }}>
                        <ExchangeLogo
                          exchangeId={exchange.id}
                          exchangeName={exchange.name}
                          size="lg"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {exchange.comingSoon && !isConnected && (
                          <Badge variant="secondary" className="text-xs">Soon</Badge>
                        )}
                      </div>
                      {isConnected && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`h-2 w-2 rounded-full ${
                            connection.sync_status === 'error' ? 'bg-destructive' :
                            connection.sync_status === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                            'bg-green-500'
                          }`} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {connection.sync_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">{exchange.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <>
                    <div className="text-sm space-y-1">
                      {connection.last_synced_at && (
                        <p className="text-muted-foreground">
                          Last synced:{' '}
                          {formatDistanceToNow(new Date(connection.last_synced_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                      {connection.sync_error && (
                        <p className="text-destructive text-xs">{connection.sync_error}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSync(connection.id, connection.exchange_name)}
                        disabled={isSyncing}
                        size="sm"
                        className="flex-1"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Trades
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDisconnect(connection.id)}
                        disabled={isSyncing || disconnectMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <Unplug className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button 
                    onClick={() => handleConnect(exchange.id)} 
                    className="w-full"
                    disabled={exchange.comingSoon}
                  >
                    Connect {exchange.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SyncHistoryWidget />

      <ConnectExchangeModal
        exchange={selectedExchange || 'bingx'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExchange(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
        }}
      />

      <SyncTradesDialog
        connectionId={syncConnectionId}
        exchangeName={syncExchangeName}
        isOpen={isSyncDialogOpen}
        onClose={() => {
          setIsSyncDialogOpen(false);
          setSyncConnectionId(null);
        }}
        onFetchComplete={handleSyncComplete}
      />

      <TradePreviewModal
        connectionId={previewConnectionId}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewConnectionId(null);
        }}
        onImportComplete={() => {
          setIsPreviewModalOpen(false);
          setPreviewConnectionId(null);
          queryClient.invalidateQueries({ queryKey: ['trades'] });
        }}
      />
      </main>
    </AppLayout>
  );
}
