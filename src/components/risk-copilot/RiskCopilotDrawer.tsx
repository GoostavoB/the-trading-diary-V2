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
  const rc = useRiskCopilot();
  const { medals } = useMonthlyMedals();
  const { formatAmount } = useCurrency();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [floorInput, setFloorInput] = useState('');
  const [ceilingInput, setCeilingInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  const openSettings = () => {
    setFloorInput(String(rc.floorPct));
    setCeilingInput(String(rc.ceilingPct));
    setGoalInput(String(rc.monthlyGoal));
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    await rc.updateKellyRange(parseFloat(floorInput) || 0, parseFloat(ceilingInput) || 0);
    await rc.updateMonthlyGoal(parseFloat(goalInput) || 0);
    toast.success('Configurações de risco salvas');
    setSettingsOpen(false);
  };

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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Risk Copilot
            </SheetTitle>
            {settingsOpen ? null : (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </SheetHeader>

          {rc.loading ? (
            <div className="text-sm text-muted-foreground text-center py-12">Carregando...</div>
          ) : settingsOpen ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Configurações de Risco</h3>
              <div className="space-y-1.5">
                <Label className="text-xs">Risco Piso % (Modo Defesa)</Label>
                <Input type="number" value={floorInput} onChange={(e) => setFloorInput(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Risco Teto % (Modo Sniper — máx 12%)</Label>
                <Input type="number" value={ceilingInput} onChange={(e) => setCeilingInput(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Mensal</Label>
                <Input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={saveSettings}>Salvar</Button>
              </div>
            </div>
          ) : (
            <>
              {/* BLOCK 1: Status & Stop Autorizado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Win Rate (últimos {rc.sampleSize || 20} trades)
                  </div>
                  <Badge variant="outline" className={cn('font-mono text-xs', TIER_COLOR[rc.tier])}>
                    {rc.tierLabel}
                  </Badge>
                </div>
                <div className={cn('text-3xl font-extrabold font-mono', TIER_COLOR[rc.tier])}>
                  {rc.winRate.toFixed(0)}%
                </div>
                {rc.bias && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted/40 border border-border rounded-md px-2.5 py-1">
                    {rc.bias.side === 'long' ? <TrendingUp className="h-3 w-3 text-apple-green" /> : <TrendingDown className="h-3 w-3 text-apple-red" />}
                    Maior assertividade em: {rc.bias.side === 'long' ? 'LONG' : 'SHORT'} ({rc.bias.winRate.toFixed(0)}%)
                  </div>
                )}
                {rc.tier === 'red' && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive leading-relaxed">{rc.tierMessage}</p>
                  </div>
                )}
                <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-1">
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Stop Autorizado Hoje
                  </div>
                  <div className={cn('text-4xl font-extrabold font-mono', TIER_COLOR[rc.tier])}>
                    {formatAmount(rc.authorizedStopDollar)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">({rc.authorizedStopPct.toFixed(1)}%)</div>
                  {rc.tier !== 'red' && (
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Lembrete: Alvo 1 = Parcial + Stop no 0x0 (Break Even)
                    </p>
                  )}
                </div>
              </div>

              <RiskProfileStrip
                capitalBase={rc.isGorduraActive ? rc.gorduraAmount : rc.capitalBase}
                formatAmount={formatAmount}
              />

              {/* BLOCK 2: Monitor de Meta & Gordurinha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Meta Mensal</span>
                  <span className="font-mono font-semibold">
                    {formatAmount(rc.monthlyProfit)} / {formatAmount(rc.monthlyGoal)}
                  </span>
                </div>
                <Progress value={rc.monthlyGoalPct} className="h-2" />
                {rc.isGorduraActive && (
                  <div className="rounded-lg border border-apple-orange/30 bg-gradient-to-r from-apple-orange/10 to-apple-purple/10 p-3 flex items-center gap-2.5">
                    <Trophy className="h-5 w-5 text-apple-orange shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-apple-orange">Meta Batida!</div>
                      <div className="text-[11px] text-muted-foreground">
                        Gordura Operacional Livre: <span className="font-mono font-semibold text-foreground">{formatAmount(rc.gorduraAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOCK 3: Gestão de Caixa Ativa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Capital de Trade Atual</span>
                  <span className="text-lg font-bold font-mono">{formatAmount(rc.capitalBase)}</span>
                </div>
                <div className="flex gap-2">
                  <CapitalAdjustPopover mode="add" capitalBase={rc.capitalBase} onConfirm={rc.addCapital} formatAmount={formatAmount} />
                  <CapitalAdjustPopover mode="remove" capitalBase={rc.capitalBase} onConfirm={rc.addCapital} formatAmount={formatAmount} />
                </div>
              </div>

              {/* BLOCK 4: Quadro de Medalhas */}
              {medals.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Quadro de Medalhas</Label>
                  <div className="flex gap-2 flex-wrap">
                    {medals.map((m) => (
                      <div key={m.id} className="flex flex-col items-center gap-0.5 bg-muted/30 rounded-lg px-2.5 py-2 border border-border">
                        <span className="text-lg leading-none">{MEDAL_EMOJI[m.medal]}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.monthLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
