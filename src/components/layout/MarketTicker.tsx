import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerState {
    btcPrice: number | null;
    btcChangePct: number | null;
    spxPrice: number | null;
    spxChangePct: number | null;
    lsrRatio: number | null;
    lsrChangePct: number | null;
}

const INITIAL_STATE: TickerState = {
    btcPrice: null,
    btcChangePct: null,
    spxPrice: null,
    spxChangePct: null,
    lsrRatio: null,
    lsrChangePct: null,
};

const REQUEST_TIMEOUT_MS = 6000;
const REFRESH_MS = 30000;

/**
 * Never-throwing fetch helper.
 *
 * Every network failure (offline, CORS, blocked host, timeout, bad JSON) is
 * swallowed here and surfaced as `null`. The ticker is decorative: it must not
 * be able to reject a promise that escapes this module, because an unhandled
 * rejection during render/effect used to break route navigation app-wide.
 */
async function safeFetchJson(url: string): Promise<any | null> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        window.clearTimeout(timer);
    }
}

export function MarketTicker() {
    const [data, setData] = useState<TickerState>(INITIAL_STATE);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;

        const load = () => {
            void refresh();
        };

        const refresh = async () => {
            const [btcJson, lsrJson, spxJson] = await Promise.all([
                safeFetchJson('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
                safeFetchJson('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=15m&limit=2'),
                safeFetchJson('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=2d'),
            ]);

            if (!mounted.current) return;

            try {
                const nextBtcPrice = btcJson?.lastPrice ? parseFloat(btcJson.lastPrice) : null;
                const nextBtcChange = btcJson?.priceChangePercent ? parseFloat(btcJson.priceChangePercent) : null;

                let nextLsrRatio: number | null = null;
                let nextLsrChange: number | null = null;
                if (Array.isArray(lsrJson) && lsrJson.length > 0) {
                    nextLsrRatio = parseFloat(lsrJson[lsrJson.length - 1]?.longShortRatio);
                    if (Number.isNaN(nextLsrRatio)) nextLsrRatio = null;
                    if (lsrJson.length >= 2) {
                        const prevRatio = parseFloat(lsrJson[0]?.longShortRatio);
                        if (nextLsrRatio !== null && prevRatio) {
                            nextLsrChange = ((nextLsrRatio - prevRatio) / prevRatio) * 100;
                        }
                    }
                }

                const meta = spxJson?.chart?.result?.[0]?.meta;
                const lastPrice = meta?.regularMarketPrice;
                const prevClose = meta?.chartPreviousClose;
                const hasSpx = typeof lastPrice === 'number' && typeof prevClose === 'number' && prevClose !== 0;

                setData((prev) => ({
                    btcPrice: nextBtcPrice ?? prev.btcPrice,
                    btcChangePct: nextBtcChange ?? prev.btcChangePct,
                    lsrRatio: nextLsrRatio ?? prev.lsrRatio,
                    lsrChangePct: nextLsrChange ?? prev.lsrChangePct,
                    spxPrice: hasSpx ? lastPrice : prev.spxPrice,
                    spxChangePct: hasSpx ? ((lastPrice - prevClose) / prevClose) * 100 : prev.spxChangePct,
                }));
            } catch (error) {
                // Parsing guard — the ticker simply keeps its previous values.
                console.warn('MarketTicker: could not parse market data', error);
            }
        };

        load();
        const interval = window.setInterval(load, REFRESH_MS);
        return () => {
            mounted.current = false;
            window.clearInterval(interval);
        };
    }, []);

    const formatPrice = (value: number | null, decimals = 2) =>
        value === null ? '—' : `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

    const formatChange = (value: number | null) =>
        value === null ? null : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

    const items = [
        { label: 'S&P 500', price: formatPrice(data.spxPrice, 2), change: data.spxChangePct },
        { label: 'BTC', price: formatPrice(data.btcPrice, 0), change: data.btcChangePct },
        { label: 'LSR', price: data.lsrRatio === null ? '—' : data.lsrRatio.toFixed(3), change: data.lsrChangePct },
    ];

    return (
        <div className="flex items-center gap-4 rounded-full border border-border/30 bg-white/[0.03] backdrop-blur-xl px-5 py-2 font-num tabular-nums">
            {items.map((item, index) => (
                <div key={item.label} className="flex items-center gap-4">
                    {index > 0 && <div className="h-4 w-px bg-border/40" />}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold text-foreground">{item.price}</span>
                        {item.change !== null && (
                            <span className={`flex items-center gap-0.5 text-xs font-semibold ${item.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {formatChange(item.change)}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
