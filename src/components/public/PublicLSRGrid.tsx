import { useEffect, useState, useCallback } from 'react';

/**
 * Grid público e simplificado de Long/Short Ratio + Open Interest.
 * Os dados vêm da API pública de futuros da Binance direto do navegador —
 * não há chamada ao backend, portanto nenhuma policy de RLS bloqueia visitantes anônimos.
 */

export type PublicSignal = 'avoid-buy' | 'avoid-sell' | 'longs' | 'shorts' | 'neutral' | 'no-data';

export interface PublicAsset {
  symbol: string;
  ticker: string;
  color: string;
  namePt: string;
  nameEn: string;
  slug: string;
}

export const PUBLIC_ASSETS: PublicAsset[] = [
  { symbol: 'BTCUSDT', ticker: 'BTC', color: '#F7931A', namePt: 'Bitcoin', nameEn: 'Bitcoin', slug: 'bitcoin' },
  { symbol: 'ETHUSDT', ticker: 'ETH', color: '#627EEA', namePt: 'Ethereum', nameEn: 'Ethereum', slug: 'ethereum' },
  { symbol: 'PAXGUSDT', ticker: 'XAU', color: '#D4AF37', namePt: 'Ouro', nameEn: 'Gold', slug: 'ouro-gold' },
  { symbol: 'XAGUSDT', ticker: 'XAG', color: '#C0C0C0', namePt: 'Prata', nameEn: 'Silver', slug: 'prata-silver' },
  { symbol: 'BNBUSDT', ticker: 'BNB', color: '#F3BA2F', namePt: 'BNB', nameEn: 'BNB', slug: 'bnb' },
  { symbol: 'SOLUSDT', ticker: 'SOL', color: '#14F195', namePt: 'Solana', nameEn: 'Solana', slug: 'solana' },
  { symbol: 'XRPUSDT', ticker: 'XRP', color: '#3AA5DD', namePt: 'XRP (Ripple)', nameEn: 'XRP (Ripple)', slug: 'xrp' },
  { symbol: 'ADAUSDT', ticker: 'ADA', color: '#0033AD', namePt: 'Cardano', nameEn: 'Cardano', slug: 'cardano' },
  { symbol: 'DOGEUSDT', ticker: 'DOGE', color: '#C2A633', namePt: 'Dogecoin', nameEn: 'Dogecoin', slug: 'dogecoin' },
  { symbol: 'AVAXUSDT', ticker: 'AVAX', color: '#E84142', namePt: 'Avalanche', nameEn: 'Avalanche', slug: 'avalanche' },
  { symbol: 'LINKUSDT', ticker: 'LINK', color: '#2A5ADA', namePt: 'Chainlink', nameEn: 'Chainlink', slug: 'chainlink' },
  { symbol: 'TONUSDT', ticker: 'TON', color: '#0088CC', namePt: 'Toncoin', nameEn: 'Toncoin', slug: 'toncoin' },
  { symbol: 'DOTUSDT', ticker: 'DOT', color: '#E6007A', namePt: 'Polkadot', nameEn: 'Polkadot', slug: 'polkadot' },
  { symbol: 'POLUSDT', ticker: 'POL', color: '#8247E5', namePt: 'Polygon (POL, ex-MATIC)', nameEn: 'Polygon (POL, ex-MATIC)', slug: 'polygon' },
  { symbol: 'LTCUSDT', ticker: 'LTC', color: '#A6A9AA', namePt: 'Litecoin', nameEn: 'Litecoin', slug: 'litecoin' },
  { symbol: '1000SHIBUSDT', ticker: 'SHIB', color: '#FFA409', namePt: 'Shiba Inu', nameEn: 'Shiba Inu', slug: 'shiba-inu' },
  { symbol: 'TRXUSDT', ticker: 'TRX', color: '#FF060A', namePt: 'TRON', nameEn: 'TRON', slug: 'tron' },
  { symbol: 'UNIUSDT', ticker: 'UNI', color: '#FF007A', namePt: 'Uniswap', nameEn: 'Uniswap', slug: 'uniswap' },
  { symbol: 'ATOMUSDT', ticker: 'ATOM', color: '#6F7390', namePt: 'Cosmos', nameEn: 'Cosmos', slug: 'cosmos' },
  { symbol: 'NEARUSDT', ticker: 'NEAR', color: '#00EC97', namePt: 'NEAR Protocol', nameEn: 'NEAR Protocol', slug: 'near' },
  { symbol: 'APTUSDT', ticker: 'APT', color: '#2DD8A7', namePt: 'Aptos', nameEn: 'Aptos', slug: 'aptos' },
  { symbol: 'ARBUSDT', ticker: 'ARB', color: '#28A0F0', namePt: 'Arbitrum', nameEn: 'Arbitrum', slug: 'arbitrum' },
  { symbol: 'OPUSDT', ticker: 'OP', color: '#FF0420', namePt: 'Optimism', nameEn: 'Optimism', slug: 'optimism' },
  { symbol: 'SUIUSDT', ticker: 'SUI', color: '#6FBCF0', namePt: 'Sui', nameEn: 'Sui', slug: 'sui' },
];

