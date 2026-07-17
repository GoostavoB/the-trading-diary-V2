// Telegram Bot API helpers + outbound message logging with dedup.
// Used by telegram-webhook and telegram-notifier.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface SendOptions {
  userId?: string | null;
  messageType: 'command' | 'digest' | 'alert' | 'free_text' | 'callback' | 'system';
  templateName?: string;
  /** Dedup key (e.g. 'daily:2026-07-17', 'trade:<id>'). If a log row with the
   *  same (user, template, ref) exists, the send is skipped. */
  refId?: string;
  replyMarkup?: unknown;
}

export async function sendMessage(
  supabase: SupabaseClient,
  chatId: number,
  text: string,
  opts: SendOptions,
): Promise<boolean> {
  if (opts.refId && opts.userId) {
    const { data: dup } = await supabase
      .from('telegram_message_log')
      .select('id')
      .eq('user_id', opts.userId)
      .eq('template_name', opts.templateName ?? '')
      .eq('ref_id', opts.refId)
      .eq('direction', 'outbound')
      .maybeSingle();
    if (dup) return false; // already sent
  }

  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(opts.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('sendMessage failed', res.status, JSON.stringify(body));
    return false;
  }

  await supabase.from('telegram_message_log').insert({
    user_id: opts.userId ?? null,
    chat_id: chatId,
    direction: 'outbound',
    message_type: opts.messageType,
    template_name: opts.templateName ?? null,
    ref_id: opts.refId ?? null,
    content: text.slice(0, 4000),
    telegram_message_id: body?.result?.message_id ?? null,
  }).then(({ error }) => {
    if (error) console.error('message_log insert failed', error.message);
  });

  return true;
}

export async function logInbound(
  supabase: SupabaseClient,
  chatId: number,
  userId: string | null,
  messageType: string,
  content: string,
): Promise<void> {
  const { error } = await supabase.from('telegram_message_log').insert({
    user_id: userId,
    chat_id: chatId,
    direction: 'inbound',
    message_type: messageType,
    content: content.slice(0, 4000),
  });
  if (error) console.error('inbound log failed', error.message);
}

/** Basic outbound rate limit: max N sends to a chat in the last minute. */
export async function isRateLimited(
  supabase: SupabaseClient,
  chatId: number,
  maxPerMinute = 20,
): Promise<boolean> {
  const { count } = await supabase
    .from('telegram_message_log')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId)
    .eq('direction', 'outbound')
    .gte('created_at', new Date(Date.now() - 60_000).toISOString());
  return (count ?? 0) >= maxPerMinute;
}
