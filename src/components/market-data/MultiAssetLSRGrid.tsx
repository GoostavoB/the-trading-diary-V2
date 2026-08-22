import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface AssetConfig {
    symbol: string;
    label: string;
    color: string;
}

interface AssetMetrics {
    ratio: number | null;
    ratioChangePct: number | null;
    oiValue: number | null;
    oiChangePct: number | null;
}

type AssetStatus = 'avoid-longs' | 'avoid-shorts' | 'neutral' | 'no-data';

const DEFAULT_ASSETS: AssetConfig[] = [
  { symbol: 'BTCUSDT', label: 'BTC', color: '#F7931A' },
  { symbol: 'ETHUSDT', label: 'ETH', color: '#627EEA' },
  { symbol: 'PAXGUSDT', label: 'XAU (Gold)', color: '#D4AF37' },
  { symbol: 'BNBUSDT', label: 'BNB', color: '#F3BA2F' },
  { symbol: 'SOLUSDT', label: 'SOL', color: '#14F195' },
  { symbol: 'XRPUSDT', label: 'XRP', color: '#3AA5DD' },
  { symbol: 'ADAUSDT', label: 'ADA', color: '#0033AD' },
  { symbol: 'DOGEUSDT', label: 'DOGE', color: '#C2A633' },
  { symbol: 'AVAXUSDT', label: 'AVAX', color: '#E84142' },
  { symbol: 'LINKUSDT', label: 'LINK', color: '#2A5ADA' },
  { symbol: 'TONUSDT', label: 'TON', color: '#0088CC' },
  { symbol: 'DOTUSDT', label: 'DOT', color: '#E6007A' },
  { symbol: 'MATICUSDT', label: 'MATIC', color: '#8247E5' },
  { symbol: 'LTCUSDT', label: 'LTC', color: '#A6A9AA' },
  { symbol: 'SHIBUSDT', label: 'SHIB', color: '#FFA409' },
  { symbol: 'TRXUSDT', label: 'TRX', color: '#FF060A' },
  { symbol: 'UNIUSDT', label: 'UNI', color: '#FF007A' },
  { symbol: 'ATOMUSDT', label: 'ATOM', color: '#6F7390' },
  { symbol: 'NEARUSDT', label: 'NEAR', color: '#00EC97' },
  { symbol: 'APTUSDT', label: 'APT', color: '#2DD8A7' },
  { symbol: 'ARBUSDT', label: 'ARB', color: '#28A0F0' },
  { symbol: 'OPUSDT', label: 'OP', color: '#FF0420' },
  { symbol: 'SUIUSDT', label: 'SUI', color: '#6FBCF0' },
  ];

const ORDER_KEY = 'ttd:multiAssetGrid:order';
const HIDDEN_KEY = 'ttd:multiAssetGrid:hidden';

const getStatus = (ratio: number | null): AssetStatus => {
    if (ratio === null) return 'no-data';
    if (ratio >= 1.8) return 'avoid-longs';
    if (ratio <= 0.6) return 'avoid-shorts';
    return 'neutral';
};

const statusLabel: Record<AssetStatus, string> = {
    'avoid-longs': 'Evite longs',
    'avoid-shorts': 'Evite shorts',
    'neutral': 'Mercado neutro',
    'no-data': 'Sem dados',
};

const statusClass: Record<AssetStatus, string> = {
    'avoid-longs': 'bg-loss/10 text-loss border-loss/30',
    'avoid-shorts': 'bg-profit/10 text-profit border-profit/30',
    'neutral': 'bg-white/5 text-muted-foreground border-border/40',
    'no-data': 'bg-white/5 text-muted-foreground border-border/40',
};

