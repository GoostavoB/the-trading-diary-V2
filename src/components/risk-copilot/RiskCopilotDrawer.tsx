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
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, Settings, Plus, Minus, Star, ChevronUp, ChevronDown, X,
  TrendingUp, TrendingDown, Trophy, AlertTriangle, Pencil, Check,
  Lock, Sparkles, Target, Info, HelpCircle,
} from 'lucide-react';
import { useRiskCopilot } from '@/hooks/useRiskCopilot';
import { useRiskProfiles, RiskProfile } from '@/hooks/useRiskProfiles';
import { useMonthlyMedals } from '@/hooks/useMonthlyMedals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TIER_COLOR: Record<string, string> = {
  red: 'text-destructive',
  defense: 'text-apple-orange',
  standard: 'text-[#f5c542]',
  sniper: 'text-apple-green',
};

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const MEDAL_LABEL: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function InfoTooltip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded-full text-muted-foreground/60 hover:text-foreground shrink-0 inline-flex items-center justify-center"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs leading-relaxed" align="start" onClick={(e) => e.stopPropagation()}>
        {text}
      </PopoverContent>
    </Popover>
  );
}

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
      toast.success(mode === 'add' ? 'Capital added' : 'Capital removed');
      setOpen(false);
      setExact('');
      setPct(30);
    } catch {
      toast.error('Failed to update capital');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={mode === 'add' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5">
          {mode === 'add' ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {mode === 'add' ? 'Add' : 'Remove'} Capital
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4" align="center">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {mode === 'add' ? 'Add' : 'Remove'} % of current capital
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
          <Label className="text-xs text-muted-foreground">Or exact amount</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={exact}
            onChange={(e) => setExact(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <span className="text-xs text-muted-foreground">New capital: </span>
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
          Confirm {mode === 'add' ? 'Addition' : 'Removal'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function RiskProfileManager({
  profiles,
  createProfile,
  deleteProfile,
  toggleFavorite,
  moveProfile,
}: {
  profiles: RiskProfile[];
  createProfile: (name: string, riskPct: number) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  moveProfile: (id: string, direction: 'up' | 'down') => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [newPct, setNewPct] = useState('');
  const sorted = [...profiles].sort((a, b) => (Number(b.is_favorite) - Number(a.is_favorite)) || a.sort_order - b.sort_order);

  const handleCreate = async () => {
    const pct = parseFloat(newPct);
    if (!newName.trim() || !pct || pct <= 0) return;
    await createProfile(newName.trim(), pct);
    setNewName('');
    setNewPct('');
  };

  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 rounded-xl border border-dashed border-border">
          No profiles yet. Create one below — e.g. "Scalp" 2%, "Swing" 5%, "High Risk" 8%.
        </p>
      )}
      {sorted.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
          <div className="flex flex-col gap-0.5">
            <button
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20"
              disabled={i === 0}
              onClick={() => moveProfile(p.id, 'up')}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20"
              disabled={i === sorted.length - 1}
              onClick={() => moveProfile(p.id, 'down')}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{p.risk_pct}% risk per trade</div>
          </div>
          <button
            className={cn('h-8 w-8 flex items-center justify-center rounded-lg shrink-0', p.is_favorite ? 'text-apple-orange bg-apple-orange/10' : 'text-muted-foreground hover:text-apple-orange hover:bg-muted')}
            onClick={() => toggleFavorite(p.id, !p.is_favorite)}
          >
            <Star className="h-4 w-4" fill={p.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center rounded-lg shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => deleteProfile(p.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="rounded-xl border border-border p-3 space-y-2 bg-card">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">New profile</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Name (e.g. Scalp High Risk)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 text-sm flex-[2]"
          />
          <Input
            type="number"
            placeholder="%"
            value={newPct}
            onChange={(e) => setNewPct(e.target.value)}
            className="h-9 text-sm flex-1"
          />
        </div>
        <Button size="sm" className="w-full h-9 gap-1.5" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5" /> Add Profile
        </Button>
      </div>
    </div>
  );
}

export function RiskCopilotDrawer() {
  return null;
}
