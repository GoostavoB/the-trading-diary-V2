// Scheduled dispatcher (config.toml: every 5 minutes), same pattern as
// monitor-performance-alerts. Each tick:
//   1. sends daily digests to users whose local clock hits their digest hour
//   2. sends weekly digests (user's chosen day, 20:00 local)
//   3. sends trade-closed alerts for trades logged in the last 15 minutes
//
// Every send is idempotent via the (user, template, ref_id) unique dedup
// index in telegram_message_log, so overlapping/forced ticks cannot double-send.
// Deviation from spec §8: no pg_net trigger — polling keeps the function safe
// to expose and matches the repo's existing cron precedent (≤5 min latency).

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { sendMessage } from '../_shared/telegram/api.ts';
import { render } from '../_shared/telegram/templates.ts';
import {
  computeStats, fetchTrades, fmtMoney, fmtPct, fmtTradeLine,
  localClock, localDate, tradePnl, tradeSymbol, type PeriodStats,
} from '../_shared/telegram/stats.ts';

interface Recipient {
  user_id: string;
  chat_id: number;
  timezone: string;
  locale: string;
  prefs: {
    daily_digest: boolean;
    daily_digest_hour_local: number;
    weekly_digest: boolean;
    weekly_digest_day: number;
    alert_on_trade_close: boolean;
    mute_until: string | null;
  };
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const recipients = await loadRecipients(supabase);
    console.log(`tick: ${recipients.length} linked users`);

