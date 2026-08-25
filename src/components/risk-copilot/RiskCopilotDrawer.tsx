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

function GoalProgressBar({
  pct,
  profit,
  goal,
  formatAmount,
}: {
  pct: number;
  profit: number;
  goal: number;
  formatAmount: (n: number) => string;
}) {
  const barColor =
    pct <= 0 ? 'bg-muted-foreground/20' :
    pct < 70 ? 'bg-apple-red' :
    pct < 90 ? 'bg-apple-orange' :
    pct < 100 ? 'bg-apple-cyan' :
    'bg-apple-green';
  const markers = [
    { threshold: 70, emoji: MEDAL_EMOJI.bronze },
    { threshold: 90, emoji: MEDAL_EMOJI.silver },
    { threshold: 100, emoji: MEDAL_EMOJI.gold },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
          <Target className="h-4 w-4" /> Monthly Goal
          <InfoTooltip text="Track this month's profit against your goal. Once you hit 100%, your base capital gets locked and protected — you can only risk the extra profit (the buffer), keeping your gains safe. The dots mark Bronze (70%), Silver (90%) and Gold (100%)." />
        </div>
        <span className="text-sm font-mono font-semibold">
          {formatAmount(profit)} <span className="text-muted-foreground">/ {formatAmount(goal)}</span>
        </span>
      </div>
      <div className="relative pt-4 pb-1">
        <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
        {goal > 0 && markers.map((m) => (
          <div
            key={m.threshold}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${m.threshold}%` }}
          >
            <span className={cn('text-base leading-none transition-opacity', pct >= m.threshold ? 'opacity-100' : 'opacity-25 grayscale')}>
              {m.emoji}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground font-mono text-center">
        {pct.toFixed(0)}% of goal
      </div>
    </div>
  );
}

function GordurinhaCard({
  isActive,
  amount,
  formatAmount,
}: {
  isActive: boolean;
  amount: number;
  formatAmount: (n: number) => string;
}) {
  if (isActive) {
    return (
      <div className="rounded-xl border border-apple-orange/30 bg-gradient-to-r from-apple-orange/10 to-apple-purple/10 p-4 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-apple-orange shrink-0" />
        <div>
          <div className="text-sm font-bold text-apple-orange">Goal hit — bonus buffer unlocked!</div>
          <div className="text-xs text-muted-foreground">
            Free risk capital: <span className="font-mono font-semibold text-foreground">{formatAmount(amount)}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex items-center gap-3 opacity-70">
      <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
      <div>
        <div className="text-xs font-semibold text-muted-foreground">Bonus buffer locked</div>
        <div className="text-[11px] text-muted-foreground">Hit your monthly goal to unlock extra risk from your free profit.</div>
      </div>
    </div>
  );
}

function MedalsBoard({ medals }: { medals: { id: string; medal: string; monthLabel: string; pct_achieved: number }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => medals.length > 0 && setExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-semibold cursor-pointer">Medal Board</Label>
          <InfoTooltip text="Earn a Bronze, Silver or Gold medal each month based on how much of your goal you hit (70%/90%/100%). Medals are permanent. Tap to see your month-by-month history." />
        </div>
        {medals.length > 0 && (
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        )}
      </button>
      {medals.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {medals.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-0.5 bg-muted/30 rounded-lg px-3 py-2 border border-border">
              <span className="text-xl leading-none">{MEDAL_EMOJI[m.medal]}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{m.monthLabel}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          {(['bronze', 'silver', 'gold'] as const).map((m) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5 bg-muted/10 rounded-lg px-3 py-3 border border-dashed border-border opacity-40">
              <span className="text-xl leading-none grayscale">{MEDAL_EMOJI[m]}</span>
              <span className="text-[10px] text-muted-foreground">{MEDAL_LABEL[m]}</span>
            </div>
          ))}
        </div>
      )}
      {medals.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center">Close your first goal-hit month to start your collection.</p>
      )}
      {expanded && medals.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {medals.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 border border-border">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{MEDAL_EMOJI[m.medal]}</span>
                <span className="text-sm font-medium">{m.monthLabel}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{m.pct_achieved.toFixed(0)}% of goal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskProfileCardsStrip({
  profiles,
  selectedId,
  onSelect,
  capitalBase,
  formatAmount,
}: {
  profiles: RiskProfile[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  capitalBase: number;
  formatAmount: (n: number) => string;
}) {
  const sorted = [...profiles].sort((a, b) => (Number(b.is_favorite) - Number(a.is_favorite)) || a.sort_order - b.sort_order);
  if (sorted.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {sorted.map((p) => {
        const isSelected = selectedId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(isSelected ? null : p.id)}
            className={cn(
              'text-left rounded-xl border p-3 transition-all',
              isSelected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold truncate flex items-center gap-1">
                {p.is_favorite && <Star className="h-3 w-3 text-apple-orange shrink-0" fill="currentColor" />}
                {p.name}
              </span>
            </div>
            <div className={cn('text-lg font-bold font-mono mt-1', isSelected ? 'text-primary' : 'text-foreground')}>
              {p.risk_pct}%
            </div>
            {isSelected && (
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                Stop: {formatAmount((capitalBase * p.risk_pct) / 100)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WinRateControl({
  mode,
  manualPct,
  realPct,
  sampleSize,
  canUseReal,
  onChange,
}: {
  mode: 'manual' | 'real';
  manualPct: number;
  realPct: number;
  sampleSize: number;
  canUseReal: boolean;
  onChange: (mode: 'manual' | 'real', manualPct?: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(manualPct);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-mono">
        <button
          type="button"
          className={cn('px-2 py-1', mode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          onClick={() => onChange('manual')}
        >
          Manual
        </button>
        <button
          type="button"
          disabled={!canUseReal}
          className={cn(
            'px-2 py-1 border-l border-border',
            mode === 'real' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            !canUseReal && 'opacity-30 cursor-not-allowed'
          )}
          onClick={() => canUseReal && onChange('real')}
          title={canUseReal ? `Real: ${realPct.toFixed(0)}% (${sampleSize} trades)` : 'Needs 4+ closed trades'}
        >
          Real
        </button>
      </div>
      {mode === 'manual' && (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(manualPct); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Pencil className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3" align="end">
            <Label className="text-xs text-muted-foreground">Manual Win Rate</Label>
            <div className="text-center text-2xl font-bold font-mono">{draft}%</div>
            <Slider value={[draft]} onValueChange={(v) => setDraft(v[0])} min={0} max={100} step={1} />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => { onChange('manual', draft); setOpen(false); }}>
              Save
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function RiskCopilotDrawer() {
  const rc = useRiskCopilot();
  const { medals } = useMonthlyMedals();
  const { profiles, createProfile, deleteProfile, toggleFavorite, moveProfile } = useRiskProfiles();
  const { formatAmount } = useCurrency();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [floorInput, setFloorInput] = useState(5);
  const [ceilingInput, setCeilingInput] = useState(10);
  const [goalInput, setGoalInput] = useState('');

  const openSettings = () => {
    setFloorInput(rc.floorPct);
    setCeilingInput(rc.ceilingPct);
    setGoalInput(String(rc.monthlyGoal));
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    await rc.updateKellyRange(floorInput, ceilingInput);
    await rc.updateMonthlyGoal(parseFloat(goalInput) || 0);
    toast.success('Risk settings saved');
    setSettingsOpen(false);
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || null;
  const displayedStopBase = rc.isGorduraActive ? rc.gorduraAmount : rc.capitalBase;
  const displayedRiskPct = selectedProfile ? selectedProfile.risk_pct : rc.authorizedStopPct;
  const displayedStopDollar = selectedProfile ? (displayedStopBase * selectedProfile.risk_pct) / 100 : rc.authorizedStopDollar;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="hidden md:flex fixed bottom-6 right-6 z-40 h-12 rounded-full shadow-lg gap-2 px-5 font-semibold"
          size="lg"
        >
          <Shield className="h-4 w-4" />
          Risk Copilot
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="dark w-full sm:max-w-xl overflow-y-auto p-0 bg-background/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9),-24px_0_70px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="p-6 space-y-7">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Risk Copilot
            </SheetTitle>
            {!settingsOpen && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={openSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </SheetHeader>
          {rc.loading ? (
            <div className="text-sm text-muted-foreground text-center py-12">Loading...</div>
          ) : settingsOpen ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Risk Settings</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-semibold">Floor Risk (Defense Mode)</Label>
                    <InfoTooltip text="The minimum position size (as % of capital) the system authorizes when your win rate is weak (60-69%). Protects you from overtrading in a rough patch." />
                  </div>
                  <span className="text-sm font-mono font-bold text-apple-orange">{floorInput}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Minimum risk used when your win rate is weak.</p>
                <Slider value={[floorInput]} onValueChange={(v) => setFloorInput(v[0])} min={0} max={12} step={0.5} />
              </div>
              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-semibold">Ceiling Risk (Sniper Elite Mode)</Label>
                    <InfoTooltip text="The maximum position size (as % of capital) the system ever authorizes, even at your best win rate (80%+). Hard-capped at 12% so a hot streak can't turn into overconfidence." />
                  </div>
                  <span className="text-sm font-mono font-bold text-apple-green">{ceilingInput}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Maximum risk authorized when your win rate is strong. Hard cap: 12%.</p>
                <Slider value={[ceilingInput]} onValueChange={(v) => setCeilingInput(v[0])} min={floorInput} max={12} step={0.5} />
              </div>
              <div className="space-y-2 rounded-xl border border-border p-4">
                <Label className="text-sm font-semibold">Monthly Goal</Label>
                <Input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="0.00" />
              </div>
              <Button className="w-full" onClick={saveSettings}>Save Settings</Button>
              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-sm font-semibold">Risk Profiles</Label>
                <RiskProfileManager
                  profiles={profiles}
                  createProfile={createProfile}
                  deleteProfile={deleteProfile}
                  toggleFavorite={toggleFavorite}
                  moveProfile={moveProfile}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                    Win Rate
                    <InfoTooltip text="Your authorized stop size scales automatically with your win rate: below 60% = no risk (Red Alert), 60-69% = Defense (floor risk), 70-79% = Standard (scales up), 80%+ = Sniper Elite (ceiling risk)." />
                  </div>
                  <Badge variant="outline" className={cn('font-mono text-xs', TIER_COLOR[rc.tier])}>
                    {rc.tierLabel}
                  </Badge>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className={cn('text-5xl font-extrabold font-mono leading-none', TIER_COLOR[rc.tier])}>
                    {rc.winRate.toFixed(0)}%
                  </div>
                  <div className="flex items-center gap-1">
                    <WinRateControl
                      mode={rc.winRateMode}
                      manualPct={rc.manualWinRatePct}
                      realPct={rc.realWinRate}
                      sampleSize={rc.sampleSize}
                      canUseReal={rc.canUseRealWinRate}
                      onChange={rc.updateWinRateMode}
                    />
                    <InfoTooltip text="Manual: you set your own win rate — starts at 70%. Real: calculated automatically from your last 20 closed trades (needs 4+ trades)." />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {rc.winRateMode === 'real'
                    ? `Real — based on ${rc.sampleSize} closed trades`
                    : rc.canUseRealWinRate
                      ? 'Manual — you have enough trades to switch to Real'
                      : `Manual — ${4 - rc.sampleSize} more trade(s) to unlock Real`}
                </div>
                {rc.bias && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted/40 border border-border rounded-md px-2.5 py-1.5">
                    {rc.bias.side === 'long' ? <TrendingUp className="h-3.5 w-3.5 text-apple-green" /> : <TrendingDown className="h-3.5 w-3.5 text-apple-red" />}
                    Higher win rate on: {rc.bias.side === 'long' ? 'LONG' : 'SHORT'} ({rc.bias.winRate.toFixed(0)}%)
                  </div>
                )}
                {rc.tier === 'red' && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive leading-relaxed">{rc.tierMessage}</p>
                  </div>
                )}
                <div className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-muted/10 p-6 text-center space-y-1.5">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {selectedProfile ? `Stop with "${selectedProfile.name}" profile` : 'Authorized Stop Today'}
                  </div>
                  <div className={cn('text-5xl font-extrabold font-mono', selectedProfile ? 'text-primary' : TIER_COLOR[rc.tier])}>
                    {formatAmount(displayedStopDollar)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">({displayedRiskPct.toFixed(1)}%)</div>
                  {rc.tier !== 'red' && (
                    <p className="text-xs text-muted-foreground pt-1.5 flex items-center justify-center gap-1">
                      <Info className="h-3 w-3" /> Target 1 = Partial + Move Stop to Breakeven
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-semibold">Risk Profiles</Label>
                    <InfoTooltip text="Save your own risk % presets (e.g. Scalp 2%, Swing 5%). Tap one to instantly see your stop size for that setup." />
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={openSettings}>
                    <Pencil className="h-3 w-3" /> Manage
                  </Button>
                </div>
                <RiskProfileCardsStrip
                  profiles={profiles}
                  selectedId={selectedProfileId}
                  onSelect={setSelectedProfileId}
                  capitalBase={displayedStopBase}
                  formatAmount={formatAmount}
                />
                {profiles.length === 0 && (
                  <button
                    onClick={openSettings}
                    className="w-full rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    + Create your first risk profile (Scalp, Swing, High Risk...)
                  </button>
                )}
              </div>
              <GoalProgressBar pct={rc.monthlyGoalPct} profit={rc.monthlyProfit} goal={rc.monthlyGoal} formatAmount={formatAmount} />
              <GordurinhaCard isActive={rc.isGorduraActive} amount={rc.gorduraAmount} formatAmount={formatAmount} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Current Trading Capital</span>
                  <span className="text-xl font-bold font-mono">{formatAmount(rc.capitalBase)}</span>
                </div>
                <div className="flex gap-2">
                  <CapitalAdjustPopover mode="add" capitalBase={rc.capitalBase} onConfirm={rc.addCapital} formatAmount={formatAmount} />
                  <CapitalAdjustPopover mode="remove" capitalBase={rc.capitalBase} onConfirm={rc.addCapital} formatAmount={formatAmount} />
                </div>
              </div>
              <MedalsBoard medals={medals} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