const formatRatio = (v: number | null) => (v === null ? '—' : v.toFixed(3));
const formatPct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`);
const formatOI = (v: number | null) => {
    if (v === null) return '—';
    if (v >= 1000000000) return `$${(v / 1000000000).toFixed(2)}B`;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
};

async function fetchAssetMetrics(symbol: string): Promise<AssetMetrics> {
    try {
          const [ratioRes, oiRes] = await Promise.all([
                  fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=2`),
                  fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=2`),
                ]);
          const ratioJson = ratioRes.ok ? await ratioRes.json() : [];
          const oiJson = oiRes.ok ? await oiRes.json() : [];

      let ratio: number | null = null;
          let ratioChangePct: number | null = null;
          if (Array.isArray(ratioJson) && ratioJson.length > 0) {
                  ratio = parseFloat(ratioJson[ratioJson.length - 1].longShortRatio);
                  if (ratioJson.length >= 2) {
                            const prev = parseFloat(ratioJson[0].longShortRatio);
                            if (prev !== 0) ratioChangePct = ((ratio - prev) / prev) * 100;
                  }
          }

      let oiValue: number | null = null;
          let oiChangePct: number | null = null;
          if (Array.isArray(oiJson) && oiJson.length > 0) {
                  oiValue = parseFloat(oiJson[oiJson.length - 1].sumOpenInterestValue);
                  if (oiJson.length >= 2) {
                            const prevOi = parseFloat(oiJson[0].sumOpenInterestValue);
                            if (prevOi !== 0) oiChangePct = ((oiValue - prevOi) / prevOi) * 100;
                  }
          }

      return { ratio, ratioChangePct, oiValue, oiChangePct };
    } catch {
          return { ratio: null, ratioChangePct: null, oiValue: null, oiChangePct: null };
    }
}

interface AssetCardProps {
    asset: AssetConfig;
    metrics: AssetMetrics | undefined;
    onHide: (symbol: string) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    disableUp: boolean;
    disableDown: boolean;
}

const AssetCard = ({ asset, metrics, onHide, onMoveUp, onMoveDown, disableUp, disableDown }: AssetCardProps) => {
    const ratio = metrics?.ratio ?? null;
    const status = getStatus(ratio);
    const changeClass = metrics?.ratioChangePct != null ? (metrics.ratioChangePct >= 0 ? 'text-profit' : 'text-loss') : 'text-space-400';

    return (
          <div className="card-premium p-4 space-y-3">
                <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                                  <span className="font-semibold text-sm">{asset.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                                  <button
                                                onClick={onMoveUp}
                                                disabled={disableUp}
                                                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                aria-label={`Mover ${asset.label} para cima`}
                                              >
                                              <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                                onClick={onMoveDown}
                                                disabled={disableDown}
                                                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                aria-label={`Mover ${asset.label} para baixo`}
                                              >
                                              <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                                onClick={() => onHide(asset.symbol)}
                                                className="p-1 rounded hover:bg-white/5 transition-colors"
                                                aria-label={`Ocultar ${asset.label}`}
                                              >
                                              <X className="h-3.5 w-3.5" />
                                  </button>
                        </div>
                </div>
          
                <div className="grid grid-cols-2 gap-3">
                        <div>
                                  <p className="text-xs text-muted-foreground">Razao L/S</p>
                                  <p className="text-lg font-bold font-num tabular-nums">{formatRatio(ratio)}</p>
                        </div>
                        <div>
                                  <p className="text-xs text-muted-foreground">Variacao 1h</p>
                                  <p className={`text-lg font-bold font-num tabular-nums ${changeClass}`}>{formatPct(metrics?.ratioChangePct ?? null)}</p>
                        </div>
                </div>
          
                <div className="flex items-center justify-between">
                        <div>
                                  <p className="text-xs text-muted-foreground">Open interest</p>
                                  <p className="text-sm font-semibold font-num tabular-nums">{formatOI(metrics?.oiValue ?? null)}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusClass[status]}`}>
                          {statusLabel[status]}
                        </span>
                </div>
          </div>
        );
};

