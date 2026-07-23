// Public webhook Telegram → bot. Deployed with --no-verify-jwt; authenticity
// is guaranteed by the X-Telegram-Bot-Api-Secret-Token header, which must
// match the TELEGRAM_WEBHOOK_SECRET secret (set on both sides).
//
// Routes /start deep links (account linking), P0 commands and free text.
// Spec: AI_TRADING_MENTOR_BOT_SPEC.md §3B, §8.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import {
  sendMessage, logInbound, isRateLimited, sendTyping, downloadPhotoB64, answerCallback,
} from '../_shared/telegram/api.ts';
import {
  extractTradesFromImage, previewText, saveTrades, applyTradeContext, type ExtractedTrade,
} from '../_shared/telegram/tradeCapture.ts';
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

    const callbackId: string | undefined = update.callback_query?.id;
    if (callbackId) await answerCallback(callbackId);

    if (text.startsWith('/start')) {
      await handleStart(supabase, chatId, text, tgUsername, linked as LinkedUser | null);
    } else if (!linked) {
      await sendMessage(supabase, chatId, render('not_linked', 'en'), { messageType: 'system' });
    } else if (text.startsWith('tgsave:') || text === 'tgdiscard') {
      await handleTradeSaveCallback(supabase, chatId, text, linked as LinkedUser);
    } else if (!photos.length && update.message?.reply_to_message?.message_id &&
        await handleTradeContextReply(
          supabase, chatId, update.message.reply_to_message.message_id, text, linked as LinkedUser)) {
      // resposta (reply) à confirmação de trades salvos — contexto aplicado
    } else if (photos.length) {
      // TODA foto passa pelo coletor — só a última da leva dispara a análise.
      await handlePhotoBuffer(
        supabase, chatId, photos, text, inboundMessageId, linked as LinkedUser);
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

    case '/banca': {
      // Banca segregada de futuros — vira PERFIL no cérebro; a mão passa a
      // sair em % E em dólares.
      const value = Number(args.join('').replace(/\D/g, ''));
      const pt = user.locale === 'pt';
      if (!Number.isFinite(value) || value <= 0) {
        await sendMessage(supabase, chatId,
          pt ? 'Me diz o valor da tua banca segregada de futuros, em dólares. Ex.: /banca 5000'
             : 'Tell me your segregated futures bankroll in dollars. E.g.: /banca 5000',
          { userId: user.user_id, messageType: 'command', plain: true });
        return;
      }
      await supabase.from('mentor_knowledge')
        .delete()
        .eq('user_id', user.user_id)
        .like('content', 'BANCA DE FUTUROS:%');
      await supabase.from('mentor_knowledge').insert({
        user_id: user.user_id,
        kind: 'profile',
        content: `BANCA DE FUTUROS: $${value.toLocaleString('en-US')} (informada em ${localDate(user.timezone)}). ` +
          'Toda sugestão de mão deve sair em % E em dólares sobre este valor.',
      });
      await sendMessage(supabase, chatId,
        pt ? `🏦 Banca registrada: $${value.toLocaleString('en-US')}. A partir de agora a mão sai em % e em $. Atualiza quando mudar: /banca <valor>.`
           : `🏦 Bankroll saved: $${value.toLocaleString('en-US')}. Hand sizing now comes in % and $. Update anytime: /banca <value>.`,
        { userId: user.user_id, messageType: 'command', plain: true });
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
      });
    }
  }
}

function wantsTradeCapture(caption: string): boolean {
  return /\b(registr\w*|salvar?|sobe|subir|adicionar?|di[aá]rio|log)\b/i.test(caption);
}

// Coletor de fotos com JANELA DE SILÊNCIO. O Telegram entrega cada foto como
// update separado (e divide álbuns grandes em levas), o que fazia o bot
// analisar em pedaços sem coerência. Agora: toda foto entra no buffer; cada
// uma espera QUIET_MS; só a que NÃO viu ninguém chegar depois dela (a última)
// junta TUDO que está pendente no chat e dispara UMA análise integrada.
const QUIET_MS = 12_000;
const MAX_IMAGES = 16;

