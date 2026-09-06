import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Target, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  useRiskGoals,
  defaultNameFor,
  defaultRangeFor,
  periodLabelFor,
  type GoalPeriodType,
  type RiskGoalProgress,
} from '@/hooks/useRiskGoals';

const MEDAL_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇' } as const;
type MedalKey = keyof typeof MEDAL_EMOJI;

/** Fill gets more vibrant as the progress crosses each medal threshold. */
function fillStyle(pct: number): string {
  if (pct >= 100) return 'linear-gradient(90deg, hsl(45 95% 45%), hsl(48 100% 60%))';
  if (pct >= 80) return 'linear-gradient(90deg, hsl(210 10% 55%), hsl(210 20% 82%))';
  if (pct >= 60) return 'linear-gradient(90deg, hsl(25 70% 40%), hsl(30 90% 58%))';
  return 'linear-gradient(90deg, hsl(var(--muted-foreground) / 0.35), hsl(var(--primary) / 0.6))';
}

function glowFor(pct: number): string {
  if (pct >= 100) return '0 0 14px hsl(48 100% 60% / 0.65)';
  if (pct >= 80) return '0 0 12px hsl(210 20% 82% / 0.5)';
  if (pct >= 60) return '0 0 12px hsl(30 90% 58% / 0.5)';
  return 'none';
}

