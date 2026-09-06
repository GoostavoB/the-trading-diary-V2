import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FlaskConical, Pencil, Trash2, User, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSetupLibrary, useSignedSetupImages, TradingSetup } from '@/hooks/useSetupLibrary';
import { SetupForm } from '@/components/setups/SetupForm';
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

const useSetupPerformance = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['setup-performance', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('setup, pnl')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .not('setup', 'is', null);
      if (error) throw error;

      const bySetup: Record<string, { trades: number; wins: number; totalPnl: number }> = {};
      for (const row of data || []) {
        const name = row.setup as string;
        if (!bySetup[name]) bySetup[name] = { trades: 0, wins: 0, totalPnl: 0 };
        bySetup[name].trades += 1;
        const pnl = row.pnl || 0;
        if (pnl > 0) bySetup[name].wins += 1;
        bySetup[name].totalPnl += pnl;
      }
      return bySetup;
    },
  });
};

const SetupCard = ({
  setup,
  stats,
  onEdit,
  onDelete,
}: {
  setup: TradingSetup;
  stats?: { trades: number; wins: number; totalPnl: number };
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const signedUrls = useSignedSetupImages(setup.image_urls.slice(0, 1));
  const cover = setup.image_urls[0] ? signedUrls[setup.image_urls[0]] : undefined;
  const winRate = stats && stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : null;

  return (
    <PremiumCard className="p-0 overflow-hidden flex flex-col">
      {cover ? (
        <img src={cover} alt={setup.name} className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-muted/40 flex items-center justify-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{setup.name}</h3>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Edit setup">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} aria-label="Delete setup">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {setup.author && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{setup.author}</span>
          )}
          {setup.timeframe && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{setup.timeframe}</span>
          )}
        </div>

        {setup.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{setup.description}</p>
        )}

        {setup.indicators.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {setup.indicators.map((ind) => (
              <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-border/50 flex items-center justify-between">
          {stats && stats.trades > 0 ? (
            <>
              <div className="text-xs text-muted-foreground">{stats.trades} trade{stats.trades !== 1 ? 's' : ''}</div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{winRate}% win rate</span>
                <span className={`flex items-center gap-1 font-medium ${stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.totalPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No trades linked yet</div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
};

export default function SetupLab() {
  const { user } = useAuth();
  const { setups, loading, saveSetup, deleteSetup, uploadImage } = useSetupLibrary();
  const { data: performance } = useSetupPerformance(user?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <AppLayout>
      <SEO title="Setup Lab" description="Document your trading setups and track their real performance" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" />
              Setup Lab
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Document your setups, link them to trades, and track their real performance.
            </p>
          </div>
          <Button onClick={() => { setEditingSetup(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New setup
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading setups…</div>
        ) : setups.length === 0 ? (
          <PremiumCard className="p-10 text-center">
            <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">No setups yet. Document your first one to start tracking its real win rate.</p>
            <Button onClick={() => { setEditingSetup(null); setFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first setup
            </Button>
          </PremiumCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setups.map((setup) => (
              <SetupCard
                key={setup.id}
                setup={setup}
                stats={performance?.[setup.name]}
                onEdit={() => { setEditingSetup(setup); setFormOpen(true); }}
                onDelete={() => setDeletingId(setup.id)}
              />
            ))}
          </div>
        )}
      </div>

      <SetupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        setup={editingSetup}
        onSave={saveSetup}
        onUploadImage={uploadImage}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this setup?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your library. Trades already tagged with this setup name are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) deleteSetup(deletingId); setDeletingId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
