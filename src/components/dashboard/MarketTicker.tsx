import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TickerItem {
  symbol: string;
  label: string;
  price: number | null;
  change24h: number | null;
  loading: boolean;
}

const TICKER_SYMBOLS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
];

interface FearGreed {
  value: number | null;
  classification: string | null;
  loading: boolean;
}

async function fetchTickers(): Promise<Record<string, { price: number; change: number }>> {
  try {
    const symbols = TICKER_SYMBOLS.map(s => `"${s.symbol}"`).join(',');
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return {};
    const data: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> = await res.json();
    const result: Record<string, { price: number; change: number }> = {};
    for (const item of data) {
      result[item.symbol] = {
        price: parseFloat(item.lastPrice),
        change: parseFloat(item.priceChangePercent),
      };
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchFearGreed(): Promise<{ value: number; classification: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;
    return { value: parseInt(item.value), classification: item.value_classification };
  } catch {
    return null;
  }
}

function fgColor(v: number) {
  if (v <= 25) return 'text-rose-400';
  if (v <= 45) return 'text-orange-400';
  if (v <= 55) return 'text-amber-400';
  if (v <= 75) return 'text-lime-400';
  return 'text-emerald-400';
}

function fgLabel(v: number) {
  if (v <= 25) return 'Extreme Fear';
  if (v <= 45) return 'Fear';
  if (v <= 55) return 'Neutral';
  if (v <= 75) return 'Greed';
  return 'Extreme Greed';
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(
    TICKER_SYMBOLS.map(({ symbol, label }) => ({ symbol, label, price: null, change24h: null, loading: true }))
  );
  const [fearGreed, setFearGreed] = useState<FearGreed>({ value: null, classification: null, loading: true });
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const [tickerData, fgData] = await Promise.all([fetchTickers(), fetchFearGreed()]);

    setTickers(TICKER_SYMBOLS.map(({ symbol, label }) => {
      const d = tickerData[symbol];
      return { symbol, label, price: d?.price ?? null, change24h: d?.change ?? null, loading: false };
    }));

    setFearGreed({
      value: fgData?.value ?? null,
      classification: fgData?.classification ?? null,
      loading: false,
    });

    setIsLive(true);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", isLive ? "bg-emerald-400" : "bg-muted-foreground/30")} />
      </span>

      {/* Price pills */}
      {tickers.map(({ symbol, label, price, change24h, loading }) => {
        const up = change24h !== null && change24h >= 0;
        return (
          <div key={symbol} className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground/70 tracking-wider">{label}</span>
            {loading ? (
              <span className="h-4 w-16 animate-pulse bg-white/10 rounded" />
            ) : price === null ? (
              <span className="text-xs text-muted-foreground/30">—</span>
            ) : (
              <>
                <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
                  ${formatPrice(price)}
                </span>
                {change24h !== null && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-[10px] font-mono font-semibold tabular-nums",
                    up ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {up ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                )}
              </>
            )}
            <span className="h-3 w-px bg-white/10 mx-0.5" />
          </div>
        );
      })}

      {/* Fear & Greed */}
      <div className="flex items-center gap-1.5">
        <Activity className="h-3 w-3 text-muted-foreground/50" />
        <span className="text-[11px] font-bold text-muted-foreground/70 tracking-wider">F&G</span>
        {fearGreed.loading ? (
          <span className="h-4 w-10 animate-pulse bg-white/10 rounded" />
        ) : fearGreed.value !== null ? (
          <span className={cn("text-sm font-mono font-bold tabular-nums", fgColor(fearGreed.value))}>
            {fearGreed.value}
            <span className="text-[10px] font-normal ml-1 opacity-70">{fgLabel(fearGreed.value)}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </div>
    </div>
  );
}
