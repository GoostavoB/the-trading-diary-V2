import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, Settings, Plus, Minus, Star, ChevronUp, ChevronDown, X,
  TrendingUp, TrendingDown, Trophy, AlertTriangle, Pencil, Check,
} from 'lucide-react';
import { useRiskCopilot } from '@/hooks/useRiskCopilot';
import { useRiskProfiles } from '@/hooks/useRiskProfiles';
import { useMonthlyMedals } from '@/hooks/useMonthlyMedals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TIER_COLOR: Record<string, string> = {
  red: 'text-destructive',
  defense: 'text-apple-orange',
  standard: 'text-primary',
  sniper: 'text-apple-green',
};

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

function CapitalAdjustPopover({
  mode,
  capitalBase,
  onConfirm,
  formatAmount,
}: {
  mode: 'add' | 'remove';
  capitalBase: number;
  onConfirm: (amount: number) => Promise<void>;
  formatAmount: (n: number) => string;
}) {
  const [pct, setPct] = useState(30);
  const [exact, setExact] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const computedAmount = exact ? parseFloat(exact) || 0 : (capitalBase * pct) / 100;

  const handleConfirm = async () => {
    if (computedAmount <= 0) return;
    setSubmitting(true);
    try {
      await onConfirm(mode === 'add' ? computedAmount : -computedAmount);
      toast.success(mode === 'add' ? 'Capital adicionado' : 'Capital removido');
      setOpen(false);
      setExact('');
      setPct(30);
    } catch {
      toast.error('Erro ao atualizar capital');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={mode === 'add' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5">
          {mode === 'add' ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {mode === 'add' ? 'Adicionar' : 'Remover'} Capital
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4" align="center">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {mode === 'add' ? 'Adicionar' : 'Remover'} % do capital atual
          </Label>
          <Slider
            value={[pct]}
            onValueChange={(v) => { setPct(v[0]); setExact(''); }}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex gap-1.5">
            {[30, 50, 100].map((snap) => (
              <Button
                key={snap}
                type="button"
                variant={pct === snap && !exact ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => { setPct(snap); setExact(''); }}
              >
                {snap}%
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ou valor exato</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={exact}
            onChange={(e) => setExact(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <span className="text-xs text-muted-foreground">Novo capital: </span>
          <span className="text-sm font-bold font-mono">
            {formatAmount(mode === 'add' ? capitalBase + computedAmount : capitalBase - computedAmount)}
          </span>
        </div>
        <Button
          className="w-full"
          size="sm"
          disabled={computedAmount <= 0 || submitting}
          onClick={handleConfirm}
        >
          Confirmar {mode === 'add' ? 'Adição' : 'Remoção'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function RiskProfileStrip({ capitalBase, formatAmount }: { capitalBase: number; formatAmount: (n: number) => string }) {
  const { profiles, createProfile, deleteProfile, toggleFavorite, moveProfile } = useRiskProfiles();
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPct, setNewPct] = useState('');

  const sorted = [...profiles].sort((a, b) => (Number(b.is_favorite) - Number(a.is_favorite)) || a.sort_order - b.sort_order);
  const selected = sorted.find((p) => p.id === selectedId);

  const handleCreate = async () => {
    const pct = parseFloat(newPct);
    if (!newName.trim() || !pct || pct <= 0) return;
    await createProfile(newName.trim(), pct);
    setNewName('');
    setNewPct('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Perfis de Risco</Label>
        <Popover open={manageOpen} onOpenChange={setManageOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
              <Pencil className="h-3 w-3" /> Gerenciar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-3" align="end">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sorted.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum perfil salvo ainda.</p>
              )}
              {sorted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1.5">
                  <div className="flex flex-col">
                    <button
                      className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
                      disabled={i === 0}
                      onClick={() => moveProfile(p.id, 'up')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
                      disabled={i === sorted.length - 1}
                      onClick={() => moveProfile(p.id, 'down')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.risk_pct}% de risco</div>
                  </div>
                  <button
                    className={cn('h-6 w-6 flex items-center justify-center shrink-0', p.is_favorite ? 'text-apple-orange' : 'text-muted-foreground hover:text-apple-orange')}
                    onClick={() => toggleFavorite(p.id, !p.is_favorite)}
                  >
                    <Star className="h-3.5 w-3.5" fill={p.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="h-6 w-6 flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteProfile(p.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Novo perfil</Label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Nome (ex: Scalp Alto Risco)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-xs flex-[2]"
                />
                <Input
                  type="number"
                  placeholder="%"
                  value={newPct}
                  onChange={(e) => setNewPct(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
              <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={handleCreate}>
                <Check className="h-3 w-3" /> Salvar Perfil
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {sorted.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
              className={cn(
                'shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedId === p.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 border-border text-foreground hover:border-primary/40'
              )}
            >
              {p.is_favorite && <Star className="h-3 w-3" fill="currentColor" />}
              {p.name}
              <span className="opacity-70 font-mono">{p.risk_pct}%</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">Stop com o perfil "{selected.name}"</div>
            <div className="text-lg font-bold font-mono text-primary">
              {formatAmount((capitalBase * selected.risk_pct) / 100)}
            </div>
          </div>
          <Badge variant="outline" className="font-mono">{selected.risk_pct}%</Badge>
        </div>
      )}
    </div>
  );
}

export function RiskCopilotDrawer() {
  return null;
}
