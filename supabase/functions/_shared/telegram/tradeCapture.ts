// Captura de trades por print no Telegram: extrai trades fechados de um
// screenshot de corretora (visão via gateway Lovable), mostra preview e só
// grava na tabela `trades` após o usuário confirmar no botão — print mal
// lido nunca suja o dashboard.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { localDate } from './stats.ts';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

export interface ExtractedTrade {
  symbol: string;
  side: 'long' | 'short' | null;
  entry_price: number | null;
  exit_price: number | null;
  profit_loss: number | null;
  roi: number | null;
  leverage: number | null;
  margin: number | null;
  position_size: number | null;
  trading_fee: number | null;
  funding_fee: number | null;
  opened_at: string | null;
  closed_at: string | null;
  broker: string | null;
}

function extractPrompt(): string {
  const year = new Date().getUTCFullYear();
  return `Extract ALL closed trades that are FULLY visible in this exchange screenshot.
CRITICAL: IGNORE any trade that is partially cut off at the top or bottom edge of the image —
only include trades where you can see the complete card/row.
Reply with ONLY a JSON array, no markdown, no commentary:
[{"symbol":"BTCUSDT","side":"long|short","entry_price":0,"exit_price":0,"profit_loss":0,"roi":0,"leverage":0,"margin":0,"position_size":0,"trading_fee":0,"funding_fee":0,"opened_at":"YYYY-MM-DD HH:mm:ss or null","closed_at":"YYYY-MM-DD HH:mm:ss or null","broker":"exchange name or null"}]
Rules: numbers as plain numbers (no $, %, commas or x); profit_loss is realized PnL in USD (negative for
losses); roi is the percentage number; leverage from badges like "15X"; position_size = total volume;
dates: if the year is not shown (e.g. "07/16 20:01"), assume ${year}; use null for anything not
visible; if no fully-visible closed trades exist, reply [].`;
}