async function handlePhotoBuffer(
  supabase: SupabaseClient,
  chatId: number,
  photos: Array<{ file_id: string }>,
  caption: string,
  messageId: number | null,
  user: LinkedUser,
): Promise<void> {
  const fileId = photos[photos.length - 1].file_id; // maior resolução desta foto
  const myMid = messageId ?? 0;
  await supabase.from('telegram_message_log').insert({
    user_id: user.user_id,
    chat_id: chatId,
    direction: 'inbound',
    message_type: 'album_part',
    content: JSON.stringify({ file_id: fileId, caption, mid: myMid }),
  });

  await new Promise((resolve) => setTimeout(resolve, QUIET_MS));

  const { data } = await supabase
    .from('telegram_message_log')
    .select('id, content')
    .eq('chat_id', chatId)
    .eq('message_type', 'album_part');
  const rows = (data ?? [])
    .map((r) => {
      try { return { rowId: r.id as string, ...JSON.parse(r.content as string) }; }
      catch { return null; }
    })
    .filter((p): p is { rowId: string; file_id: string; caption: string; mid: number } => !!p)
    .sort((a, b) => a.mid - b.mid);
  if (!rows.length) return;
  // Chegou foto DEPOIS de mim durante a janela? Então não sou o último — saio
  // calado e deixo o último juntar tudo.
  if (rows.some((p) => p.mid > myMid)) return;

  // Sou o último: consumo o buffer inteiro (marca para não reanalisar depois).
  await supabase.from('telegram_message_log')
    .update({ message_type: 'album_part_used' })
    .in('id', rows.map((p) => p.rowId));

  if (rows.length > MAX_IMAGES) {
    console.warn(`photo buffer: ${rows.length} fotos, analisando as ${MAX_IMAGES} primeiras`);
  }
  const caption_ = rows.map((p) => p.caption).filter(Boolean).join(' ').trim();
  const images: string[] = [];
  for (const p of rows.slice(0, MAX_IMAGES)) {
    const b64 = await downloadPhotoB64(p.file_id);
    if (b64) images.push(b64);
  }
  if (!images.length) return;

  if (wantsTradeCapture(caption_)) {
    await handleTradeCaptureImages(supabase, chatId, images, user);
  } else {
    await handleChartImages(supabase, chatId, caption_, images, user);
  }
}

async function handleTradeCaptureImages(
  supabase: SupabaseClient,
  chatId: number,
  images: string[],
  user: LinkedUser,
): Promise<void> {
  await sendTyping(chatId);
  const trades = images.length ? await extractTradesFromImage(images) : null;

  if (trades === null) {
    await sendMessage(supabase, chatId, render('mentor_error', user.locale), {
      userId: user.user_id, messageType: 'system', plain: true,
    });
    return;
  }
  if (!trades.length) {
    await sendMessage(supabase, chatId,
      user.locale === 'pt'
        ? 'Não achei trade FECHADO nesse print. Se era um gráfico para análise, manda sem a palavra "registra".'
        : 'No CLOSED trade found in that screenshot. If it was a chart for analysis, send it without the word "log".',
      { userId: user.user_id, messageType: 'system', plain: true });
    return;
  }

  // Guarda a extração no log e referencia o id no botão — o insert no diário
  // só acontece depois do ✅ do usuário.
  const { data: logRow, error } = await supabase
    .from('telegram_message_log')
    .insert({
      user_id: user.user_id,
      chat_id: chatId,
      direction: 'outbound',
      message_type: 'trade_preview',
      content: JSON.stringify(trades),
    })
    .select('id')
    .single();
  if (error || !logRow) {
    console.error('trade_preview log failed', error?.message);
    await sendMessage(supabase, chatId, render('mentor_error', user.locale), {
      userId: user.user_id, messageType: 'system', plain: true,
    });
    return;
  }

  const pt = user.locale === 'pt';
  await sendMessage(supabase, chatId, previewText(trades, user.locale), {
    userId: user.user_id,
    messageType: 'system',
    plain: true,
    replyMarkup: {
      inline_keyboard: [[
        { text: pt ? '✅ Salvar no diário' : '✅ Save to journal', callback_data: `tgsave:${logRow.id}` },
        { text: pt ? '❌ Descartar' : '❌ Discard', callback_data: 'tgdiscard' },
      ]],
    },
  });
}

