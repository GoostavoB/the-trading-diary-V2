import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { Loader2, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TradeRow {
  profit_loss: number | null;
  roi: number | null;
  trade_date: string;
}

interface SettingsRow {
  initial_investment: number | null;
}

interface CapitalLogRow {
  amount_added: number;
  total_after: number | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmt(n: number, decimals = 0): string {
  const abs = Math.abs(n).toFixed(decimals);
  return n >= 0 ? `+$${abs}` : `-$${abs}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function weeksBetween(dateA: Date, dateB: Date): number {
  const ms = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.max(ms / (1000 * 60 * 60 * 24 * 7), 1);
}

// ─────────────────────────────────────────────
// Coaching engine
// ─────────────────────────────────────────────
interface CoachOutput {
  icon: typeof Flame;
  color: string;
  bg: string;
  title: string;
  message: string;
}

function buildCoachMessage(
  expectancy: number,
  winRate: number,
  rr: number,
  tradesPerWeek: number
): CoachOutput {
  if (expectancy > 0 && winRate >= 55 && rr >= 1.5) {
    return {
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      title: '🔥 You\'re firing on all cylinders',
      message: `Win rate ${winRate.toFixed(0)}% with ${rr.toFixed(1)}:1 R:R — that's an elite combination. Maintain your pace of ~${tradesPerWeek.toFixed(1)} trades/week. Don't overtrade chasing more — quality already works for you. Protect your capital and let the edge compound.`,
    };
  }
  if (expectancy > 0 && winRate >= 45) {
    return {
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      title: '✅ Positive expectancy — stay the course',
      message: `Your numbers show a clear edge: every trade you take expects a profit on average. Keep your ${tradesPerWeek.toFixed(1)} trades/week rhythm, enforce your stop-losses, and do not increase size until your sample grows. The projections below are realistic if you hold discipline.`,
    };
  }
  if (expectancy > 0 && winRate < 45) {
    return {
      icon: Zap,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      title: '⚡ High R:R strategy — stay selective',
      message: `You have a positive expectancy despite a sub-50% win rate because your winners are much larger than your losses (R:R ${rr.toFixed(1)}:1). This style requires iron discipline: cut losses fast and let winners run. Avoid overtrading — more trades can hurt a high-R:R system.`,
    };
  }
  return {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    title: '⚠️ Negative expectancy — review your setups',
    message: `Currently your average trade loses money after accounting for wins and losses. Review your stop-loss placement, check if you\'re cutting winners too early, and consider reducing size until you identify what's off. Every trade you take with negative expectancy compounds the drawdown.`,
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function SmartCapitalProjection() {
  const { user } = useAuth();

  const { data: trades, isLoading: tradesLoading } = useQuery<TradeRow[]>({
    queryKey: ['smart-projection-trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('profit_loss, roi, trade_date')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('trade_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: settings } = useQuery<SettingsRow | null>({
    queryKey: ['smart-projection-settings', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('initial_investment')
        .eq('user_id', user!.id)
        .maybeSingle();
      return (data ?? null) as SettingsRow | null;
    },
    enabled: !!user?.id,
  });

  const { data: capitalLog } = useQuery<CapitalLogRow[]>({
    queryKey: ['smart-projection-capital', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('capital_log')
        .select('amount_added, total_after')
        .order('log_date', { ascending: false });
      return (data ?? []) as CapitalLogRow[];
    },
    enabled: !!user?.id,
  });

  // ── Derived calculations ──────────────────────────────────────
  const calc = useMemo(() => {
    if (!trades || trades.length < 2) return null;

    const initialCapital =
      capitalLog && capitalLog.length > 0
        ? capitalLog.reduce((s, e) => s + (e.amount_added || 0), 0)
        : (settings?.initial_investment ?? 0);

    const totalPnL = trades.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
    const currentCapital = initialCapital + totalPnL;

    const wins = trades.filter(t => (t.profit_loss ?? 0) > 0);
    const losses = trades.filter(t => (t.profit_loss ?? 0) < 0);

    const winRate = wins.length / trades.length;
    const avgWin = wins.length
      ? wins.reduce((s, t) => s + (t.profit_loss ?? 0), 0) / wins.length
      : 0;
    const avgLoss = losses.length
      ? losses.reduce((s, t) => s + (t.profit_loss ?? 0), 0) / losses.length
      : 0; // already negative

    // Risk:Reward = |avgWin| / |avgLoss|
    const rr = losses.length && avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    // Expectancy per trade in $
    const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;

    // Trade frequency
    const firstDate = new Date(trades[0].trade_date);
    const lastDate = new Date(trades[trades.length - 1].trade_date);
    const weeks = weeksBetween(firstDate, lastDate);
    const tradesPerWeek = trades.length / weeks;
    const tradesPerMonth = tradesPerWeek * 4.33;

    // Monthly P&L projection (linear, not compound — more conservative & honest)
    const monthlyPnL = tradesPerMonth * expectancy;

    // Projections
    const month1 = currentCapital + monthlyPnL;
    const month2 = currentCapital + monthlyPnL * 2;
    const month3 = currentCapital + monthlyPnL * 3;

    // Growth percentages
    const pct1 = currentCapital > 0 ? (monthlyPnL / currentCapital) * 100 : 0;
    const pct2 = currentCapital > 0 ? ((monthlyPnL * 2) / currentCapital) * 100 : 0;
    const pct3 = currentCapital > 0 ? ((monthlyPnL * 3) / currentCapital) * 100 : 0;

    // Avg ROI per trade (from roi column, fallback to pnl-based)
    const roisWithValue = trades.filter(t => t.roi !== null && t.roi !== 0);
    const avgRoiPerTrade = roisWithValue.length
      ? roisWithValue.reduce((s, t) => s + (t.roi ?? 0), 0) / roisWithValue.length
      : 0;

    const coach = buildCoachMessage(expectancy, winRate * 100, rr, tradesPerWeek);

    return {
      initialCapital,
      currentCapital,
      totalPnL,
      winRate: winRate * 100,
      avgWin,
      avgLoss,
      rr,
      expectancy,
      tradesPerWeek,
      tradesPerMonth,
      monthlyPnL,
      month1,
      month2,
      month3,
      pct1,
      pct2,
      pct3,
      avgRoiPerTrade,
      totalTrades: trades.length,
      coach,
    };
  }, [trades, settings, capitalLog]);

  // ── Loading / empty states ───────────────────────────────────
  if (tradesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!calc) {
    return (
      <PremiumCard className="p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Add at least 2 trades to see your capital projection.
        </p>
      </PremiumCard>
    );
  }

  const CoachIcon = calc.coach.icon;

  return (
    <div className="space-y-5">
      {/* ── Section header ─────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold">Your Capital Reality Check</h2>
        <p className="text-muted-foreground mt-1">
          Based on your real {calc.totalTrades} trades — no guessing, no made-up numbers.
        </p>
      </div>

      {/* ── Row 1: Capital snapshot ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Initial Capital',
            value: <BlurredCurrency amount={calc.initialCapital} />,
            sub: 'Your starting base',
            positive: true,
          },
          {
            label: 'Current Capital',
            value: <BlurredCurrency amount={calc.currentCapital} />,
            sub: `After all trades`,
            positive: calc.currentCapital >= calc.initialCapital,
          },
          {
            label: 'Total P&L',
            value: (
              <span className={calc.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                <BlurredCurrency amount={calc.totalPnL} />
              </span>
            ),
            sub: calc.totalPnL >= 0 ? '✓ Profitable overall' : '↓ Currently in drawdown',
            positive: calc.totalPnL >= 0,
          },
          {
            label: 'Capital Growth',
            value: (
              <span className={calc.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                {calc.initialCapital > 0
                  ? fmtPct((calc.totalPnL / calc.initialCapital) * 100)
                  : '—'}
              </span>
            ),
            sub: `From ${calc.totalTrades} trades`,
            positive: calc.totalPnL >= 0,
          },
        ].map(item => (
          <PremiumCard key={item.label} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <div className="text-xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
          </PremiumCard>
        ))}
      </div>

      {/* ── Row 2: Trading stats ─────────────────────────────────── */}
      <PremiumCard className="p-5">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Your Real Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: 'Win Rate',
              value: `${calc.winRate.toFixed(1)}%`,
              sub: `${Math.round(calc.winRate * calc.totalTrades / 100)} wins / ${calc.totalTrades} trades`,
              color: calc.winRate >= 50 ? 'text-green-400' : 'text-yellow-400',
            },
            {
              label: 'Avg Win',
              value: `+$${calc.avgWin.toFixed(0)}`,
              sub: 'Per winning trade',
              color: 'text-green-400',
            },
            {
              label: 'Avg Loss',
              value: `-$${Math.abs(calc.avgLoss).toFixed(0)}`,
              sub: 'Per losing trade',
              color: 'text-red-400',
            },
            {
              label: 'Risk:Reward',
              value: `${calc.rr.toFixed(2)}:1`,
              sub: calc.rr >= 1.5 ? '✓ Excellent' : calc.rr >= 1 ? '✓ Positive' : '↓ Below 1:1',
              color: calc.rr >= 1 ? 'text-green-400' : 'text-red-400',
            },
            {
              label: 'Expectancy/Trade',
              value: fmt(calc.expectancy, 2),
              sub: 'Expected $ per trade',
              color: calc.expectancy >= 0 ? 'text-green-400' : 'text-red-400',
            },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-6 text-sm text-muted-foreground">
          <span>
            📅 <strong className="text-foreground">{calc.tradesPerWeek.toFixed(1)}</strong> trades/week avg
          </span>
          <span>
            📈 <strong className="text-foreground">{calc.tradesPerMonth.toFixed(0)}</strong> trades/month pace
          </span>
          {calc.avgRoiPerTrade !== 0 && (
            <span>
              🎯 <strong className="text-foreground">{calc.avgRoiPerTrade.toFixed(1)}%</strong> avg ROI/trade
            </span>
          )}
        </div>
      </PremiumCard>

      {/* ── Row 3: 3-Month projection ────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Realistic Projection — Keeping This Exact Pace
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '1 Month', capital: calc.month1, pnl: calc.monthlyPnL, pct: calc.pct1, months: 1 },
            { label: '2 Months', capital: calc.month2, pnl: calc.monthlyPnL * 2, pct: calc.pct2, months: 2 },
            { label: '3 Months', capital: calc.month3, pnl: calc.monthlyPnL * 3, pct: calc.pct3, months: 3 },
          ].map(({ label, capital, pnl, pct, months }) => {
            const isPositive = pnl >= 0;
            return (
              <PremiumCard
                key={label}
                className={`p-5 border-2 ${isPositive ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ~{Math.round(calc.tradesPerMonth * months)} trades at current pace
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={isPositive ? 'text-green-400 border-green-500/40' : 'text-red-400 border-red-500/40'}
                  >
                    {fmtPct(pct)}
                  </Badge>
                </div>

                {/* Capital value */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Projected capital</p>
                  <p className="text-2xl font-bold">
                    <BlurredCurrency amount={capital} />
                  </p>
                </div>

                {/* P&L delta */}
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <BlurredCurrency amount={pnl} />
                  <span className="font-normal text-muted-foreground">vs. today</span>
                </div>

                {/* Monthly breakdown */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    {fmt(calc.monthlyPnL, 0)}/month × {months} month{months > 1 ? 's' : ''}
                  </p>
                </div>
              </PremiumCard>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          ⚠️ Linear projection — assumes consistent trade frequency, setup quality, and position sizing. Past performance ≠ future results.
        </p>
      </div>

      {/* ── Row 4: Coaching message ──────────────────────────────── */}
      <PremiumCard className={`p-5 border ${calc.coach.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-xl ${calc.coach.bg} flex-shrink-0`}>
            <CoachIcon className={`h-5 w-5 ${calc.coach.color}`} />
          </div>
          <div>
            <p className={`font-semibold mb-1 ${calc.coach.color}`}>{calc.coach.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{calc.coach.message}</p>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
