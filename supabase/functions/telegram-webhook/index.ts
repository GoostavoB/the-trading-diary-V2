// Public webhook Telegram → bot. Deployed with --no-verify-jwt; authenticity
// is guaranteed by the X-Telegram-Bot-Api-Secret-Token header, which must
// match the TELEGRAM_WEBHOOK_SECRET secret (set on both sides).
//
// Routes /start deep links (account linking), P0 commands and free text.
// Spec: AI_TRADING_MENTOR_BOT_SPEC.md §3B, §8.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import {
  sendMessage, logInbound, isRateLimited, sendTyping, downloadPhotoB64,
} from '../_shared/telegram/api.ts';
import { render } from '../_shared/telegram/templates.ts';
import {
  computeStats, fetchTrades, fmtMoney, fmtPct, fmtTradeLine, localDate,
} from '../_shared/telegram/stats.ts';
import { mentorReply, saveLesson } from '../_shared/telegram/mentor.ts';

interface LinkedUser {
  user_id: string;
  timezone: string;
  locale: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  const expectedSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (expectedSecret && req.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) {
    console.error('Webhook call with bad secret token');
    return new Response('forbidden', { status: 403 });
  }

  const update = await req.json().catch(() => null);
  if (!update) return new Response('ok');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const message = update.message ?? update.callback_query?.message;
    if (!message?.chat?.id) return new Response('ok');

    const chatId: number = message.chat.id;
    const text: string = (update.message?.text ?? update.message?.caption ?? update.callback_query?.data ?? '').trim();
    const tgUsername: string | null = update.message?.from?.username ?? null;
    const photos: Array<{ file_id: string }> = update.message?.photo ?? [];
    const inboundMessageId: number | null = update.message?.message_id ?? null;

    const { data: linked } = await supabase
      .from('telegram_users')
      .select('user_id, timezone, locale')
      .eq('chat_id', chatId)
      .maybeSingle();

    // Telegram re-delivers updates if we take too long (LLM analyses can).
    // Skip anything we already logged as received.
    if (inboundMessageId) {
      const { data: seen } = await supabase
        .from('telegram_message_log')
        .select('id')
        .eq('chat_id', chatId)
        .eq('direction', 'inbound')
        .eq('telegram_message_id', inboundMessageId)
        .maybeSingle();
      if (seen) return new Response('ok');
    }

    const inboundType = text.startsWith('/') ? 'command' : 'free_text';
    await logInbound(
      supabase, chatId, linked?.user_id ?? null, inboundType,
      photos.length ? `[gráfico] ${text}` : text, inboundMessageId,
    );

    if (await isRateLimited(supabase, chatId)) {
      console.warn('Rate limited chat', chatId);
      return new Response('ok');
    }

    if (text.startsWith('/start')) {
      await handleStart(supabase, chatId, text, tgUsername, linked as LinkedUser | null);
    } else if (!linked) {
      await sendMessage(supabase, chatId, render('not_linked', 'en'), { messageType: 'system' });
    } else if (photos.length) {
      await handleChart(supabase, chatId, text, photos, linked as LinkedUser);
    } else {
      await handleLinked(supabase, chatId, text, linked as LinkedUser);
    }

    if (linked) {
      await supabase
        .from('telegram_users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('chat_id', chatId);
    }
  } catch (error) {
    console.error('telegram-webhook error', error);
  }

  // Always 200 — Telegram retries anything else, which would double-process.
  return new Response('ok');
});

async function handleStart(
  supabase: SupabaseClient,
  chatId: number,
  text: string,
  tgUsername: string | null,
  alreadyLinked: LinkedUser | null,
): Promise<void> {
  const token = text.split(' ')[1]?.trim();

  if (!token) {
    const template = alreadyLinked ? 'help' : 'not_linked';
    await sendMessage(supabase, chatId, render(template, alreadyLinked?.locale), { messageType: 'command' });
    return;
  }

  const { data: linkToken } = await supabase
    .from('telegram_link_tokens')
    .select('token, user_id, timezone, locale, expires_at, used_at')
    .eq('token', token)
    .maybeSingle();

  const expired = !linkToken || linkToken.used_at ||
    new Date(linkToken.expires_at).getTime() < Date.now();
  if (expired) {
    await sendMessage(supabase, chatId, render('link_invalid', alreadyLinked?.locale), { messageType: 'system' });
    return;
  }

  await supabase.from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);

  // Re-linking replaces any previous chat for this user (UNIQUE user_id).
  await supabase.from('telegram_users').delete().eq('user_id', linkToken.user_id);
  const { error: linkError } = await supabase.from('telegram_users').insert({
    user_id: linkToken.user_id,
    chat_id: chatId,
    telegram_username: tgUsername,
    timezone: linkToken.timezone ?? 'UTC',
    locale: linkToken.locale ?? 'en',
  });
  if (linkError) {
    console.error('link insert failed', linkError.message);
    await sendMessage(supabase, chatId, render('link_invalid', linkToken.locale), { messageType: 'system' });
    return;
  }

  await supabase.from('telegram_preferences')
    .upsert({ user_id: linkToken.user_id }, { onConflict: 'user_id', ignoreDuplicates: true });

  const { data: prefs } = await supabase
    .from('telegram_preferences')
    .select('daily_digest_hour_local')
    .eq('user_id', linkToken.user_id)
    .maybeSingle();

  await sendMessage(
    supabase, chatId,
    render('onboarding', linkToken.locale, { digestHour: prefs?.daily_digest_hour_local ?? 22 }),
    { userId: linkToken.user_id, messageType: 'system', templateName: 'onboarding' },
  );
}

