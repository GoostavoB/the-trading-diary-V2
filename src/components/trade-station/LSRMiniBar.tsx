import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LSRData {
  symbol: string;
  label: string;
  ratio: number | null;
  change30m: number | null;
  longPct: number | null;
  shortPct: number | null;
  loading: boolean;
  error: boolean;
}

const SYMBOLS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
];

async function fetchLSR(symbol: string): Promise<{ ratio: number; change30m: number; longPct: number; shortPct: number } | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=30m&limit=3`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data: Array<{ longShortRatio: string; longAccount: string; shortAccount: string }> = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const current = data[data.length - 1];
    const previous = data[0];
    const ratio = parseFloat(current.longShortRatio);
    const prevRatio = parseFloat(previous.longShortRatio);
    const change30m = prevRatio !== 0 ? ((ratio - prevRatio) / prevRatio) * 100 : 0;
    const longPct = parseFloat(current.longAccount) * 100;
    const shortPct = parseFloat(current.shortAccount) * 100;

    return { ratio, change30m, longPct, shortPct };
  } catch {
    return null;
  }
}

function Signal({ ratio }: { ratio: number | null }) {
  if (ratio === null) return null;
  if (ratio >= 1.15) return <span className="text-[10px] font-bold tracking-wider text-emerald-400 opacity-80">LONGS DOMINATING</span>;
  if (ratio <= 0.87) return <span className="text-[10px] font-bold tracking-wider text-rose-400 opacity-80">SHORTS DOMINATING</span>;
  return <span className="text-[10px] font-bold tracking-wider text-amber-400/70 opacity-80">BALANCED</span>;
}

function PulseDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      )}
      <span className={cn(
        "relative inline-flex h-2 w-2 rounded-full",
        active ? "bg-emerald-400" : "bg-muted-foreground/40"
      )} />
    </span>
  );
}

function LSRPill({ data }: { data: LSRData }) {
  const isBullish = data.ratio !== null && data.ratio > 1.05;
  const isBearish = data.ratio !== null && data.ratio < 0.95;
  const changeUp = data.change30m !== null && data.change30m > 0;
  const changeDown = data.change30m !== null && data.change30m < 0;

  return (
    <div className={cn(
      "relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-500",
      "border backdrop-blur-sm",
      isBullish && "bg-emerald-950/30 border-emerald-500/20 shadow-[0_0_12px_-4px_rgba(52,211,153,0.25)]",
      isBearish && "bg-rose-950/30 border-rose-500/20 shadow-[0_0_12px_-4px_rgba(244,63,94,0.25)]",
      !isBullish && !isBearish && "bg-white/[0.04] border-white/8",
    )}>
      {/* Symbol label */}
      <span className={cn(
        "text-[11px] font-black tracking-wider shrink-0",
        isBullish && "text-emerald-400",
        isBearish && "text-rose-400",
        !isBullish && !isBearish && "text-muted-foreground"
      )}>
        {data.label}
      </span>

      {/* Ratio value */}
      <div className="flex flex-col items-end gap-0.5 min-w-[52px]">
        {data.loading ? (
          <span className="h-4 w-10 animate-pulse bg-white/10 rounded" />
        ) : data.error || data.ratio === null ? (
          <span className="text-xs text-muted-foreground/50">—</span>
        ) : (
          <>
            <span className={cn(
              "text-sm font-mono font-bold leading-none tabular-nums",
              isBullish ? "text-emerald-300" : isBearish ? "text-rose-300" : "text-foreground"
            )}>
              {data.ratio.toFixed(3)}
            </span>
          </>
        )}
      </div>

      {/* 30m change */}
      {!data.loading && data.change30m !== null && (
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-mono font-semibold leading-none shrink-0",
          changeUp && "text-emerald-400",
          changeDown && "text-rose-400",
          !changeUp && !changeDown && "text-muted-foreground/60"
        )}>
          {changeUp ? (
            <TrendingUp className="h-2.5 w-2.5" />
          ) : changeDown ? (
            <TrendingDown className="h-2.5 w-2.5" />
          ) : (
            <Minus className="h-2.5 w-2.5" />
          )}
          <span>{changeUp ? '+' : ''}{data.change30m.toFixed(2)}%</span>
        </div>
      )}

      {/* L/S bar */}
      {!data.loading && data.longPct !== null && data.shortPct !== null && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <div className="h-1 w-16 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isBullish ? "bg-emerald-400/60" : isBearish ? "bg-rose-400/60" : "bg-primary/50"
              )}
              style={{ width: `${data.longPct}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground/50 tabular-nums font-mono">
            {data.longPct.toFixed(0)}L
          </span>
        </div>
      )}
    </div>
  );
}

export function LSRMiniBar() {
  const [lsrData, setLsrData] = useState<LSRData[]>(
    SYMBOLS.map(({ symbol, label }) => ({
      symbol, label,
      ratio: null, change30m: null, longPct: null, shortPct: null,
      loading: true, error: false,
    }))
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);

    const results = await Promise.all(
      SYMBOLS.map(async ({ symbol, label }) => {
        const result = await fetchLSR(symbol);
        return {
          symbol, label,
          ratio: result?.ratio ?? null,
          change30m: result?.change30m ?? null,
          longPct: result?.longPct ?? null,
          shortPct: result?.shortPct ?? null,
          loading: false,
          error: result === null,
        };
      })
    );

    setLsrData(results);
    setLastUpdated(new Date());
    if (!silent) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll(false);
    intervalRef.current = setInterval(() => fetchAll(true), 120_000); // refresh every 2min
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const isLive = lastUpdated !== null;
  const btcRatio = lsrData[0]?.ratio;

  return (
    <div className={cn(
      "relative flex items-center gap-2 px-3 py-2 rounded-xl overflow-hidden",
      "border border-white/8 bg-black/20 backdrop-blur-xl",
      "before:absolute before:inset-x-0 before:top-0 before:h-px",
      "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
    )}>
      {/* Live indicator + label */}
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-white/8">
        <PulseDot active={isLive} />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
          LSR
        </span>
      </div>

      {/* Signal */}
      <div className="hidden md:flex shrink-0 pr-2 border-r border-white/8">
        <Signal ratio={btcRatio ?? null} />
      </div>

      {/* Pills */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none">
        {lsrData.map((d) => (
          <LSRPill key={d.symbol} data={d} />
        ))}
      </div>

      {/* Refresh button + last updated */}
      <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-white/8">
        {lastUpdated && (
          <span className="hidden lg:block text-[9px] text-muted-foreground/40 font-mono tabular-nums">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          onClick={() => fetchAll(false)}
          disabled={refreshing}
          className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
          title="Refresh LSR data"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
