import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ListFilter, Zap, Check, GripVertical } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface AssetConfig {
    symbol: string;
    label: string;
    color: string;
}

interface AssetMetrics {
    ratio: number | null;
    longPct: number | null;
    shortPct: number | null;
    ratioChange15m: number | null;
    ratioChange1h: number | null;
    ratioChange24h: number | null;
    oiValue: number | null;
    oiChangePct: number | null;
    history: { v: number }[];
}

type AssetStatus = 'avoid-longs' | 'avoid-shorts' | 'caution' | 'neutral' | 'no-data';

const DEFAULT_ASSETS: AssetConfig[] = [
  { symbol: 'BTCUSDT', label: 'BTC', color: '#F7931A' },
  { symbol: 'ETHUSDT', label: 'ETH', color: '#627EEA' },
  { symbol: 'PAXGUSDT', label: 'XAU (Gold)', color: '#D4AF37' },
  { symbol: 'XAGUSDT', label: 'XAG (Silver)', color: '#C0C0C0' },
  { symbol: 'BNBUSDT', label: 'BNB', color: '#F3BA2F' },
  { symbol: 'SOLUSDT', label: 'SOL', color: '#14F195' },
  { symbol: 'XRPUSDT', label: 'XRP', color: '#3AA5DD' },
  { symbol: 'ADAUSDT', label: 'ADA', color: '#0033AD' },
  { symbol: 'DOGEUSDT', label: 'DOGE', color: '#C2A633' },
  { symbol: 'AVAXUSDT', label: 'AVAX', color: '#E84142' },
  { symbol: 'LINKUSDT', label: 'LINK', color: '#2A5ADA' },
  { symbol: 'TONUSDT', label: 'TON', color: '#0088CC' },
  { symbol: 'DOTUSDT', label: 'DOT', color: '#E6007A' },
  { symbol: 'POLUSDT', label: 'POL (ex-MATIC)', color: '#8247E5' },
  { symbol: 'LTCUSDT', label: 'LTC', color: '#A6A9AA' },
  { symbol: '1000SHIBUSDT', label: 'SHIB', color: '#FFA409' },
  { symbol: 'TRXUSDT', label: 'TRX', color: '#FF060A' },
  { symbol: 'UNIUSDT', label: 'UNI', color: '#FF007A' },
  { symbol: 'ATOMUSDT', label: 'ATOM', color: '#6F7390' },
  { symbol: 'NEARUSDT', label: 'NEAR', color: '#00EC97' },
  { symbol: 'APTUSDT', label: 'APT', color: '#2DD8A7' },
  { symbol: 'ARBUSDT', label: 'ARB', color: '#28A0F0' },
  { symbol: 'OPUSDT', label: 'OP', color: '#FF0420' },
  { symbol: 'SUIUSDT', label: 'SUI', color: '#6FBCF0' },
];

const HIDDEN_KEY = 'ttd:multiAssetGrid:hidden';
const ORDER_KEY = 'ttd:multiAssetGrid:order';

const LEVEL_HIGH = 1.8;
const LEVEL_LOW = 0.6;
const VELOCITY_CAUTION_PCT = 8;

const getStatus = (m: AssetMetrics | undefined): AssetStatus => {
    const ratio = m?.ratio ?? null;
    if (ratio === null) return 'no-data';
    if (ratio >= LEVEL_HIGH) return 'avoid-longs';
    if (ratio <= LEVEL_LOW) return 'avoid-shorts';
    const velocity = m?.ratioChange1h;
    if (velocity !== null && velocity !== undefined && Math.abs(velocity) >= VELOCITY_CAUTION_PCT) {
        return 'caution';
    }
    return 'neutral';
};

const statusLabel: Record<AssetStatus, string> = {
    'avoid-longs': 'Evite longs',
    'avoid-shorts': 'Evite shorts',
    'caution': 'Atencao - LSR em movimento',
    'neutral': 'Mercado neutro',
    'no-data': 'Sem dados',
};

const statusClass: Record<AssetStatus, string> = {
    'avoid-longs': 'bg-loss/10 text-loss border-loss/30',
    'avoid-shorts': 'bg-profit/10 text-profit border-profit/30',
    'caution': 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    'neutral': 'bg-white/5 text-muted-foreground border-border/40',
    'no-data': 'bg-white/5 text-muted-foreground border-border/40',
};

