import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicRiskEngine, type DRETier } from '@/hooks/useDynamicRiskEngine';
import { useRiskCalculator } from '@/hooks/useRiskCalculator';
import { useDailyLossLock } from '@/hooks/useDailyLossLock';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  AlertTriangle,
  Check,
  X,
  Zap,
  Target,
  Activity,
  Settings2,
  TrendingDown,
  CircleDollarSign,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MetricTooltip } from '@/components/MetricTooltip';
import { cn } from '@/lib/utils';

const TIER_COLORS: Record<DRETier, string> = {
  protection: 'hsl(0, 72%, 51%)',
  aggressive: 'hsl(217, 91%, 60%)',
  moderate: 'hsl(271, 91%, 65%)',
  conservative: 'hsl(45, 93%, 47%)',
  institutional: 'hsl(160, 84%, 39%)',
};

const TIER_BG: Record<DRETier, string> = {
  protection: 'bg-red-500/10 border-red-500/30 text-red-500',
  aggressive: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  moderate: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  conservative: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  institutional: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

export function DREContent() {
  const navigate = useNavigate();
  const dre = useDynamicRiskEngine();
  const { formatAmount } = useCurrency();
  const { settings } = useUserSettings();

  // Pull the real per-trade risk / daily loss budget from the Risk Calculator
  // so the "Próximo Trade Stop Max" number reflects the user's actual settings.
  const { calculation, riskPercent, loading: riskLoading } = useRiskCalculator();
  const { todaysPnL, remaining: remainingDailyBudget, isLocked } = useDailyLossLock(
    calculation.dailyLossLimit,
  );

  const [simValue, setSimValue] = useState('');
  const [simResult, setSimResult] = useState<ReturnType<typeof dre.simulate> | null>(null);
  const [editingGoalPct, setEditingGoalPct] = useState(false);
  const [goalPctInput, setGoalPctInput] = useState(String(dre.dailyGoalPercent));

  // ── BUSINESS LOGIC ────────────────────────────────────────────────────
  // nextTradeStopMax = min(per-trade risk, remaining daily budget)
  // If daily loss lock is active → 0. If user is already over their goal,
  // we fall back to the tier-based allowedRisk from the DRE hook.
  const nextTradeStopMax = useMemo(() => {
    if (isLocked) return 0;
    const baseStop = Math.min(calculation.riskPerTrade, remainingDailyBudget);
    return Math.max(0, baseStop);
  }, [isLocked, calculation.riskPerTrade, remainingDailyBudget]);

  // Configuration flag — if neither risk_percent nor daily_loss_percent is
  // set in user_settings, the widget has nothing to work with.
  const lossLockConfigured = calculation.dailyLossLimit > 0 && calculation.riskPerTrade > 0;

  const handleSimulate = () => {
    const val = parseFloat(simValue);
    if (!isNaN(val)) {
      setSimResult(dre.simulate(val));
    }
  };

  const handleGoalPctSave = () => {
    const val = parseFloat(goalPctInput);
    if (!isNaN(val) && val >= 0.5 && val <= 50) {
      dre.updateDailyGoalPercent(val);
      setEditingGoalPct(false);
    }
  };

  const tierColor = TIER_COLORS[dre.tier];
  const compliantTrades = dre.todayTrades.filter((t) => t.respectedDRE).length;
  const violatedTrades = dre.todayTrades.filter((t) => !t.respectedDRE).length;

  const budgetUsedPct =
    calculation.dailyLossLimit > 0
      ? Math.min(100, (Math.abs(Math.min(0, todaysPnL)) / calculation.dailyLossLimit) * 100)
      : 0;

  return (
    <div
      className="flex flex-col gap-3 overflow-y-auto"
      style={{ height: 'calc(100vh - 220px)' }}
    >
      {/* ── Config banner ─────────────────────────────────────────── */}
      {!lossLockConfigured && !riskLoading && (
        <Card className="glass border-0 border-l-4" style={{ borderLeftColor: tierColor }}>
          <CardContent className="p-3 flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Configure your risk settings first</p>
              <p className="text-xs text-muted-foreground">
                Set a per-trade risk % and a daily loss limit on the Trade Station to
                enable next-trade stop suggestions.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
              Open Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Top Row: Status + Next Trade + Daily Budget ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status */}
        <Card className="glass border-0">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <div className={`px-4 py-2 rounded-full border font-bold text-lg ${TIER_BG[dre.tier]}`}>
              {dre.tierLabel}
            </div>
            <p className="text-xs text-muted-foreground text-center">Engine status</p>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  <p className="text-muted-foreground text-[10px]">Current balance</p>
                  <MetricTooltip
                    title="Current balance"
                    description="Base capital + total PnL across every trade."
                    calculation="Base capital + SUM(trades.pnl)"
                    side="bottom"
                  />
                </div>
                <p className="font-semibold tabular-nums">{formatAmount(dre.currentBalance)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  <p className="text-muted-foreground text-[10px]">
                    Daily goal ({dre.dailyGoalPercent}%)
                  </p>
                  <MetricTooltip
                    title="Daily goal"
                    description="Editable % of current balance. Click the value to change it."
                    calculation={`Current balance × ${dre.dailyGoalPercent}%`}
                    side="bottom"
                  />
                </div>
                {editingGoalPct ? (
                  <div className="flex gap-1 items-center justify-center">
                    <Input
                      className="h-6 w-16 text-xs text-center"
                      value={goalPctInput}
                      onChange={(e) => setGoalPctInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGoalPctSave()}
                      type="number"
                      min={0.5}
                      max={50}
                      step={0.5}
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1"
                      onClick={handleGoalPctSave}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p
                    className="font-semibold cursor-pointer hover:underline tabular-nums"
                    onClick={() => {
                      setEditingGoalPct(true);
                      setGoalPctInput(String(dre.dailyGoalPercent));
                    }}
                  >
                    {formatAmount(dre.dailyGoal)}
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  <p className="text-muted-foreground text-[10px]">Today PnL</p>
                  <MetricTooltip
                    title="Today PnL"
                    description="Sum of realised PnL for every trade closed today."
                    side="bottom"
                  />
                </div>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    dre.todayPnL >= 0 ? 'text-emerald-500' : 'text-red-500',
                  )}
                >
                  {formatAmount(dre.todayPnL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Trade - Max Stop (rebuilt calc) */}
        <Card
          className="glass border-0"
          style={{ borderLeft: `3px solid ${tierColor}` }}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-wide">
              <Target className="h-3 w-3" />
              Next trade · Stop max
              <MetricTooltip
                title="Next trade — Stop max"
                description="Maximum $ risk you can lose on the next trade without busting your per-trade risk or daily loss budget."
                calculation="min( equity × risk%, daily_loss_limit + todayPnL )"
                side="bottom"
              />
            </div>
            <div
              className="text-4xl font-black tabular-nums"
              style={{ color: nextTradeStopMax > 0 ? tierColor : 'hsl(var(--muted-foreground))' }}
            >
              {lossLockConfigured ? formatAmount(nextTradeStopMax) : '—'}
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              Per-trade risk: {lossLockConfigured ? formatAmount(calculation.riskPerTrade) : '—'}
              <MetricTooltip
                title="Per-trade risk"
                description="Calculated from your Risk Calculator: equity × risk %."
                side="bottom"
              />
            </div>
            {isLocked && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Lock triggered — stop trading today
              </div>
            )}
            {!isLocked && !lossLockConfigured && (
              <p className="text-[10px] text-muted-foreground text-center mt-1 max-w-[22ch]">
                Set a daily loss lock to enable next-trade stop suggestions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Daily budget remaining */}
        <Card className="glass border-0">
          <CardContent className="p-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <CircleDollarSign className="h-3 w-3" />
              Daily loss budget
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-2xl font-black tabular-nums',
                  isLocked ? 'text-red-500' : 'text-foreground',
                )}
              >
                {lossLockConfigured ? formatAmount(remainingDailyBudget) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatAmount(calculation.dailyLossLimit)}
              </span>
            </div>
            {/* Progress */}
            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  budgetUsedPct >= 100
                    ? 'bg-red-500'
                    : budgetUsedPct >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500',
                )}
                style={{ width: `${budgetUsedPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Used: {budgetUsedPct.toFixed(0)}%
              </span>
              <span>Risk % / trade: {riskPercent.toFixed(2)}%</span>
            </div>
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 self-start">
                <AlertTriangle className="h-3 w-3" />
                Lock triggered
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Simulator + Health Check ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Simulator */}
        <Card className="glass border-0">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Simulate next trade
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Hypothetical P/L ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50 or -30"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSimulate} className="self-end">
                Run
              </Button>
            </div>

            {simResult && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New day PnL</span>
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      simResult.newPnL >= 0 ? 'text-emerald-500' : 'text-red-500',
                    )}
                  >
                    {formatAmount(simResult.newPnL)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New surplus vs goal</span>
                  <span className="font-semibold tabular-nums">{formatAmount(simResult.newSurplus)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">New tier</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TIER_BG[simResult.newTier]}`}
                  >
                    {simResult.newTierLabel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier-implied stop</span>
                  <span
                    className="font-bold text-base tabular-nums"
                    style={{ color: TIER_COLORS[simResult.newTier] }}
                  >
                    {formatAmount(simResult.newAllowedRisk)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Check */}
        <Card className="glass border-0 flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Health check — today's trades
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                <span className="text-emerald-500">{compliantTrades}</span>
                {violatedTrades > 0 && (
                  <span className="text-red-500 ml-1">· {violatedTrades} violated</span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 overflow-y-auto min-h-0">
            {dre.todayTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <Shield className="h-8 w-8 opacity-30" />
                <p>No trades logged today</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dre.todayTrades.map((trade, i) => (
                  <div
                    key={trade.id}
                    className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-muted/30"
                  >
                    <span className="text-muted-foreground text-xs w-4">#{i + 1}</span>
                    {trade.respectedDRE ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                    <span className="font-medium flex-1 truncate">{trade.symbol}</span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        trade.profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500',
                      )}
                    >
                      {trade.profit_loss >= 0 ? '+' : ''}
                      {formatAmount(trade.profit_loss)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      max: {formatAmount(trade.allowedRiskAtTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
