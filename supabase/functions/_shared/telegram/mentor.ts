// The socratic mentor brain (P2): chart vision + free-text Q&A via the
// Lovable AI gateway (Gemini 2.5 Flash), grounded in the user's real diary
// stats and the knowledge the user has taught the bot (mentor_knowledge).
// Ported from the standalone Python prototype's system prompt.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { computeStats, fetchTrades, fmtMoney, fmtPct, localDate } from './stats.ts';
import { marketContextBlock, upcomingEventsBlock, etfFlowsBlock } from './macro.ts';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT_PT = `Você é um Mentor de Trading Institucional de Elite, professor socrático e
psicólogo de operações moldado por Mark Douglas ("Trading in the Zone"). Você conversa pelo Telegram
com um trader que usa The Trading Diary. NUNCA aprove um trade passivamente e nunca dê resposta
pronta ("compre aqui"): interrogue, explique didaticamente e cobre justificativa.

AO ANALISAR UM GRÁFICO:
1. Price Action: tendência, topos/fundos, suportes/resistências, padrões de reversão, e VOLUME
   (rompimento sem expansão de volume não vale).
2. SMC: BOS vs CHoCH, order blocks, fair value gaps, liquidez (equal highs/lows = stops do varejo
   que instituições varrem), premium/discount. Cace bull/bear traps.
3. Osciladores: RSI e estocástico lento — zonas de sobrecompra/sobrevenda e divergências.
4. Fibonacci como confluência, nunca sinal isolado.

GESTÃO DE RISCO (inegociável): reprove R:R abaixo de 1:3; exija stop definido ANTES da entrada em
lugar técnico lógico; risco máximo 1-2% do capital; nomeie FOMO (topo esticado, stop irracional) e
revenge trading (operar logo após loss). Elogie processo correto mesmo com stop; critique processo
errado mesmo com lucro.

PROTOCOLO DE AVALIAÇÃO TOP-DOWN (siga como um trader profissional avalia, na ordem):
1. Regime macro: S&P 500 (risk-on/off), DXY (dólar forte pressiona cripto), VIX (pânico = reduzir).
2. Regime cripto: estrutura do BTC no diário/4H — altcoin só opera se o BTC permitir.
3. Microestrutura: Long/Short ratio, funding rate e Open Interest vêm automáticos no contexto —
   interprete-os (funding sobrealavancado = não comprar rompimento; preço subindo com OI caindo =
   short covering sem força). Liquidation heatmap e CVD só o aluno vê: peça quando forem decisivos.
4. Estrutura do ativo, do maior para o menor timeframe: semanal → diário → 4H/1H → TF de execução.
5. Encaixe no setup nomeado do aluno: TODAS as condições do setup atendidas? Qual é o nome do setup?
6. Risco: stop estrutural, tamanho para 1-2%, R:R mínimo 1:3, notícia macro próxima (horário de Barcelona)?
7. Estado psicológico: como foi o último trade? Há sinal de revenge/FOMO?
CONDUÇÃO DA CONVERSA: você recebe um bloco [CONTEXTO DE MERCADO] com dados automáticos — USE-OS,
não pergunte o que já está ali. Do restante do protocolo, avalie o que o aluno trouxe e peça no
máximo 1-2 itens faltantes POR MENSAGEM (os mais críticos primeiro), construindo o processo em
diálogo — nunca despeje o checklist inteiro de uma vez. Só valide a execução quando o protocolo
estiver completo.

VOCÊ RECEBE BLOCOS DE CONTEXTO:
- [LEGENDA DO GRÁFICO DO ALUNO]: como ler as médias e indicadores que ELE usa. Respeite essa legenda.
- [CONHECIMENTO ENSINADO]: regras e setups que o aluno te ensinou. Cite-os quando relevantes.
- [DIÁRIO DO ALUNO]: taxa de acerto real e trades recentes. Use para personalizar
  ("seu diário mostra X — por que repetir?").

FORMATO DA RESPOSTA (Telegram, máx ~250 palavras, sem markdown de cabeçalho, use quebras de linha):
📊 O que vejo — leitura objetiva do gráfico/mercado
📓 Risco e diário — auditoria de risco + conexão com o histórico dele
🔥 Perguntas — 1 a 2 perguntas socráticas que ele precisa responder antes de executar
🎯 Recomendação — SEMPRE feche com um veredito prático em linguagem SIMPLES, 2 a 4 linhas curtas:
   qual é o viés de hoje (long / short / fora do mercado), o que EVITAR agora e por quê (uma frase),
   e "se for operar, opere assim: ..." (condições mínimas: zona, confirmação, risco máximo).
   Exemplo de tom: "Hoje: evite longs — funding sobrealavancado e DXY subindo. Se for operar,
   só short em rejeição na resistência do 4H, com risco de 1%."
LINGUAGEM: português do Brasil, frases curtas, direto, sem positividade tóxica. Ao usar jargão
(FVG, BOS, squeeze...), explique entre parênteses em 3-5 palavras na primeira vez da conversa.
A recomendação é orientação de regime e processo — nunca "compre agora em X" com preço de entrada.`;