const formatRatio = (v: number | null) => (v === null ? '—' : v.toFixed(3));
const formatPct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`);
const formatSharePct = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);
const formatOI = (v: number | null) => {
    if (v === null) return '—';
    if (v >= 1000000000) return `$${(v / 1000000000).toFixed(2)}B`;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
};

// Last 4h of history at 15m granularity = 16 candles
const HISTORY_WINDOW = 16;

async function fetchAssetMetrics(symbol: string): Promise<AssetMetrics> {
    try {
        const [ratioRes, oiRes] = await Promise.all([
            fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=15m&limit=97`),
            fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=2`),
        ]);
        const ratioJson = ratioRes.ok ? await ratioRes.json() : [];
        const oiJson = oiRes.ok ? await oiRes.json() : [];

        let ratio: number | null = null;
        let longPct: number | null = null;
        let shortPct: number | null = null;
        let ratioChange15m: number | null = null;
        let ratioChange1h: number | null = null;
        let ratioChange24h: number | null = null;
        let history: { v: number }[] = [];

        if (Array.isArray(ratioJson) && ratioJson.length > 0) {
            const last = ratioJson[ratioJson.length - 1];
            ratio = parseFloat(last.longShortRatio);
            longPct = parseFloat(last.longAccount) * 100;
            shortPct = parseFloat(last.shortAccount) * 100;

            const idx15m = ratioJson.length - 2;
            if (idx15m >= 0) {
                const prev15m = parseFloat(ratioJson[idx15m].longShortRatio);
                if (prev15m !== 0) ratioChange15m = ((ratio - prev15m) / prev15m) * 100;
            }

            const idx1h = ratioJson.length - 1 - 4;
            if (idx1h >= 0) {
                const prev1h = parseFloat(ratioJson[idx1h].longShortRatio);
                if (prev1h !== 0) ratioChange1h = ((ratio - prev1h) / prev1h) * 100;
            }

            const first = parseFloat(ratioJson[0].longShortRatio);
            if (first !== 0) ratioChange24h = ((ratio - first) / first) * 100;

            history = ratioJson
                .slice(-HISTORY_WINDOW)
                .map((p: { longShortRatio: string }) => ({ v: parseFloat(p.longShortRatio) }));
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

        return { ratio, longPct, shortPct, ratioChange15m, ratioChange1h, ratioChange24h, oiValue, oiChangePct, history };
    } catch {
        return { ratio: null, longPct: null, shortPct: null, ratioChange15m: null, ratioChange1h: null, ratioChange24h: null, oiValue: null, oiChangePct: null, history: [] };
    }
}

interface AssetCardProps {
    asset: AssetConfig;
    metrics: AssetMetrics | undefined;
}

const AssetCard = ({ asset, metrics }: AssetCardProps) => {
    const ratio = metrics?.ratio ?? null;
    const status = getStatus(metrics);
    const change15mClass = metrics?.ratioChange15m != null ? (metrics.ratioChange15m >= 0 ? 'text-profit' : 'text-loss') : 'text-space-400';
    const change1hClass = metrics?.ratioChange1h != null ? (metrics.ratioChange1h >= 0 ? 'text-profit' : 'text-loss') : 'text-space-400';
    const change24hClass = metrics?.ratioChange24h != null ? (metrics.ratioChange24h >= 0 ? 'text-profit' : 'text-loss') : 'text-space-400';
    const longPct = metrics?.longPct ?? null;
    const shortPct = metrics?.shortPct ?? null;
    const history = metrics?.history ?? [];

    // Trend color for the mini chart: compare first vs last point of the 4h window
    const trendUp = history.length >= 2 ? history[history.length - 1].v >= history[0].v : null;
    const trendColor = trendUp === null ? 'hsl(var(--muted-foreground))' : trendUp ? 'hsl(var(--profit))' : 'hsl(var(--loss))';

    return (
        <div className="card-premium p-4 flex flex-col gap-2 min-h-[300px]">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="font-semibold text-sm">{asset.label}</span>
                {status === 'caution' && <Zap className="h-3.5 w-3.5 text-amber-500" />}
            </div>

            <div className="flex flex-col items-center justify-center pt-1">
                <p className="text-xs text-muted-foreground mb-1">Razao L/S</p>
                <p className="text-5xl font-bold font-num tabular-nums leading-none">{formatRatio(ratio)}</p>
                {(longPct !== null || shortPct !== null) && (
                    <p className="text-xs text-muted-foreground mt-2 font-num tabular-nums">
                        <span className="text-profit">{formatSharePct(longPct)} longs</span>{' / '}<span className="text-loss">{formatSharePct(shortPct)} shorts</span>
                    </p>
                )}
            </div>

            {/* Mini 4h trend sparkline */}
            <div className="h-12 -mx-1">
                {history.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <defs>
                                <linearGradient id={`spark-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={trendColor} strokeWidth={1.5} fill={`url(#spark-${asset.symbol})`} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">Sem historico suficiente</div>
                )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center -mt-1">Tendencia 4h</p>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                    <p className="text-xs text-muted-foreground">Var. 15m</p>
                    <p className={`text-sm font-semibold font-num tabular-nums ${change15mClass}`}>{formatPct(metrics?.ratioChange15m ?? null)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Var. 1h</p>
                    <p className={`text-sm font-semibold font-num tabular-nums ${change1hClass}`}>{formatPct(metrics?.ratioChange1h ?? null)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Var. 24h</p>
                    <p className={`text-sm font-semibold font-num tabular-nums ${change24hClass}`}>{formatPct(metrics?.ratioChange24h ?? null)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <div>
                    <p className="text-xs text-muted-foreground">Open interest</p>
                    <p className="text-sm font-semibold font-num tabular-nums">{formatOI(metrics?.oiValue ?? null)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusClass[status]}`}>{statusLabel[status]}</span>
            </div>
        </div>
    );
};

// Single "choose which assets to show, and in what order" menu.
// Reordering is real click-and-hold drag & drop (native HTML5 DnD on desktop,
// pointer-events fallback so it also works on touch/trackpad-drag).
const AssetPicker = ({
    order,
    assetsBySymbol,
    visible,
    onToggle,
    onReorder,
}: {
    order: string[];
    assetsBySymbol: Record<string, AssetConfig>;
    visible: Set<string>;
    onToggle: (symbol: string) => void;
    onReorder: (fromSymbol: string, toSymbol: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [draggedSymbol, setDraggedSymbol] = useState<string | null>(null);
    const [dragOverSymbol, setDragOverSymbol] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDragStart = (e: React.DragEvent, symbol: string) => {
        setDraggedSymbol(symbol);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', symbol); } catch { /* noop */ }
    };

    const handleDragOver = (e: React.DragEvent, symbol: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (symbol !== dragOverSymbol) setDragOverSymbol(symbol);
    };

    const handleDrop = (e: React.DragEvent, symbol: string) => {
        e.preventDefault();
        if (draggedSymbol && draggedSymbol !== symbol) {
            onReorder(draggedSymbol, symbol);
        }
        setDraggedSymbol(null);
        setDragOverSymbol(null);
    };

    const handleDragEnd = () => {
        setDraggedSymbol(null);
        setDragOverSymbol(null);
    };

    return (
        <div className="relative z-30" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-border/40 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <ListFilter className="h-4 w-4" />
                Selecionar ativos ({visible.size}/{order.length})
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 max-h-96 overflow-y-auto rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl p-2 shadow-xl">
                    <p className="text-[11px] text-muted-foreground px-2 pb-1">Marque para exibir. Clique e arraste para reordenar.</p>
                    {order.map((symbol) => {
                        const a = assetsBySymbol[symbol];
                        if (!a) return null;
                        const isVisible = visible.has(symbol);
                        const isDragging = draggedSymbol === symbol;
                        const isDragOver = dragOverSymbol === symbol && draggedSymbol !== symbol;
                        return (
                            <div
                                key={symbol}
                                draggable
                                onDragStart={(e) => handleDragStart(e, symbol)}
                                onDragOver={(e) => handleDragOver(e, symbol)}
                                onDrop={(e) => handleDrop(e, symbol)}
                                onDragEnd={handleDragEnd}
                                className={`w-full flex items-center gap-1 px-1 py-1 rounded-lg transition-colors ${
                                    isDragging ? 'opacity-40' : ''
                                } ${isDragOver ? 'bg-primary/10 border-t-2 border-primary' : 'hover:bg-white/5'}`}
                            >
                                <div className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/60 touch-none">
                                    <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <button
                                    onClick={() => onToggle(symbol)}
                                    className="flex-1 flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg text-left"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                                        <span className="text-sm">{a.label}</span>
                                    </span>
                                    {isVisible && <Check className="h-3.5 w-3.5 text-primary" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const MultiAssetLSRGrid = () => {
    const [metrics, setMetrics] = useState<Record<string, AssetMetrics>>({});
    const [hidden, setHidden] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(HIDDEN_KEY);
            if (saved) return new Set(JSON.parse(saved));
        } catch {
            // ignore malformed localStorage value
        }
        return new Set();
    });
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
            // ignore malformed localStorage value
        }
        return DEFAULT_ASSETS.map((a) => a.symbol);
    });

    const assetsBySymbol = useMemo(() => {
        const map: Record<string, AssetConfig> = {};
        DEFAULT_ASSETS.forEach((a) => { map[a.symbol] = a; });
        return map;
    }, []);

    const loadAll = useCallback(async () => {
        const results = await Promise.allSettled(DEFAULT_ASSETS.map((a) => fetchAssetMetrics(a.symbol)));
        setMetrics((prev) => {
            const next = { ...prev };
            results.forEach((r, i) => { if (r.status === 'fulfilled') next[DEFAULT_ASSETS[i].symbol] = r.value; });
            return next;
        });
    }, []);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60000);
        return () => clearInterval(interval);
    }, [loadAll]);

    useEffect(() => { localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hidden))); }, [hidden]);
    useEffect(() => { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); }, [order]);

    const toggleVisible = (symbol: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(symbol)) next.delete(symbol);
            else next.add(symbol);
            return next;
        });
    };

    const reorderAssets = (fromSymbol: string, toSymbol: string) => {
        setOrder((prev) => {
            const fromIdx = prev.indexOf(fromSymbol);
            const toIdx = prev.indexOf(toSymbol);
            if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
        });
    };

    const visibleSymbols = order.filter((s) => !hidden.has(s));
    const visibleSet = new Set(visibleSymbols);

    const summary = useMemo(() => {
        const ratios = visibleSymbols.map((s) => metrics[s]?.ratio).filter((r): r is number => r != null);
        const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
        const avoidLongs = visibleSymbols.filter((s) => getStatus(metrics[s]) === 'avoid-longs').length;
        const avoidShorts = visibleSymbols.filter((s) => getStatus(metrics[s]) === 'avoid-shorts').length;
        const caution = visibleSymbols.filter((s) => getStatus(metrics[s]) === 'caution').length;
        return { avgRatio, avoidLongs, avoidShorts, caution, total: visibleSymbols.length };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order, hidden, metrics]);

    return (
        <div className="space-y-4">
            <div className="card-premium p-4 relative z-30">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                        <div><p className="text-xs text-muted-foreground">Ativos monitorados</p><p className="text-xl font-bold font-num tabular-nums">{summary.total}</p></div>
                        <div><p className="text-xs text-muted-foreground">Razao media L/S</p><p className="text-xl font-bold font-num tabular-nums">{formatRatio(summary.avgRatio)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Evite longs</p><p className="text-xl font-bold font-num tabular-nums text-loss">{summary.avoidLongs}</p></div>
                        <div><p className="text-xs text-muted-foreground">Evite shorts</p><p className="text-xl font-bold font-num tabular-nums text-profit">{summary.avoidShorts}</p></div>
                        <div><p className="text-xs text-muted-foreground">Em movimento</p><p className="text-xl font-bold font-num tabular-nums text-amber-500">{summary.caution}</p></div>
                    </div>
                    <AssetPicker order={order} assetsBySymbol={assetsBySymbol} visible={visibleSet} onToggle={toggleVisible} onReorder={reorderAssets} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-0">
                {visibleSymbols.map((symbol) => (
                    <AssetCard key={symbol} asset={assetsBySymbol[symbol]} metrics={metrics[symbol]} />
                ))}
            </div>

            {visibleSymbols.length === 0 && (
                <div className="card-premium p-8 text-center text-sm text-muted-foreground">
                    Nenhum ativo selecionado. Use "Selecionar ativos" acima para escolher o que exibir.
                </div>
            )}
        </div>
    );
};
