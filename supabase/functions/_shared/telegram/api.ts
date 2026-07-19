// Telegram Bot API helpers + outbound message logging with dedup.
// Used by telegram-webhook and telegram-notifier.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface SendOptions {
  userId?: string | null;
  messageType: 'command' | 'digest' | 'alert' | 'free_text' | 'callback' | 'system' | 'mentor';
  templateName?: string;
  /** Dedup key (e.g. 'daily:2026-07-17', 'trade:<id>'). If a log row with the
   *  same (user, template, ref) exists, the send is skipped. */
  refId?: string;
  replyMarkup?: unknown;
  /** Send as plain text (no parse_mode). Use for LLM output, which may contain
   *  characters that break Telegram's HTML parser. */
  plain?: boolean;
}

/** Limpa artefatos de markdown que os LLMs insistem em mandar — no Telegram em
 *  texto puro, "**negrito**" aparece com os asteriscos crus (feio). */
function sanitizePlain(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')        // cabeçalhos markdown
    .replace(/\*\*([^*\n]+)\*\*/g, '$1') // **negrito**
    .replace(/\*([^*\n]{1,80})\*/g, '$1') // *itálico* solto
    .replace(/__([^_\n]+)__/g, '$1')     // __negrito__
    .replace(/^\s*[*-]\s+/gm, '• ')      // bullets * e - viram •
    .replace(/```[a-z]*\n?/g, '')        // cercas de código
    .trim();
}

/** Divide texto no limite do Telegram (4096), cortando em quebra de linha. */
function chunksOf(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

/** Envia mensagem (dividida se passar de 4096 chars) e retorna o message_id do
 *  Telegram da ÚLTIMA parte (null se pulada/falhou) — os botões vão nela. */
export async function sendMessage(
  supabase: SupabaseClient,
  chatId: number,
  text: string,
  opts: SendOptions,
): Promise<number | null> {
  if (opts.refId && opts.userId) {
    const { data: dup } = await supabase
      .from('telegram_message_log')
      .select('id')
      .eq('user_id', opts.userId)
      .eq('template_name', opts.templateName ?? '')
      .eq('ref_id', opts.refId)
      .eq('direction', 'outbound')
      .maybeSingle();
    if (dup) return null; // already sent
  }

  const finalText = opts.plain ? sanitizePlain(text) : text;
  const parts = chunksOf(finalText);
  let messageId: number | null = null;
  for (let i = 0; i < parts.length; i++) {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: parts[i],
        ...(opts.plain ? {} : { parse_mode: 'HTML' }),
        disable_web_page_preview: true,
        ...(opts.replyMarkup && i === parts.length - 1 ? { reply_markup: opts.replyMarkup } : {}),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('sendMessage failed', res.status, JSON.stringify(body));
      return messageId; // partes já enviadas ficam; não trava o fluxo
    }
    messageId = body?.result?.message_id ?? messageId;
  }

  await supabase.from('telegram_message_log').insert({
    user_id: opts.userId ?? null,
    chat_id: chatId,
    direction: 'outbound',
    message_type: opts.messageType,
    template_name: opts.templateName ?? null,
    ref_id: opts.refId ?? null,
    content: finalText.slice(0, 4000),
    telegram_message_id: messageId,
  }).then(({ error }) => {
    if (error) console.error('message_log insert failed', error.message);
  });

  return messageId;
}

export async function logInbound(
  supabase: SupabaseClient,
  chatId: number,
  userId: string | null,
  messageType: string,
  content: string,
  telegramMessageId: number | null = null,
): Promise<void> {
  const { error } = await supabase.from('telegram_message_log').insert({
    user_id: userId,
    chat_id: chatId,
    direction: 'inbound',
    message_type: messageType,
    content: content.slice(0, 4000),
    telegram_message_id: telegramMessageId,
  });
  if (error) console.error('inbound log failed', error.message);
}

/** Acknowledges an inline-button tap so Telegram stops the loading spinner. */
export async function answerCallback(callbackQueryId: string): Promise<void> {
  await fetch(`${API_BASE}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  }).catch(() => {});
}

/** Shows "typing…" in the chat while the mentor thinks. Fire-and-forget. */
export async function sendTyping(chatId: number): Promise<void> {
  await fetch(`${API_BASE}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  }).catch(() => {});
}

/** Downloads a Telegram photo straight into memory and returns it as base64.
 *  Never touches disk. Returns null on any failure. */
export async function downloadPhotoB64(fileId: string): Promise<string | null> {
  try {
    const metaRes = await fetch(`${API_BASE}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const meta = await metaRes.json();
    const filePath: string | undefined = meta?.result?.file_path;
    if (!filePath) return null;

    const fileRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
    if (!fileRes.ok) return null;
    const bytes = new Uint8Array(await fileRes.arrayBuffer());

    // Chunked conversion: String.fromCharCode(...bytes) overflows the stack on big images.
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  } catch (error) {
    console.error('downloadPhotoB64 failed', error);
    return null;
  }
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
