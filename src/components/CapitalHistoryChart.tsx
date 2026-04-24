import { useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CapitalLogEntry {
  id: string;
  log_date: string;
  amount_added: number;
  total_after: number;
  notes?: string;
}

interface TradeRow {
  profit_loss: number | null;
  trade_date?: string | null;
  closed_at?: string | null;
  opened_at?: string | null;
}

interface ChartPoint {
  date: string;            // YYYY-MM-DD
  capital: number;          // running balance after event(s) that day
  added: number;            // capital added that day (0 if none)
  pnl: number;              // net pnl that day (0 if none)
  notes?: string;
  eventType: 'addition' | 'trade' | 'both' | 'start';
}

/**
 * Capital Evolution Over Time — shows running balance day-by-day combining:
 *   • Initial investment (from user_settings)
 *   • Capital additions (from capital_log)
 *   • Trade P&L (from trades)
 *
 * Previous version only plotted capital additions, so a trader with 1 initial
 * deposit saw a single point. This version walks every event chronologically.
 */
export const CapitalHistoryChart = () => {
  const { user } = useAuth();

  // Initial investment
  const { data: settings } = useQuery({
    queryKey: ['user-settings-initial', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_settings')
        .select('initial_investment')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Capital log
  const { data: capitalLog = [], isLoading: capLoading } = useQuery({
    queryKey: ['capital-log', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_log')
        .select('*')
        .order('log_date', { ascending: true });
      if (error) throw error;
      return (data || []) as CapitalLogEntry[];
    },
    enabled: !!user?.id,
  });

  // Trades
  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['capital-history-trades', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('trades')
        .select('profit_loss, trade_date, closed_at, opened_at')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      return (data || []) as TradeRow[];
    },
    enabled: !!user?.id,
  });

  const isLoading = capLoading || tradesLoading;
  const initialInvestment = settings?.initial_investment || 0;

  const { chartData, startingBalance, currentBalance, deltaPct } = useMemo(() => {
    type Event =
      | { type: 'addition'; date: string; amount: number; notes?: string }
      | { type: 'trade'; date: string; pnl: number };

    const events: Event[] = [];

    for (const entry of capitalLog) {
      if (entry?.log_date && entry?.amount_added) {
        events.push({
          type: 'addition',
          date: entry.log_date.slice(0, 10),
          amount: entry.amount_added,
          notes: entry.notes,
        });
      }
    }

    for (const t of trades) {
      const raw = t.trade_date || t.closed_at || t.opened_at;
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime())) continue;
      events.push({
        type: 'trade',
        date: d.toISOString().slice(0, 10),
        pnl: t.profit_loss || 0,
      });
    }

    if (events.length === 0 && initialInvestment <= 0) {
      return { chartData: [] as ChartPoint[], startingBalance: 0, currentBalance: 0, deltaPct: 0 };
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    // Group events by day
    const byDay = new Map<string, { added: number; pnl: number; notes: string[] }>();
    for (const ev of events) {
      const bucket = byDay.get(ev.date) || { added: 0, pnl: 0, notes: [] };
      if (ev.type === 'addition') {
        bucket.added += ev.amount;
        if (ev.notes) bucket.notes.push(ev.notes);
      } else {
        bucket.pnl += ev.pnl;
      }
      byDay.set(ev.date, bucket);
    }

    const sortedDays = Array.from(byDay.keys()).sort();

    const points: ChartPoint[] = [];
    let running = initialInvestment;

    if (initialInvestment > 0) {
      // Synthetic starting point — 1 day before first event
      const firstDay = sortedDays[0] || new Date().toISOString().slice(0, 10);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - 1);
      points.push({
        date: startDate.toISOString().slice(0, 10),
        capital: running,
        added: initialInvestment,
        pnl: 0,
        eventType: 'start',
      });
    }

    for (const day of sortedDays) {
      const b = byDay.get(day)!;
      running = running + b.added + b.pnl;
      const eventType: ChartPoint['eventType'] =
        b.added && b.pnl ? 'both' : b.added ? 'addition' : 'trade';
      points.push({
        date: day,
        capital: running,
        added: b.added,
        pnl: b.pnl,
        notes: b.notes.length ? b.notes.join(' · ') : undefined,
        eventType,
      });
    }

    const startingBalance = points[0]?.capital ?? initialInvestment;
    const currentBalance = points[points.length - 1]?.capital ?? startingBalance;
    const deltaPct = startingBalance > 0 ? ((currentBalance - startingBalance) / startingBalance) * 100 : 0;

    return { chartData: points, startingBalance, currentBalance, deltaPct };
  }, [capitalLog, trades, initialInvestment]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as ChartPoint;
      return (
        <div className="glass-thick p-3 rounded-ios-card border border-space-500/60 min-w-[180px]">
          <p className="text-xs text-space-300 mb-1">{d.date}</p>
          <p className="font-semibold text-space-100 tabular-nums">
            ${d.capital.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 space-y-1 text-xs tabular-nums">
            {d.added > 0 && (
              <p className="text-apple-cyan">+ ${d.added.toLocaleString()} added</p>
            )}
            {d.pnl !== 0 && (
              <p className={d.pnl >= 0 ? 'text-apple-green' : 'text-apple-red'}>
                {d.pnl >= 0 ? '+' : '−'}${Math.abs(d.pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                trade P&L
              </p>
            )}
          </div>
          {d.notes && <p className="text-[10px] text-space-400 italic mt-2">"{d.notes}"</p>}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <PremiumCard className="p-6 glass-strong">
        <div className="flex items-center justify-center h-64">
          <p className="text-space-300">Loading capital history…</p>
        </div>
      </PremiumCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <PremiumCard className="p-6 glass-strong">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Info className="h-10 w-10 text-space-400" />
          <p className="text-space-300 text-center max-w-sm">
            No capital history yet. Once you log your first capital entry or trade,
            the evolution curve will appear here.
          </p>
        </div>
      </PremiumCard>
    );
  }

  const isUp = deltaPct >= 0;

  return (
    <PremiumCard className="p-6 glass-strong">
      {/* Header with headline numbers */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 text-space-100">
            <TrendingUp className={`h-5 w-5 ${isUp ? 'text-apple-green' : 'text-apple-red'}`} />
            Capital Evolution
          </h3>
          <p className="text-sm text-space-300 mt-1">
            Running balance — combines initial capital, additions, and every trade's P&L.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-space-300">Total change</div>
          <div className={`font-num text-2xl font-semibold tabular-nums ${isUp ? 'text-apple-green' : 'text-apple-red'}`}>
            {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
          </div>
          <div className="text-xs text-space-300 tabular-nums mt-0.5">
            ${startingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            {' → '}
            <span className="text-space-100 font-medium">
              ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="capitalGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--apple-green))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--apple-green))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="capitalGradientDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--apple-red))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--apple-red))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--space-gray-500))" opacity={0.25} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--space-gray-300))"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              try { return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return v; }
            }}
            minTickGap={32}
          />
          <YAxis
            stroke="hsl(var(--space-gray-300))"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const v = Number(value);
              if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
              if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
              return `$${v.toFixed(0)}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={startingBalance}
            stroke="hsl(var(--space-gray-400))"
            strokeDasharray="2 3"
            label={{ value: 'Start', position: 'insideTopLeft', fill: 'hsl(var(--space-gray-300))', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="capital"
            stroke={isUp ? 'hsl(var(--apple-green))' : 'hsl(var(--apple-red))'}
            strokeWidth={2}
            fill={isUp ? 'url(#capitalGradientUp)' : 'url(#capitalGradientDown)'}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 rounded-ios bg-space-600/40 border border-space-500/50">
        <p className="text-xs text-space-300 flex items-center gap-2">
          <Info className="h-4 w-4 text-electric" />
          Hover any day to see the breakdown between additions and trade P&L.
        </p>
      </div>
    </PremiumCard>
  );
};
