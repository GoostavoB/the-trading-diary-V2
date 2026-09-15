import { useMemo, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FlaskConical, Plus, Pencil, Trash2, AlertTriangle, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { SetupForm } from '@/components/setups/SetupForm';
import { TradingSetup, useSetupLibrary, useSignedSetupImages } from '@/hooks/useSetupLibrary';
import type { Trade } from '@/types/trade';

const formatCurrency = (value: number) =>
  `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface SetupStats {
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

const SetupImages = ({ paths }: { paths: string[] }) => {
  const urls = useSignedSetupImages(paths);
  if (paths.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {paths.map((path) => (
        <a
          key={path}
          href={urls[path] || '#'}
          target="_blank"
          rel="noreferrer"
          className="h-20 w-32 rounded-lg overflow-hidden border border-border block"
        >
          {urls[path] ? (
            <img src={path} alt="Setup example chart" className="hidden" />
          ) : null}
          {urls[path] ? (
            <img src={urls[path]} alt="Setup example chart" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted animate-pulse" />
          )}
        </a>
      ))}
    </div>
  );
};

export default function SetupLab() {
  const { user } = useAuth();
  const { setups, loading, saveSetup, deleteSetup, uploadImage } = useSetupLibrary();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TradingSetup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: trades = [] } = useQuery({
    queryKey: ['setup-lab-trades', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return (data || []) as unknown as Trade[];
    },
  });

  const statsBySetup = useMemo(() => {
    const map = new Map<string, SetupStats>();

    setups.forEach((setup) => {
      const key = setup.name.toLowerCase();
      const matching = trades.filter((trade) => {
        const single = (trade.setup || '').toLowerCase();
        const tags = (trade.setup_tags || []).map((t) => (t || '').toLowerCase());
        return single === key || tags.includes(key);
      });

      const totalPnl = matching.reduce((sum, t) => sum + Number(t.profit_loss ?? t.pnl ?? 0), 0);
      const wins = matching.filter((t) => Number(t.profit_loss ?? t.pnl ?? 0) > 0).length;
      const losses = matching.filter((t) => Number(t.profit_loss ?? t.pnl ?? 0) < 0).length;

      map.set(setup.id, {
        trades: matching.length,
        wins,
        losses,
        winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
        totalPnl,
        avgPnl: matching.length > 0 ? totalPnl / matching.length : 0,
      });
    });

    return map;
  }, [setups, trades]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (setup: TradingSetup) => {
    setEditing(setup);
    setFormOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" />
              Setup Lab
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your setup library — rules, indicators, example charts and live performance.
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New setup
          </Button>
        </div>

        {loading ? (
          <PremiumCard className="p-6 glass">
            <p className="text-sm text-muted-foreground">Loading setups…</p>
          </PremiumCard>
        ) : setups.length === 0 ? (
          <PremiumCard className="p-10 glass text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg mb-1">No setups yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Document a setup once, then tag your trades with it to track how it performs.
            </p>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first setup
            </Button>
          </PremiumCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {setups.map((setup) => {
              const stats = statsBySetup.get(setup.id);
              const hasTrades = !!stats && stats.trades > 0;

              return (
                <PremiumCard key={setup.id} className="p-5 glass">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{setup.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {setup.author || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {setup.timeframe || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(setup)} aria-label="Edit setup">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingId(setup.id)}
                        aria-label="Delete setup"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {setup.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {setup.indicators.map((indicator) => (
                        <Badge key={indicator} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {setup.description && (
                    <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{setup.description}</p>
                  )}

                  {setup.entry_rules.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Entry rules</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {setup.entry_rules.map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {setup.pitfalls && (
                    <div className="mt-3 rounded-lg border border-apple-orange/30 bg-apple-orange/10 p-3">
                      <p className="text-xs font-medium flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-apple-orange" />
                        Notes and pitfalls
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{setup.pitfalls}</p>
                    </div>
                  )}

                  <SetupImages paths={setup.image_urls} />

                  <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/60">
                    <div>
                      <p className="text-xs text-muted-foreground">Trades</p>
                      <p className="font-num tabular-nums font-semibold">{stats?.trades ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Win rate</p>
                      <p className="font-num tabular-nums font-semibold">
                        {hasTrades ? `${stats!.winRate.toFixed(1)}%` : <span className="text-space-400">—</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg P&amp;L</p>
                      <p
                        className={cn(
                          'font-num tabular-nums font-semibold',
                          hasTrades && (stats!.avgPnl >= 0 ? 'text-apple-green' : 'text-apple-red')
                        )}
                      >
                        {hasTrades ? formatCurrency(stats!.avgPnl) : <span className="text-space-400">—</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total P&amp;L</p>
                      <p
                        className={cn(
                          'font-num tabular-nums font-semibold',
                          hasTrades && (stats!.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red')
                        )}
                      >
                        {hasTrades ? formatCurrency(stats!.totalPnl) : <span className="text-space-400">—</span>}
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              );
            })}
          </div>
        )}
      </div>

      <SetupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        setup={editing}
        onSave={saveSetup}
        onUploadImage={uploadImage}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this setup?</AlertDialogTitle>
            <AlertDialogDescription>
              Trades already tagged with this setup keep their tag text, but the documentation is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) deleteSetup(deletingId);
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