async function handleLinked(
  supabase: SupabaseClient,
  chatId: number,
  text: string,
  user: LinkedUser,
): Promise<void> {
  const [command, ...args] = text.split(/\s+/);

  switch (command) {
    case '/help':
      await sendMessage(supabase, chatId, render('help', user.locale), { userId: user.user_id, messageType: 'command' });
      return;

    case '/today': {
      const today = localDate(user.timezone);
      const trades = await fetchTrades(supabase, user.user_id, today, today);
      if (!trades.length) {
        await sendMessage(supabase, chatId, render('today_empty', user.locale), { userId: user.user_id, messageType: 'command' });
        return;
      }
      const s = computeStats(trades);
      await sendMessage(supabase, chatId, render('daily_digest', user.locale, {
        date: today,
        pnl: fmtMoney(s.netPnl),
        trades: s.trades,
        wins: s.wins,
        losses: s.losses,
        best: fmtTradeLine(s.best),
        worst: fmtTradeLine(s.worst),
        comment: '',
      }), { userId: user.user_id, messageType: 'command' });
      return;
    }

    case '/week': {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 6 * 86_400_000);
      const from = localDate(user.timezone, weekAgo);
      const to = localDate(user.timezone, now);
      const s = computeStats(await fetchTrades(supabase, user.user_id, from, to));
      await sendMessage(supabase, chatId, render('weekly_digest', user.locale, {
        range: `${from} → ${to}`,
        pnl: fmtMoney(s.netPnl),
        trades: s.trades,
        wins: s.wins,
        losses: s.losses,
        winRate: fmtPct(s.winRate),
        best: fmtTradeLine(s.best),
        worst: fmtTradeLine(s.worst),
        comment: '',
      }), { userId: user.user_id, messageType: 'command' });
      return;
    }

    case '/stats': {
      const s = computeStats(await fetchTrades(supabase, user.user_id));
      await sendMessage(supabase, chatId, render('stats', user.locale, {
        trades: s.trades,
        winRate: fmtPct(s.winRate),
        pnl: fmtMoney(s.netPnl),
        avgRoi: s.avgRoi == null ? '—' : `${s.avgRoi.toFixed(2)}%`,
      }), { userId: user.user_id, messageType: 'command' });
      return;
    }

    case '/mute': {
      const hours = Math.min(Math.max(parseFloat(args[0]) || 2, 0.5), 48);
      const until = new Date(Date.now() + hours * 3_600_000);
      await supabase.from('telegram_preferences')
        .upsert({ user_id: user.user_id, mute_until: until.toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      const untilLocal = new Intl.DateTimeFormat(user.locale === 'pt' ? 'pt-BR' : 'en-US', {
        timeZone: user.timezone || 'UTC', hour: '2-digit', minute: '2-digit',
      }).format(until);
      await sendMessage(supabase, chatId, render('muted', user.locale, { until: untilLocal }), { userId: user.user_id, messageType: 'command' });
      return;
    }

    case '/unmute':
      await supabase.from('telegram_preferences')
        .upsert({ user_id: user.user_id, mute_until: null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      await sendMessage(supabase, chatId, render('unmuted', user.locale), { userId: user.user_id, messageType: 'command' });
      return;

    case '/lesson': {
      const lesson = text.replace(/^\/lesson\s*/, '').trim();
      if (!lesson) {
        await sendMessage(supabase, chatId,
          user.locale === 'pt'
            ? 'Me diz o que aprender. Ex.: /lesson quando o OI cai 5% antes de NY, order blocks de 15m falham'
            : 'Tell me what to learn. E.g.: /lesson when OI drops 5% before NY open, 15m order blocks fail',
          { userId: user.user_id, messageType: 'command' });
        return;
      }
      const saved = await saveLesson(supabase, user.user_id, lesson);
      await sendMessage(supabase, chatId,
        render(saved ? 'lesson_saved' : 'mentor_error', user.locale),
        { userId: user.user_id, messageType: 'command' });
      return;
    }

    default: {
      // Free text → socratic mentor (P2), grounded in journal + taught knowledge.
      await sendTyping(chatId);
      const reply = await mentorReply(supabase, {
        userId: user.user_id,
        timezone: user.timezone,
        locale: user.locale,
        text,
      });
      await sendMessage(supabase, chatId, reply ?? render('mentor_error', user.locale), {
        userId: user.user_id,
        messageType: 'mentor',
    plain: true,
        plain: true,
      });
    }
  }
}

async function handleChart(
  supabase: SupabaseClient,
  chatId: number,
  caption: string,
  photos: Array<{ file_id: string }>,
  user: LinkedUser,
): Promise<void> {
  await sendTyping(chatId);

  // Last entry = highest resolution. Image stays in memory only.
  const imageB64 = await downloadPhotoB64(photos[photos.length - 1].file_id);
  if (!imageB64) {
    await sendMessage(supabase, chatId, render('mentor_error', user.locale), {
      userId: user.user_id, messageType: 'mentor', plain: true,
    });
    return;
  }

  const defaultAsk = user.locale === 'pt'
    ? 'Analise este gráfico seguindo seu método socrático.'
    : 'Analyze this chart following your socratic method.';
  const reply = await mentorReply(supabase, {
    userId: user.user_id,
    timezone: user.timezone,
    locale: user.locale,
    text: caption || defaultAsk,
    imageB64,
    imageMime: 'image/jpeg',
  });

  await sendMessage(supabase, chatId, reply ?? render('mentor_error', user.locale), {
    userId: user.user_id,
    messageType: 'mentor',
    plain: true,
  });
}