export function GoalBar({
  name,
  periodLabel,
  profit,
  target,
  formatAmount,
  onSaveTarget,
  onRename,
  onSaveBoth,
  onDelete,
}: {
  name: string;
  periodLabel: string;
  profit: number;
  target: number;
  formatAmount: (n: number) => string;
  onSaveTarget: (value: number) => Promise<void> | void;
  onRename?: (value: string) => Promise<void> | void;
  /** When provided, name + target are persisted in a single operation. */
  onSaveBoth?: (name: string, value: number) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState('');
  const [nameDraft, setNameDraft] = useState(name);

  const pct = target > 0 ? (profit / target) * 100 : 0;
  const markers: { key: MedalKey; at: number; value: number }[] = [
    { key: 'bronze', at: 60, value: target * 0.6 },
    { key: 'silver', at: 80, value: target * 0.8 },
    { key: 'gold', at: 100, value: target },
  ];

  const save = async () => {
    const parsed = parseFloat(targetDraft.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid target amount');
      return;
    }
    const finalName = nameDraft.trim() || name;
    try {
      if (onSaveBoth) {
        await onSaveBoth(finalName, parsed);
      } else {
        await onSaveTarget(parsed);
        if (onRename && finalName !== name) await onRename(finalName);
      }
      toast.success('Goal updated');
      setOpen(false);
    } catch (e) {
      console.error('[GoalBar] save failed', e);
      toast.error(e instanceof Error ? e.message : 'Could not save the goal');
    }
  };



  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
            <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {name}
          </div>
          <div className="text-[11px] text-muted-foreground">{periodLabel}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-mono font-semibold">
            {formatAmount(profit)}
            <span className="text-muted-foreground"> / {target > 0 ? formatAmount(target) : '—'}</span>
          </span>
          <Popover
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (o) {
                setTargetDraft(target ? String(target) : '');
                setNameDraft(name);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit goal">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3" align="end">
              {(onRename || onSaveBoth) && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Goal name</Label>
                  <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="h-8 text-sm" />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Target amount (gold medal)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="2500"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Bronze at 60% and silver at 80% of this amount.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 gap-1" onClick={save}>
                  <Check className="h-3.5 w-3.5" /> Save
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive"
                    onClick={async () => {
                      await onDelete();
                      setOpen(false);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="relative h-6 flex items-center">
        <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(0, Math.min(100, pct))}%`,
              background: fillStyle(pct),
              boxShadow: glowFor(pct),
            }}
          />
        </div>
        {target > 0 &&
          markers.map((m) => {
            const active = profit >= m.value;
            return (
              <TooltipProvider key={m.key} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute -translate-x-1/2 cursor-default"
                      style={{ left: `${m.at}%` }}
                    >
                      <span
                        className={cn(
                          'text-base leading-none transition-all',
                          active ? 'opacity-100 scale-110' : 'opacity-30 grayscale'
                        )}
                        style={active ? { filter: `drop-shadow(${glowFor(m.at)})` } : undefined}
                      >
                        {MEDAL_EMOJI[m.key]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {m.key[0].toUpperCase() + m.key.slice(1)} · {formatAmount(m.value)}
                    {active ? ' — unlocked' : ''}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
      </div>

      <div className="text-[11px] text-muted-foreground font-mono text-center">
        {target > 0 ? `${pct.toFixed(0)}% of goal` : 'Set a target with the pencil above'}
      </div>
    </div>
  );
}

function AddGoalDialog({ onCreate }: { onCreate: (input: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GoalPeriodType>('daily');
  const range = defaultRangeFor(type);
  const [name, setName] = useState(defaultNameFor('daily'));
  const [start, setStart] = useState(format(range.start, 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(range.end, 'yyyy-MM-dd'));
  const [target, setTarget] = useState('');

  const applyType = (t: GoalPeriodType) => {
    setType(t);
    const r = defaultRangeFor(t);
    setStart(format(r.start, 'yyyy-MM-dd'));
    setEnd(format(r.end, 'yyyy-MM-dd'));
    setName(defaultNameFor(t));
  };

  const submit = async () => {
    const amount = parseFloat(target.replace(',', '.'));
    if (!name.trim() || isNaN(amount) || amount <= 0) {
      toast.error('Give the goal a name and a target amount');
      return;
    }
    await onCreate({
      name: name.trim(),
      period_type: type,
      period_start: start,
      period_end: end,
      target_amount: amount,
    });
    toast.success('Goal created');
    setOpen(false);
    setTarget('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add goal
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Period</Label>
          <Select value={type} onValueChange={(v) => applyType(v as GoalPeriodType)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Target amount</Label>
          <Input
            inputMode="decimal"
            placeholder="2500"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <Button size="sm" className="w-full h-8" onClick={submit}>
          Create goal
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function GoalsSection({
  monthlyName,
  monthlyPeriodLabel,
  monthlyProfit,
  monthlyGoal,
  onSaveMonthlyGoal,
  formatAmount,
  onGoalsChange,
}: {
  monthlyName: string;
  monthlyPeriodLabel: string;
  monthlyProfit: number;
  monthlyGoal: number;
  onSaveMonthlyGoal: (value: number) => Promise<void>;
  formatAmount: (n: number) => string;
  onGoalsChange?: (goals: RiskGoalProgress[]) => void;
}) {
  const { goals, createGoal, updateGoal, deleteGoal } = useRiskGoals();
  onGoalsChange?.(goals);

  // The current month has its own goal instance (own name + own target).
  const range = defaultRangeFor('monthly');
  const currentMonthStart = format(range.start, 'yyyy-MM-dd');
  const currentMonthGoal = goals.find(
    (g) => g.period_type === 'monthly' && g.period_start === currentMonthStart
  );

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Goals</Label>
        <AddGoalDialog onCreate={createGoal} />
      </div>

      {!currentMonthGoal && (
        <GoalBar
          name={monthlyName}
          periodLabel={monthlyPeriodLabel}
          profit={monthlyProfit}
          target={monthlyGoal}
          formatAmount={formatAmount}
          onSaveTarget={async (value) => {
            await onSaveMonthlyGoal(value);
            await createGoal({
              name: monthlyName,
              period_type: 'monthly',
              period_start: currentMonthStart,
              period_end: format(range.end, 'yyyy-MM-dd'),
              target_amount: value,
            });
          }}
          onRename={async (value) => {
            await createGoal({
              name: value,
              period_type: 'monthly',
              period_start: currentMonthStart,
              period_end: format(range.end, 'yyyy-MM-dd'),
              target_amount: monthlyGoal,
            });
          }}
        />
      )}

      {goals.map((g) => (
        <GoalBar
          key={g.id}
          name={g.name}
          periodLabel={periodLabelFor(g)}
          profit={g.profit}
          target={g.target_amount}
          formatAmount={formatAmount}
          onSaveTarget={async (v) => {
            await updateGoal(g.id, { target_amount: v });
            if (g.id === currentMonthGoal?.id) await onSaveMonthlyGoal(v);
          }}
          onRename={(v) => updateGoal(g.id, { name: v })}
          onDelete={() => deleteGoal(g.id)}
        />
      ))}
    </div>
  );
}