export const MultiAssetLSRGrid = () => {
    const [metrics, setMetrics] = useState<Record<string, AssetMetrics>>({});
    const [order, setOrder] = useState<string[]>(() => {
          try {
                  const saved = localStorage.getItem(ORDER_KEY);
                  if (saved) {
                            const parsed: string[] = JSON.parse(saved);
                            const known = new Set(DEFAULT_ASSETS.map((a) => a.symbol));
                            const filtered = parsed.filter((s) => known.has(s));
                            const missing = DEFAULT_ASSETS.map((a) => a.symbol).filter((s) => !filtered.includes(s));
                            return [...filtered, ...missing];
                  }
          } catch {
                  // ignore corrupt storage
          }
          return DEFAULT_ASSETS.map((a) => a.symbol);
    });
    const [hidden, setHidden] = useState<Set<string>>(() => {
          try {
                  const saved = localStorage.getItem(HIDDEN_KEY);
                  if (saved) return new Set(JSON.parse(saved));
          } catch {
                  // ignore corrupt storage
          }
          return new Set();
    });
  
    const assetsBySymbol = useMemo(() => {
          const map: Record<string, AssetConfig> = {};
          DEFAULT_ASSETS.forEach((a) => {
                  map[a.symbol] = a;
          });
          return map;
    }, []);
  
    const loadAll = useCallback(async () => {
          const results = await Promise.allSettled(DEFAULT_ASSETS.map((a) => fetchAssetMetrics(a.symbol)));
          setMetrics((prev) => {
                  const next = { ...prev };
                  results.forEach((r, i) => {
                            if (r.status === 'fulfilled') next[DEFAULT_ASSETS[i].symbol] = r.value;
                  });
                  return next;
          });
    }, []);
  
    useEffect(() => {
          loadAll();
          const interval = setInterval(loadAll, 60000);
          return () => clearInterval(interval);
    }, [loadAll]);
  
    useEffect(() => {
          localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    }, [order]);
  
    useEffect(() => {
          localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hidden)));
    }, [hidden]);
  
    const handleHide = (symbol: string) => {
          setHidden((prev) => new Set(prev).add(symbol));
    };
  
    const handleRestore = (symbol: string) => {
          setHidden((prev) => {
                  const next = new Set(prev);
                  next.delete(symbol);
                  return next;
          });
    };
  
    const handleMove = (symbol: string, direction: -1 | 1) => {
          setOrder((prev) => {
                  const idx = prev.indexOf(symbol);
                  const targetIdx = idx + direction;
                  if (idx < 0 || targetIdx < 0 || targetIdx >= prev.length) return prev;
                  const next = [...prev];
                  const tmp = next[idx];
                  next[idx] = next[targetIdx];
                  next[targetIdx] = tmp;
                  return next;
          });
    };
  
    const visibleOrder = order.filter((s) => !hidden.has(s));
    const hiddenList = order.filter((s) => hidden.has(s));
  
    const summary = useMemo(() => {
          const ratios = visibleOrder.map((s) => metrics[s]?.ratio).filter((r): r is number => r != null);
          const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
          const avoidLongs = visibleOrder.filter((s) => getStatus(metrics[s]?.ratio ?? null) === 'avoid-longs').length;
          const avoidShorts = visibleOrder.filter((s) => getStatus(metrics[s]?.ratio ?? null) === 'avoid-shorts').length;
          return { avgRatio, avoidLongs, avoidShorts, total: visibleOrder.length };
    }, [visibleOrder, metrics]);
  
    return (
          <div className="space-y-4">
                <div className="card-premium p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                              <p className="text-xs text-muted-foreground">Ativos monitorados</p>
                                              <p className="text-xl font-bold font-num tabular-nums">{summary.total}</p>
                                  </div>
                                  <div>
                                              <p className="text-xs text-muted-foreground">Razao media L/S</p>
                                              <p className="text-xl font-bold font-num tabular-nums">{formatRatio(summary.avgRatio)}</p>
                                  </div>
                                  <div>
                                              <p className="text-xs text-muted-foreground">Evite longs</p>
                                              <p className="text-xl font-bold font-num tabular-nums text-loss">{summary.avoidLongs}</p>
                                  </div>
                                  <div>
                                              <p className="text-xs text-muted-foreground">Evite shorts</p>
                                              <p className="text-xl font-bold font-num tabular-nums text-profit">{summary.avoidShorts}</p>
                                  </div>
                        </div>
                </div>
          
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleOrder.map((symbol, idx) => (
                      <AssetCard
                                    key={symbol}
                                    asset={assetsBySymbol[symbol]}
                                    metrics={metrics[symbol]}
                                    onHide={handleHide}
                                    onMoveUp={() => handleMove(symbol, -1)}
                                    onMoveDown={() => handleMove(symbol, 1)}
                                    disableUp={idx === 0}
                                    disableDown={idx === visibleOrder.length - 1}
                                  />
                    ))}
                </div>
          
            {hiddenList.length > 0 && (
                    <div className="card-premium p-4">
                              <p className="text-xs text-muted-foreground mb-2">Ativos ocultos</p>
                              <div className="flex flex-wrap gap-2">
                                {hiddenList.map((symbol) => (
                                    <button
                                                      key={symbol}
                                                      onClick={() => handleRestore(symbol)}
                                                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-border/40 bg-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                    + {assetsBySymbol[symbol]?.label ?? symbol}
                                    </button>
                                  ))}
                              </div>
                    </div>
                )}
          </div>
        );
};