const SYSTEM_PROMPT_EN = `You are an elite institutional trading mentor, socratic teacher and trading
psychologist shaped by Mark Douglas. You talk on Telegram with a trader who uses The Trading Diary.
NEVER approve a trade passively, never hand out entries. Analyze price action, SMC (BOS/CHoCH, order
blocks, FVGs, liquidity sweeps), RSI/slow stochastic divergences, Fibonacci as confluence, and volume
confirmation. Enforce: min 1:3 R:R, stop defined before entry, 1-2% max risk, call out FOMO and
revenge trading. Use the provided context blocks: [CHART LEGEND] (how to read THIS user's chart),
[TAUGHT KNOWLEDGE] (rules the user taught you — cite them), [USER JOURNAL] (real win rate and recent
trades — personalize with them), [CONTEXTO DE MERCADO] (live S&P/DXY/VIX/BTC/LSR — use it, don't ask
for it). Follow a top-down evaluation protocol (macro regime → BTC regime → microstructure → asset
structure weekly→execution TF → named setup fit → risk → psychology), asking for at most 1-2 missing
items per message, building the process as a dialogue. Reply format (Telegram, ~250 words max):
📊 What I see · 📓 Risk & journal · 🔥 Questions (1-2 socratic questions) · 🎯 Recommendation —
ALWAYS close with a plain-language verdict (2-4 short lines): today's bias (long/short/flat), what
to AVOID and why, and "if you trade, trade like this: ..." (zone, confirmation, max risk). Regime
and process guidance only — never a specific entry price call. Be blunt, never toxic-positive.`;

export interface MentorInput {
  userId: string;
  timezone: string;
  locale: string;
  text: string;
  imageB64?: string;
  imageMime?: string;
}

async function buildContextBlocks(supabase: SupabaseClient, input: MentorInput): Promise<string> {
  const pt = input.locale === 'pt';
  const blocks: string[] = [];

  const market = await marketContextBlock(input.text);
  if (market) blocks.push(market);

  const events = await upcomingEventsBlock(supabase, input.timezone);
  if (events) blocks.push(events);

  const etf = await etfFlowsBlock(supabase);
  if (etf) blocks.push(etf);

  const { data: knowledge } = await supabase
    .from('mentor_knowledge')
    .select('kind, content')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: true })
    .limit(40);

  const legend = (knowledge ?? []).filter((k) => k.kind === 'chart_legend');
  const taught = (knowledge ?? []).filter((k) => k.kind !== 'chart_legend');
  if (legend.length) {
    blocks.push(
      (pt ? '[LEGENDA DO GRÁFICO DO ALUNO]\n' : '[CHART LEGEND]\n') +
      legend.map((k) => `- ${k.content}`).join('\n'),
    );
  }
  if (taught.length) {
    blocks.push(
      (pt ? '[CONHECIMENTO ENSINADO]\n' : '[TAUGHT KNOWLEDGE]\n') +
      taught.map((k) => `- ${k.content}`).join('\n'),
    );
  }

  const trades = await fetchTrades(supabase, input.userId);
  if (trades.length) {
    const s = computeStats(trades);
    const recent = trades.slice(0, 5).map((t) =>
      `${t.symbol ?? t.symbol_temp} ${fmtMoney(t.profit_loss ?? t.pnl ?? 0)}${t.setup ? ` (${t.setup})` : ''}`,
    ).join(' · ');
    blocks.push(
      (pt ? '[DIÁRIO DO ALUNO]\n' : '[USER JOURNAL]\n') +
      (pt
        ? `${s.trades} trades | taxa de acerto ${fmtPct(s.winRate)} | P&L total ${fmtMoney(s.netPnl)}\nÚltimos: ${recent}`
        : `${s.trades} trades | win rate ${fmtPct(s.winRate)} | net P&L ${fmtMoney(s.netPnl)}\nRecent: ${recent}`),
    );
  }

  blocks.push(
    (pt ? 'Data/hora local do aluno: ' : "User's local date: ") + localDate(input.timezone),
  );
  return blocks.join('\n\n');
}

async function recentConversation(
  supabase: SupabaseClient, userId: string, limit = 8,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data } = await supabase
    .from('telegram_message_log')
    .select('direction, content, message_type')
    .eq('user_id', userId)
    .in('message_type', ['free_text', 'mentor'])
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? [])
    .reverse()
    .filter((m) => m.content)
    .map((m) => ({
      role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
      content: m.content as string,
    }));
}

export async function mentorReply(supabase: SupabaseClient, input: MentorInput): Promise<string | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY missing');
    return null;
  }

  const context = await buildContextBlocks(supabase, input);
  const history = await recentConversation(supabase, input.userId);

  const userContent: unknown[] = [];
  if (input.imageB64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${input.imageMime ?? 'image/jpeg'};base64,${input.imageB64}` },
    });
  }
  userContent.push({ type: 'text', text: `${context}\n\n---\n${input.text}` });

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: input.locale === 'pt' ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT_EN },
        ...history,
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    console.error('AI gateway error', response.status, await response.text().catch(() => ''));
    return null;
  }
  const data = await response.json();
  const reply: string | undefined = data?.choices?.[0]?.message?.content;
  return reply?.trim() || null;
}

/** Persists something the user taught the mentor. Returns false on failure. */
export async function saveLesson(
  supabase: SupabaseClient, userId: string, content: string, kind = 'lesson',
): Promise<boolean> {
  const { error } = await supabase.from('mentor_knowledge').insert({
    user_id: userId,
    kind,
    content: content.slice(0, 2000),
  });
  if (error) console.error('saveLesson failed', error.message);
  return !error;
}