async function handleTradeSaveCallback(
  supabase: SupabaseClient,
  chatId: number,
  data: string,
  user: LinkedUser,
): Promise<void> {
  const pt = user.locale === 'pt';
  if (data === 'tgdiscard') {
    await sendMessage(supabase, chatId, pt ? 'Descartado. Nada foi salvo.' : 'Discarded. Nothing saved.', {
      userId: user.user_id, messageType: 'system', plain: true,
    });
    return;
  }

  const previewId = Number(data.slice('tgsave:'.length));
  const { data: row } = await supabase
    .from('telegram_message_log')
    .select('id, content, message_type')
    .eq('id', previewId)
    .eq('user_id', user.user_id)
    .eq('message_type', 'trade_preview')
    .maybeSingle();
  if (!row?.content) {
    await sendMessage(supabase, chatId,
      pt ? 'Esse preview expirou — manda o print de novo.' : 'That preview expired — send the screenshot again.',
      { userId: user.user_id, messageType: 'system', plain: true });
    return;
  }

  // Consome o preview para o botão não salvar duas vezes.
  await supabase.from('telegram_message_log')
    .update({ message_type: 'trade_preview_used' })
    .eq('id', row.id);

  let trades: ExtractedTrade[] = [];
  try {
    trades = JSON.parse(row.content);
  } catch {
    trades = [];
  }
  const savedIds = await saveTrades(supabase, user.user_id, user.timezone, trades);
  const confirmationId = await sendMessage(supabase, chatId,
    pt
      ? `✅ ${savedIds.length} trade(s) salvos no diário — já aparecem no seu dashboard.\n\n👉 Agora RESPONDE esta mensagem (reply) dizendo qual foi o setup e como você estava se sentindo — eu completo o registro.\nEx.: "Setup da Vitória no 4H, estava tranquilo, saí na parcial"`
      : `✅ ${savedIds.length} trade(s) saved to the journal — already on your dashboard.\n\n👉 Now REPLY to this message with the setup used and how you felt — I'll complete the record.\nE.g.: "Vitória setup on the 4H, felt calm, took partials"`,
    { userId: user.user_id, messageType: 'system', plain: true });

  // Vincula a mensagem de confirmação aos ids salvos: a resposta (reply) do
  // usuário a ela vira setup/emoção/notas desses trades.
  if (confirmationId && savedIds.length) {
    await supabase.from('telegram_message_log').insert({
      user_id: user.user_id,
      chat_id: chatId,
      direction: 'outbound',
      message_type: 'trade_saved_ref',
      content: JSON.stringify(savedIds),
      telegram_message_id: confirmationId,
    });
  }
}

/** Trata a resposta (reply) à confirmação de trades salvos.
 *  Retorna false se o reply não era para uma confirmação nossa. */
async function handleTradeContextReply(
  supabase: SupabaseClient,
  chatId: number,
  repliedMessageId: number,
  text: string,
  user: LinkedUser,
): Promise<boolean> {
  const { data: ref } = await supabase
    .from('telegram_message_log')
    .select('content')
    .eq('chat_id', chatId)
    .eq('message_type', 'trade_saved_ref')
    .eq('telegram_message_id', repliedMessageId)
    .maybeSingle();
  if (!ref?.content) return false;

  let tradeIds: string[] = [];
  try {
    tradeIds = JSON.parse(ref.content);
  } catch {
    return false;
  }
  if (!tradeIds.length || !text.trim()) return false;

  await sendTyping(chatId);
  const result = await applyTradeContext(supabase, user.user_id, tradeIds, text.trim());
  const pt = user.locale === 'pt';
  if (!result) {
    await sendMessage(supabase, chatId, render('mentor_error', user.locale), {
      userId: user.user_id, messageType: 'system', plain: true,
    });
    return true;
  }
  const parts: string[] = [];
  if (result.setup) parts.push(pt ? `setup: ${result.setup}` : `setup: ${result.setup}`);
  if (result.emotion) parts.push(pt ? `emoção: ${result.emotion}` : `emotion: ${result.emotion}`);
  parts.push(pt ? 'notas salvas' : 'notes saved');
  await sendMessage(supabase, chatId,
    (pt ? `📝 Registro completo — ${parts.join(' · ')}.` : `📝 Record completed — ${parts.join(' · ')}.`) +
    (result.setup ? '' : (pt ? '\n(Não identifiquei o setup — se quiser, edita no site.)' : '\n(No setup identified — edit on the site if needed.)')),
    { userId: user.user_id, messageType: 'system', plain: true });
  return true;
}

async function handleChartImages(
  supabase: SupabaseClient,
  chatId: number,
  caption: string,
  images: string[],
  user: LinkedUser,
): Promise<void> {
  await sendTyping(chatId);
  if (!images.length) {
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
    imagesB64: images,
    imageMime: 'image/jpeg',
  });

  await sendMessage(supabase, chatId, reply ?? render('mentor_error', user.locale), {
    userId: user.user_id,
    messageType: 'mentor',
    plain: true,
  });
}
