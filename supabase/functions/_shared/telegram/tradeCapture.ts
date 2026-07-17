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
  closed_at: string | null;
  broker: string | null;
}

const EXTRACT_PROMPT = `Extract ALL closed trades visible in this exchange screenshot.
Reply with ONLY a JSON array, no markdown, no commentary:
[{"symbol":"BTCUSDT","side":"long|short","entry_price":0,"exit_price":0,"profit_loss":0,"roi":0,"leverage":0,"closed_at":"YYYY-MM-DD HH:mm or null","broker":"exchange name or null"}]
Rules: numbers as plain numbers (no $ or %); profit_loss is the realized PnL in USD (negative for losses);
roi is the percentage number; use null for anything not visible; if no closed trades are visible, reply [].`;

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
          { type: 'text', text: EXTRACT_PROMPT },
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

/** Grava os trades extraídos (já confirmados) no diário. Retorna quantos entraram. */
export async function saveTrades(
  supabase: SupabaseClient,
  userId: string,
  timezone: string,
  trades: ExtractedTrade[],
): Promise<number> {
  let saved = 0;
  for (const t of trades) {
    const tradeDate = t.closed_at?.slice(0, 10) ?? localDate(timezone);
    const { error } = await supabase.from('trades').insert({
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
      broker: t.broker,
      trade_date: tradeDate,
      closed_at: t.closed_at,
      exchange_source: 'telegram',
      xp_awarded: false,
    });
    if (error) console.error('saveTrades insert failed', error.message);
    else saved++;
  }
  return saved;
}
