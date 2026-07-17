// Trade-stats queries shared by webhook (commands) and notifier (digests).
// Reads the existing `trades` table; P&L uses profit_loss with pnl fallback.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

export interface TradeRow {
  id: string;
  symbol: string | null;
  symbol_temp: string;
  profit_loss: number | null;
  pnl: number | null;
  roi: number | null;
  trade_date: string | null;
  closed_at: string | null;
  setup: string | null;
}

export interface PeriodStats {
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number | null;
  best: TradeRow | null;
  worst: TradeRow | null;
  avgRoi: number | null;
}

export function tradePnl(t: TradeRow): number {
  return t.profit_loss ?? t.pnl ?? 0;
}

export function tradeSymbol(t: TradeRow): string {
  return t.symbol ?? t.symbol_temp ?? '—';
}

/** Local calendar date (YYYY-MM-DD) for a timezone. */
export function localDate(timezone: string, d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

/** Local hour (0-23) and day-of-week (0=Sun) for a timezone. */
export function localClock(timezone: string, d = new Date()): { hour: number; dow: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC', hour: 'numeric', hour12: false, weekday: 'short',
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow = dows.indexOf(parts.find((p) => p.type === 'weekday')?.value ?? 'Sun');
  return { hour, dow: dow < 0 ? 0 : dow };
}

const TRADE_COLUMNS =
  'id, symbol, symbol_temp, profit_loss, pnl, roi, trade_date, closed_at, setup';

export async function fetchTrades(
  supabase: SupabaseClient,
  userId: string,
  fromDate?: string,
  toDate?: string,
): Promise<TradeRow[]> {
  let query = supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (fromDate) query = query.gte('trade_date', fromDate);
  if (toDate) query = query.lte('trade_date', toDate);
  const { data, error } = await query.order('trade_date', { ascending: false }).limit(1000);
  if (error) {
    console.error('fetchTrades failed', error.message);
    return [];
  }
  return (data ?? []) as TradeRow[];
}

export function computeStats(trades: TradeRow[]): PeriodStats {
  let wins = 0, losses = 0, netPnl = 0;
  let best: TradeRow | null = null, worst: TradeRow | null = null;
  let roiSum = 0, roiCount = 0;

  for (const t of trades) {
    const pnl = tradePnl(t);
    netPnl += pnl;
    if (pnl > 0) wins++;
    else if (pnl < 0) losses++;
    if (!best || pnl > tradePnl(best)) best = t;
    if (!worst || pnl < tradePnl(worst)) worst = t;
    if (t.roi != null) { roiSum += t.roi; roiCount++; }
  }

  const decided = wins + losses;
  return {
    trades: trades.length,
    wins,
    losses,
    netPnl,
    winRate: decided ? wins / decided : null,
    best,
    worst,
    avgRoi: roiCount ? roiSum / roiCount : null,
  };
}

export function fmtMoney(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

export function fmtPct(v: number | null): string {
  return v == null ? '—' : `${(v * 100).toFixed(0)}%`;
}

export function fmtTradeLine(t: TradeRow | null): string {
  if (!t) return '—';
  const setup = t.setup ? ` (${t.setup})` : '';
  return `${tradeSymbol(t)} ${fmtMoney(tradePnl(t))}${setup}`;
}
