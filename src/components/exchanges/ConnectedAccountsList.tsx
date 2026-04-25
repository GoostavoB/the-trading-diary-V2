import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2, CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { SnapTradeService } from '@/services/exchanges/aggregator/SnapTradeService';
import type { AggregatorConnection } from '@/types/aggregator';
import { cn } from '@/lib/utils';

interface ConnectedAccountsListProps {
  /** Set by parent's QuickConnect.onConnected to nudge the list to refetch. */
  refreshKey?: number;
}

const StatusChip = ({ status }: { status: AggregatorConnection['status'] }) => {
  const config: Record<AggregatorConnection['status'], { label: string; cls: string; Icon: React.ElementType }> = {
    active:          { label: 'Active',         cls: 'chip-green',    Icon: CheckCircle2 },
    syncing:         { label: 'Syncing…',       cls: 'chip-electric', Icon: Loader2 },
    pending:         { label: 'Pending',        cls: 'chip',          Icon: Clock },
    requires_reauth: { label: 'Reauth needed',  cls: 'chip-orange',   Icon: AlertTriangle },
    error:           { label: 'Error',          cls: 'chip-red',      Icon: AlertTriangle },
    disconnected:    { label: 'Disconnected',   cls: 'chip',          Icon: AlertTriangle },
  };
  const { label, cls, Icon } = config[status];
  return (
    <span className={cn('chip', cls)}>
      <Icon className={cn('h-3 w-3', status === 'syncing' && 'animate-spin')} />
      {label}
    </span>
  );
};

export function ConnectedAccountsList({ refreshKey = 0 }: ConnectedAccountsListProps) {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: connections = [], isLoading, refetch } = useQuery({
    queryKey: ['aggregator-connections', refreshKey],
    queryFn: () => SnapTradeService.listConnections(),
    refetchInterval: 15000, // poll while page is open so newly-added show up
  });

  // Auto-refetch when parent's refreshKey changes
  useEffect(() => { if (refreshKey > 0) refetch(); }, [refreshKey, refetch]);

  const handleSync = useCallback(async (c: AggregatorConnection) => {
    setBusyId(c.id);
    try {
      const result = await SnapTradeService.syncTrades({ connectionId: c.connection_id });
      if (result.errors.length) {
        toast.warning(`Synced with ${result.errors.length} warnings — ${result.imported} imported`);
      } else {
        toast.success(`Synced ${result.imported} trade(s) from ${c.broker_label || c.broker_slug}`);
      }
      qc.invalidateQueries({ queryKey: ['aggregator-connections'] });
      qc.invalidateQueries({ queryKey: ['trades'] });
    } catch (err) {
      toast.error((err as Error).message || 'Sync failed');
    } finally {
      setBusyId(null);
    }
  }, [qc]);

  const handleDisconnect = useCallback(async (c: AggregatorConnection) => {
    const confirmed = window.confirm(
      `Disconnect ${c.broker_label || c.broker_slug}?\n\nYour trade history stays. You can reconnect anytime.`,
    );
    if (!confirmed) return;

    setBusyId(c.id);
    try {
      await SnapTradeService.disconnect(c.connection_id);
      toast.success('Disconnected');
      qc.invalidateQueries({ queryKey: ['aggregator-connections'] });
    } catch (err) {
      toast.error((err as Error).message || 'Disconnect failed');
    } finally {
      setBusyId(null);
    }
  }, [qc]);

  if (isLoading) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-2 text-sm text-space-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading connected accounts...
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return null; // Empty state handled by parent (the QuickConnect block IS the empty state)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-space-100">
          Connected accounts
        </h3>
        <span className="text-xs text-space-400 tabular-nums">
          {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
        </span>
      </div>

      <div className="grid gap-3">
        {connections.map((c) => {
          const isBusy = busyId === c.id;
          const lastSync = c.last_synced_at
            ? new Date(c.last_synced_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
            : 'never';

          return (
            <div
              key={c.id}
              className="card-premium p-4 flex items-center gap-4"
            >
              {/* Logo */}
              <div className="h-10 w-10 rounded-ios bg-space-600 flex items-center justify-center shrink-0 overflow-hidden border border-space-500/40">
                {c.meta?.logo ? (
                  <img src={c.meta.logo} alt={c.broker_label || c.broker_slug}
                    className="h-7 w-7 object-contain" />
                ) : (
                  <span className="font-num text-xs text-space-200">
                    {(c.broker_label || c.broker_slug).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-space-100 truncate">
                    {c.broker_label || c.broker_slug}
                  </span>
                  <StatusChip status={c.status} />
                </div>
                <div className="text-xs text-space-400 tabular-nums mt-0.5">
                  Last sync: <span className="text-space-300">{lastSync}</span>
                  {c.trade_count > 0 && (
                    <> · {c.trade_count} trade{c.trade_count === 1 ? '' : 's'}</>
                  )}
                </div>
                {c.last_error && (
                  <div className="text-xs text-apple-red mt-1 truncate">
                    {c.last_error}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSync(c)}
                  disabled={isBusy}
                  className="btn-secondary !h-9 !px-3 text-xs disabled:opacity-50"
                  title="Sync trades now"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect(c)}
                  disabled={isBusy}
                  className="btn-secondary !h-9 !px-3 text-xs !text-apple-red hover:!bg-apple-red/10 disabled:opacity-50"
                  title="Disconnect"
                  aria-label="Disconnect"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