    for (const r of recipients) {
      if (r.prefs.mute_until && new Date(r.prefs.mute_until).getTime() > Date.now()) continue;
      // Alerts/digests are independent per user; one failure must not stop the rest.
      await maybeSendTradeAlerts(supabase, r).catch((e) => console.error('trade alerts', r.user_id, e));
      await maybeSendDailyDigest(supabase, r).catch((e) => console.error('daily digest', r.user_id, e));
      await maybeSendWeeklyDigest(supabase, r).catch((e) => console.error('weekly digest', r.user_id, e));
    }
  } catch (error) {
    console.error('telegram-notifier error', error);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function loadRecipients(supabase: SupabaseClient): Promise<Recipient[]> {
  const { data: users, error } = await supabase
    .from('telegram_users')
    .select('user_id, chat_id, timezone, locale');
  if (error || !users?.length) return [];

  const { data: prefRows } = await supabase
    .from('telegram_preferences')
    .select('*')
    .in('user_id', users.map((u) => u.user_id));
  const prefsById = new Map((prefRows ?? []).map((p) => [p.user_id, p]));

  return users.map((u) => ({
    user_id: u.user_id,
    chat_id: u.chat_id,
    timezone: u.timezone ?? 'UTC',
    locale: u.locale ?? 'en',
    prefs: {
      daily_digest: prefsById.get(u.user_id)?.daily_digest ?? true,
      daily_digest_hour_local: prefsById.get(u.user_id)?.daily_digest_hour_local ?? 22,
      weekly_digest: prefsById.get(u.user_id)?.weekly_digest ?? true,
      weekly_digest_day: prefsById.get(u.user_id)?.weekly_digest_day ?? 0,
      alert_on_trade_close: prefsById.get(u.user_id)?.alert_on_trade_close ?? true,
      mute_until: prefsById.get(u.user_id)?.mute_until ?? null,
    },
  }));
}

// ── Daily digest ──────────────────────────────────────────────────────────

async function maybeSendDailyDigest(supabase: SupabaseClient, r: Recipient): Promise<void> {
  if (!r.prefs.daily_digest) return;
  const { hour } = localClock(r.timezone);
  if (hour !== r.prefs.daily_digest_hour_local) return;

  const today = localDate(r.timezone);
  const trades = await fetchTrades(supabase, r.user_id, today, today);
  if (!trades.length) return; // no-trade days stay quiet — silence beats nagging

  const s = computeStats(trades);
  await sendMessage(supabase, r.chat_id, render('daily_digest', r.locale, {
    date: today,
    pnl: fmtMoney(s.netPnl),
    trades: s.trades,
    wins: s.wins,
    losses: s.losses,
    best: fmtTradeLine(s.best),
    worst: fmtTradeLine(s.worst),
    comment: digestComment(s, r.locale),
  }), {
    userId: r.user_id,
    messageType: 'digest',
    templateName: 'daily_digest',
    refId: `daily:${today}`,
  });
}

// ── Weekly digest ─────────────────────────────────────────────────────────

const WEEKLY_DIGEST_HOUR = 20; // spec §3A: Sunday 20:00 local (day configurable)

async function maybeSendWeeklyDigest(supabase: SupabaseClient, r: Recipient): Promise<void> {
  if (!r.prefs.weekly_digest) return;
  const { hour, dow } = localClock(r.timezone);
  if (dow !== r.prefs.weekly_digest_day || hour !== WEEKLY_DIGEST_HOUR) return;

  const now = new Date();
  const from = localDate(r.timezone, new Date(now.getTime() - 6 * 86_400_000));
  const to = localDate(r.timezone, now);
  const trades = await fetchTrades(supabase, r.user_id, from, to);
  if (!trades.length) return;

  const s = computeStats(trades);
  await sendMessage(supabase, r.chat_id, render('weekly_digest', r.locale, {
    range: `${from} → ${to}`,
    pnl: fmtMoney(s.netPnl),
    trades: s.trades,
    wins: s.wins,
    losses: s.losses,
    winRate: fmtPct(s.winRate),
    best: fmtTradeLine(s.best),
    worst: fmtTradeLine(s.worst),
    comment: digestComment(s, r.locale),
  }), {
    userId: r.user_id,
    messageType: 'digest',
    templateName: 'weekly_digest',
    refId: `weekly:${to}`,
  });
}

// ── Trade-closed alerts ───────────────────────────────────────────────────

const ALERT_WINDOW_MS = 15 * 60_000;
const MAX_ALERTS_PER_TICK = 3; // bulk imports must not flood the chat

async function maybeSendTradeAlerts(supabase: SupabaseClient, r: Recipient): Promise<void> {
  if (!r.prefs.alert_on_trade_close) return;

  const today = localDate(r.timezone);
  const since = new Date(Date.now() - ALERT_WINDOW_MS).toISOString();

  // Only trades dated today AND logged in the last 15 min: reacts to live
  // logging, ignores historical CSV imports.
  const { data: recent, error } = await supabase
    .from('trades')
    .select('id, symbol, symbol_temp, profit_loss, pnl, roi, trade_date, closed_at, setup, created_at')
    .eq('user_id', r.user_id)
    .is('deleted_at', null)
    .eq('trade_date', today)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ALERTS_PER_TICK);
  if (error || !recent?.length) return;

  for (const trade of recent) {
    const pnl = tradePnl(trade);
    if (pnl === 0 && trade.profit_loss == null && trade.pnl == null) continue; // still open
    const win = pnl > 0;
    await sendMessage(supabase, r.chat_id, render('trade_closed_alert', r.locale, {
      emoji: win ? '🟢' : '🔴',
      symbol: tradeSymbol(trade),
      pnl: fmtMoney(pnl),
      roi: trade.roi != null ? ` · ${trade.roi.toFixed(1)}%` : '',
      comment: '',
    }), {
      userId: r.user_id,
      messageType: 'alert',
      templateName: 'trade_closed_alert',
      refId: `trade:${trade.id}`,
    });
  }
}

// ── Tone (spec §13: blunt, numbers-first, never toxic-positive) ───────────

function digestComment(s: PeriodStats, locale: string): string {
  const pt = locale === 'pt';
  if (s.netPnl > 0 && s.losses === 0) return pt ? 'Dia limpo. Segue o plano.' : 'Clean day. Stick to the plan.';
  if (s.netPnl > 0) return pt ? 'Verde no fim. Revisa os losses mesmo assim.' : 'Green overall. Review the losses anyway.';
  if (s.losses >= 3) return pt ? 'Dia pesado. Amanhã só volta com plano escrito.' : 'Rough day. Come back tomorrow with a written plan.';
  if (s.netPnl < 0) return pt ? 'No vermelho. O que o diário diz sobre esses setups?' : 'In the red. What does the journal say about these setups?';
  return '';
}