export interface PublicMetrics {
  ratio: number | null;
  longPct: number | null;
  shortPct: number | null;
  oiValue: number | null;
  history: { v: number }[];
}

const LEVEL_HIGH = 1.8;
const LEVEL_LOW = 0.6;
const TILT_LONG = 1.05;
const TILT_SHORT = 0.95;

export function getPublicSignal(m?: PublicMetrics): PublicSignal {
  const ratio = m?.ratio ?? null;
  if (ratio === null) return 'no-data';
  if (ratio >= LEVEL_HIGH) return 'avoid-buy';
  if (ratio <= LEVEL_LOW) return 'avoid-sell';
  if (ratio >= TILT_LONG) return 'longs';
  if (ratio <= TILT_SHORT) return 'shorts';
  return 'neutral';
}

export const signalLabels: Record<'pt' | 'en', Record<PublicSignal, string>> = {
  pt: {
    'avoid-buy': 'Evite compras/LONG',
    'avoid-sell': 'Evite vendas/SHORT',
    longs: 'Longs',
    shorts: 'Shorts',
    neutral: 'Neutro',
    'no-data': 'Sem dados',
  },
  en: {
    'avoid-buy': 'Avoid buying/Long',
    'avoid-sell': 'Avoid selling/Short',
    longs: 'Longs',
    shorts: 'Shorts',
    neutral: 'Neutral',
    'no-data': 'No data',
  },
};

const signalClass: Record<PublicSignal, string> = {
  'avoid-buy': 'bg-rose-500/12 text-rose-300 border-rose-500/30',
  'avoid-sell': 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  longs: 'bg-emerald-500/8 text-emerald-300/90 border-emerald-500/20',
  shorts: 'bg-rose-500/8 text-rose-300/90 border-rose-500/20',
  neutral: 'bg-white/5 text-muted-foreground border-border/40',
  'no-data': 'bg-white/5 text-muted-foreground border-border/40',
};

const fmtRatio = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const fmtShare = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);
const fmtOI = (v: number | null) => {
  if (v === null) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

// Last 4h of LSR history at 15m granularity = 16 points
const HISTORY_WINDOW = 16;

async function fetchMetrics(symbol: string): Promise<PublicMetrics> {
  try {
    const [ratioRes, oiRes] = await Promise.all([
      fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=15m&limit=${HISTORY_WINDOW}`),
      fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=1`),
    ]);
    const ratioJson = ratioRes.ok ? await ratioRes.json() : [];
    const oiJson = oiRes.ok ? await oiRes.json() : [];

    let ratio: number | null = null;
    let longPct: number | null = null;
    let shortPct: number | null = null;
    let history: { v: number }[] = [];
    if (Array.isArray(ratioJson) && ratioJson.length > 0) {
      const last = ratioJson[ratioJson.length - 1];
      ratio = parseFloat(last.longShortRatio);
      longPct = parseFloat(last.longAccount) * 100;
      shortPct = parseFloat(last.shortAccount) * 100;
      history = ratioJson
        .slice(-HISTORY_WINDOW)
        .map((p: { longShortRatio: string }) => ({ v: parseFloat(p.longShortRatio) }));
    }

    let oiValue: number | null = null;
    if (Array.isArray(oiJson) && oiJson.length > 0) {
      oiValue = parseFloat(oiJson[oiJson.length - 1].sumOpenInterestValue);
    }
    return { ratio, longPct, shortPct, oiValue, history };
  } catch {
    return { ratio: null, longPct: null, shortPct: null, oiValue: null, history: [] };
  }
}

const copy = {
  pt: {
    ratio: 'Proporção long/short',
    buyers: 'compradores',
    sellers: 'vendedores',
    oi: 'Contratos em aberto',
    updated: 'Atualizado',
    loading: 'Carregando dados ao vivo…',
    refresh: 'Atualizar agora',
    trend: 'Tendência 4h',
    searchPlaceholder: 'Buscar ativo (ex: gold, btc)',
    searchLabel: 'Buscar',
    noResults: 'Nenhum ativo encontrado.',
  },
  en: {
    ratio: 'Long/short ratio',
    buyers: 'buyers',
    sellers: 'sellers',
    oi: 'Open interest',
    updated: 'Updated',
    loading: 'Loading live data…',
    refresh: 'Refresh now',
    trend: '4h trend',
    searchPlaceholder: 'Search asset (e.g. gold, btc)',
    searchLabel: 'Search',
    noResults: 'No assets found.',
  },
};