export async function extractTradesFromImage(
  imageB64: string,
  imageMime = 'image/jpeg',
): Promise<ExtractedTrade[] | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageB64}` } },
          { type: 'text', text: extractPrompt() },
        ],
      }],
    }),
  });
  if (!response.ok) {
    console.error('trade extraction gateway error', response.status);
    return null;
  }

  const raw: string = (await response.json())?.choices?.[0]?.message?.content ?? '';
  try {
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start < 0 || end < 0) return [];
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.symbol === 'string' && t.symbol.trim())
      .slice(0, 10)
      .map((t) => ({
        symbol: String(t.symbol).toUpperCase().trim(),
        side: t.side === 'long' || t.side === 'short' ? t.side : null,
        entry_price: numOrNull(t.entry_price),
        exit_price: numOrNull(t.exit_price),
        profit_loss: numOrNull(t.profit_loss),
        roi: numOrNull(t.roi),
        leverage: numOrNull(t.leverage),
        margin: numOrNull(t.margin),
        position_size: numOrNull(t.position_size),
        trading_fee: numOrNull(t.trading_fee),
        funding_fee: numOrNull(t.funding_fee),
        opened_at: typeof t.opened_at === 'string' ? t.opened_at : null,
        closed_at: typeof t.closed_at === 'string' ? t.closed_at : null,
        broker: typeof t.broker === 'string' ? t.broker : null,
      }));
  } catch (error) {
    console.error('trade extraction parse failed', error, raw.slice(0, 200));
    return null;
  }
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function previewText(trades: ExtractedTrade[], locale: string): string {
  const pt = locale === 'pt';
  const lines = trades.map((t, i) => {
    const pnl = t.profit_loss != null
      ? `${t.profit_loss > 0 ? '+' : ''}$${Math.abs(t.profit_loss).toFixed(2)}`.replace('+$', '+$')
      : '?';
    const roi = t.roi != null ? ` (${t.roi > 0 ? '+' : ''}${t.roi.toFixed(1)}%)` : '';
    const side = t.side ? ` ${t.side.toUpperCase()}` : '';
    return `${i + 1}. ${t.symbol}${side} → ${t.profit_loss != null && t.profit_loss < 0 ? '-' : ''}${pnl.replace('-', '')}${roi}`;
  });
  return (pt
    ? `📥 Encontrei ${trades.length} trade(s) no print:\n\n`
    : `📥 Found ${trades.length} trade(s) in the screenshot:\n\n`)
    + lines.join('\n')
    + (pt ? '\n\nSalvar no diário?' : '\n\nSave to the journal?');
}

/** Grava os trades extraídos (já confirmados) no diário.
 *  Retorna os ids inseridos — usados para completar setup/emoção depois. */
export async function saveTrades(
  supabase: SupabaseClient,
  userId: string,
  timezone: string,
  trades: ExtractedTrade[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const t of trades) {
    const tradeDate = t.closed_at?.slice(0, 10) ?? localDate(timezone);
    const duration = computeDuration(t.opened_at, t.closed_at);
    const { data, error } = await supabase.from('trades').insert({
      user_id: userId,
      symbol: t.symbol,
      symbol_temp: t.symbol,
      side: t.side,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      profit_loss: t.profit_loss,
      pnl: t.profit_loss,
      roi: t.roi,
      leverage: t.leverage,
      margin: t.margin,
      position_size: t.position_size,
      trading_fee: t.trading_fee,
      funding_fee: t.funding_fee,
      broker: t.broker,
      trade_date: tradeDate,
      opened_at: t.opened_at,
      closed_at: t.closed_at,
      ...duration,
      exchange_source: 'telegram',
      xp_awarded: false,
    }).select('id').single();
    if (error) console.error('saveTrades insert failed', error.message);
    else if (data?.id) ids.push(data.id);
  }
  return ids;
}

function computeDuration(openedAt: string | null, closedAt: string | null): {
  duration_days: number | null;
  duration_hours: number | null;
  duration_minutes: number | null;
} {
  if (!openedAt || !closedAt) {
    return { duration_days: null, duration_hours: null, duration_minutes: null };
  }
  const diffMs = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return { duration_days: null, duration_hours: null, duration_minutes: null };
  }
  const totalMin = Math.round(diffMs / 60000);
  return {
    duration_days: Math.floor(totalMin / 1440),
    duration_hours: Math.floor((totalMin % 1440) / 60),
    duration_minutes: totalMin % 60,
  };
}

/** Interpreta a resposta do trader ("foi o Setup Lamborghini, estava tranquilo")
 *  e completa setup/emoção/notas nos trades recém-salvos. */
export async function applyTradeContext(
  supabase: SupabaseClient,
  userId: string,
  tradeIds: string[],
  text: string,
): Promise<{ setup: string | null; emotion: string | null } | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  let setup: string | null = null;
  let emotion: string | null = null;

  if (apiKey) {
    try {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `O trader descreveu o trade que acabou de registrar: "${text}".
Responda SOMENTE JSON: {"setup":"nome do setup citado (ex: Vitória, Scalp do Vitão, Lamborghini) ou null","emotion":"UMA palavra em português sobre o estado emocional (ex: tranquilo, ansioso, confiante, FOMO, revenge) ou null"}`,
          }],
        }),
      });
      if (res.ok) {
        const raw: string = (await res.json())?.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(raw.replace(/```(?:json)?/gi, '').trim());
        setup = typeof parsed.setup === 'string' && parsed.setup !== 'null' ? parsed.setup : null;
        emotion = typeof parsed.emotion === 'string' && parsed.emotion !== 'null' ? parsed.emotion : null;
      }
    } catch (error) {
      console.error('applyTradeContext parse failed', error);
    }
  }

  const update: Record<string, string> = { notes: text.slice(0, 1000) };
  if (setup) update.setup = setup;
  if (emotion) update.emotional_tag = emotion;

  const { error } = await supabase
    .from('trades')
    .update(update)
    .in('id', tradeIds)
    .eq('user_id', userId);
  if (error) {
    console.error('applyTradeContext update failed', error.message);
    return null;
  }
  return { setup, emotion };
}
