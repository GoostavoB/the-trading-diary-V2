// Contexto de mercado buscado automaticamente para o mentor: S&P 500, DXY,
// VIX (Yahoo Finance, endpoint público), BTC (CoinGecko) e Long/Short ratio
// (Binance Futures, público). Cada fonte falha de forma independente — o
// mentor recebe o que estiver disponível e pede ao aluno o que faltar.

interface Quote {
  label: string;
  value: string;
}

async function fetchYahoo(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Number(data?.chart?.result?.[0]?.meta?.regularMarketPrice) || null;
  } catch {
    return null;
  }
}

async function fetchBtc(): Promise<string | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const btc = (await res.json())?.bitcoin;
    if (!btc?.usd) return null;
    const chg = typeof btc.usd_24h_change === 'number' ? ` (${btc.usd_24h_change >= 0 ? '+' : ''}${btc.usd_24h_change.toFixed(1)}% 24h)` : '';
    return `US$ ${Math.round(btc.usd).toLocaleString('en-US')}${chg}`;
  } catch {
    return null;
  }
}

async function fetchBinanceLSR(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const r = rows?.[0];
    if (!r) return null;
    const ratio = Number(r.longShortRatio);
    const longPct = Number(r.longAccount) * 100;
    const bias = ratio > 1.5 ? 'MUITO enviesado para long — risco de long squeeze'
      : ratio > 1.1 ? 'enviesado para long'
      : ratio < 0.9 ? 'enviesado para short'
      : 'equilibrado';
    return `${ratio.toFixed(2)} (${longPct.toFixed(0)}% em long, 1h) — ${bias}`;
  } catch {
    return null;
  }
}

async function fetchBinanceFunding(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rate = Number((await res.json())?.lastFundingRate);
    if (!Number.isFinite(rate)) return null;
    const pct = rate * 100;
    const read = pct <= 0 ? 'NEGATIVO — shorts pagando, terreno de short squeeze'
      : pct < 0.02 ? 'neutro/levemente altista (baseline)'
      : pct < 0.05 ? 'aquecido em longs'
      : 'SOBREALAVANCADO em longs — não comprar rompimento, risco de long squeeze';
    return `${pct.toFixed(4)}% por 8h — ${read}`;
  } catch {
    return null;
  }
}

async function fetchBinanceOIDelta(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=25`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const first = Number(rows[0].sumOpenInterest);
    const last = Number(rows[rows.length - 1].sumOpenInterest);
    if (!first || !last) return null;
    const chg = ((last - first) / first) * 100;
    const dir = chg > 1 ? 'subindo (capital novo entrando)' : chg < -1 ? 'caindo (posições fechando — movimento sem força orgânica se o preço sobe)' : 'estável';
    return `${chg >= 0 ? '+' : ''}${chg.toFixed(1)}% em 24h — ${dir}`;
  } catch {
    return null;
  }
}

async function fetchDominance(): Promise<string | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const pct = (await res.json())?.data?.market_cap_percentage;
    if (!pct?.btc) return null;
    const parts = [`BTC.D ${pct.btc.toFixed(1)}%`];
    if (pct.usdt) parts.push(`USDT.D ${pct.usdt.toFixed(1)}%`);
    return parts.join(' · ');
  } catch {
    return null;
  }
}

/** Bloco [CONTEXTO DE MERCADO] injetado em toda análise do mentor.
 *  Retorna null se absolutamente nada estiver disponível. */
export async function marketContextBlock(symbolHint?: string): Promise<string | null> {
  const lsrSymbol = normalizeLsrSymbol(symbolHint);
  const [spx, vix, dxy, btc, lsr, funding, oi, dom] = await Promise.all([
    fetchYahoo('^GSPC'),
    fetchYahoo('^VIX'),
    fetchYahoo('DX-Y.NYB'),
    fetchBtc(),
    fetchBinanceLSR(lsrSymbol),
    fetchBinanceFunding(lsrSymbol),
    fetchBinanceOIDelta(lsrSymbol),
    fetchDominance(),
  ]);

  const quotes: Quote[] = [];
  if (spx) quotes.push({ label: 'S&P 500', value: `${Math.round(spx).toLocaleString('en-US')} pts` });
  if (dxy) quotes.push({ label: 'DXY (dólar)', value: dxy.toFixed(2) });
  if (vix) {
    const read = vix < 17 ? 'volatilidade baixa' : vix < 25 ? 'volatilidade elevada' : 'PÂNICO — reduzir tamanho';
    quotes.push({ label: 'VIX', value: `${vix.toFixed(1)} — ${read}` });
  }
  if (btc) quotes.push({ label: 'Bitcoin', value: btc });
  if (dom) quotes.push({ label: 'Dominância', value: dom });
  if (lsr) quotes.push({ label: `Long/Short ratio ${lsrSymbol}`, value: lsr });
  if (funding) quotes.push({ label: `Funding rate ${lsrSymbol}`, value: funding });
  if (oi) quotes.push({ label: `Open Interest ${lsrSymbol}`, value: oi });

  if (!quotes.length) return null;
  return '[CONTEXTO DE MERCADO — buscado automaticamente agora]\n' +
    quotes.map((q) => `- ${q.label}: ${q.value}`).join('\n');
}

/** BTCUSDT por padrão; se o texto do aluno citar um par da Binance (ex.
 *  "ETH", "SOLUSDT"), usa o LSR desse par. */
function normalizeLsrSymbol(hint?: string): string {
  if (!hint) return 'BTCUSDT';
  const m = hint.toUpperCase().match(/\b([A-Z]{2,10})(USDT)?\b/g) ?? [];
  const KNOWN = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT'];
  for (const token of m) {
    const base = token.replace(/USDT$/, '');
    if (KNOWN.includes(base)) return `${base}USDT`;
  }
  return 'BTCUSDT';
}