/**
 * Mini sparkline de tendência 4h.
 *
 * Renderiza um SVG puro com viewBox fixo + preserveAspectRatio="none" em vez de
 * usar o ResponsiveContainer do Recharts: o container do Recharts mede a largura
 * do pai de forma assíncrona e, quando o card do grid ainda não tem largura
 * calculada no primeiro render, ele monta o gráfico com uma largura mínima e
 * nunca re-mede — foi isso que deixou a curva espremida na borda esquerda em
 * alguns cards. Com viewBox + preserveAspectRatio="none" o desenho é escalado
 * pelo próprio SVG e sempre ocupa 100% da largura e da altura disponíveis.
 */
function Sparkline({
  history,
  label,
  gradientId,
}: {
  history: { v: number }[];
  label: string;
  gradientId: string;
}) {
  const values = history.map((h) => h.v).filter((v) => Number.isFinite(v));

  if (values.length < 2) {
    return (
      <div className="overflow-hidden rounded-md">
        <div className="h-10 w-full flex items-center justify-center text-[10px] text-muted-foreground">
          —
        </div>
        <p className="text-[10px] text-muted-foreground text-center">{label}</p>
      </div>
    );
  }

  const W = 100;
  const H = 40;
  const PAD = 3; // margem vertical para topo/fundo da curva não colarem na borda

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // X sempre distribuído por toda a largura do viewBox, qualquer que seja a
  // quantidade de pontos daquele ativo. Y normalizado pelos próprios min/max.
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  const trendUp = values[values.length - 1] >= values[0];
  const color = trendUp ? '#34d399' : '#f87171';

  return (
    <div className="overflow-hidden rounded-md">
      <div className="h-10 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          className="block h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">{label}</p>
    </div>
  );
}


export function PublicLSRGrid({ lang }: { lang: 'pt' | 'en' }) {
  const [data, setData] = useState<Record<string, PublicMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState('');
  const t = copy[lang];

  const filteredAssets = PUBLIC_ASSETS.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = lang === 'pt' ? a.namePt : a.nameEn;
    return (
      a.ticker.toLowerCase().includes(q) ||
      a.symbol.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q)
    );
  });

  const load = useCallback(async () => {
    setLoading(true);
    const entries = await Promise.all(
      PUBLIC_ASSETS.map(async (a) => [a.symbol, await fetchMetrics(a.symbol)] as const),
    );
    setData(Object.fromEntries(entries));
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="public-lsr-search" className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id="public-lsr-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-lg border border-border/60 bg-card/60 px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197M16.5 10.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
          </svg>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span>
            {loading && !updatedAt
              ? t.loading
              : updatedAt
                ? `${t.updated}: ${updatedAt.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US')}`
                : ''}
          </span>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-white/5 transition-colors"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.map((a) => {
          const m = data[a.symbol];
          const signal = getPublicSignal(m);
          const name = lang === 'pt' ? a.namePt : a.nameEn;
          return (
            <article
              key={a.symbol}
              id={`ativo-${a.slug}`}
              className="card-premium p-4 flex flex-col gap-3 scroll-mt-24"
            >
              <header className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <h3 className="text-sm font-semibold leading-tight">
                  {name} <span className="text-muted-foreground font-normal">({a.ticker})</span>
                </h3>
              </header>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t.ratio}</p>
                <p className="text-4xl font-bold font-num tabular-nums leading-none mt-1">{fmtRatio(m?.ratio ?? null)}</p>
              </div>

              <span
                className={`self-center rounded-full border px-3 py-1 text-xs font-semibold ${signalClass[signal]}`}
              >
                {signalLabels[lang][signal]}
              </span>

              <div className="text-xs text-center font-num tabular-nums text-muted-foreground">
                <span className="text-emerald-400">{fmtShare(m?.longPct ?? null)} {t.buyers}</span>
                {' · '}
                <span className="text-rose-400">{fmtShare(m?.shortPct ?? null)} {t.sellers}</span>
              </div>

              {/* Mini 4h trend sparkline */}
              <Sparkline history={m?.history ?? []} label={t.trend} gradientId={`pub-spark-${a.symbol}`} />

              <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2">
                <span className="text-muted-foreground">{t.oi}</span>
                <span className="font-num tabular-nums font-medium">{fmtOI(m?.oiValue ?? null)}</span>
              </div>
            </article>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t.noResults}</p>
      )}
    </div>
  );
}
