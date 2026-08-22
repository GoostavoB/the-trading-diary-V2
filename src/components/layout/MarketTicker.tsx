import { useState, useEffect } from 'react';
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

export function MarketTicker() {
    const [data, setData] = useState<TickerState>(INITIAL_STATE);

  useEffect(() => {
        fetchBinanceData();
        fetchSpxData();
        const interval = setInterval(() => {
                fetchBinanceData();
                fetchSpxData();
        }, 30000);
        return () => clearInterval(interval);
  }, []);

  const fetchBinanceData = async () => {
        try {
                const [btcRes, lsrRes] = await Promise.all([
                          fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
                          fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=15m&limit=2'),
                        ]);
                const btcJson = await btcRes.json();
                const lsrJson = await lsrRes.json();

          const nextBtcPrice = btcJson?.lastPrice ? parseFloat(btcJson.lastPrice) : null;
                const nextBtcChange = btcJson?.priceChangePercent ? parseFloat(btcJson.priceChangePercent) : null;

          let nextLsrRatio: number | null = null;
                let nextLsrChange: number | null = null;
                if (Array.isArray(lsrJson) && lsrJson.length > 0) {
                          nextLsrRatio = parseFloat(lsrJson[lsrJson.length - 1].longShortRatio);
                          if (lsrJson.length >= 2) {
                                      const prevRatio = parseFloat(lsrJson[0].longShortRatio);
                                      if (prevRatio !== 0) {
                                                    nextLsrChange = ((nextLsrRatio - prevRatio) / prevRatio) * 100;
                                      }
                          }
                }

          setData((prev) => ({
                    ...prev,
                    btcPrice: nextBtcPrice ?? prev.btcPrice,
                    btcChangePct: nextBtcChange ?? prev.btcChangePct,
                    lsrRatio: nextLsrRatio ?? prev.lsrRatio,
                    lsrChangePct: nextLsrChange ?? prev.lsrChangePct,
          }));
        } catch (error) {
                console.error('MarketTicker: failed to fetch Binance data', error);
        }
  };

  const fetchSpxData = async () => {
        try {
                const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=2d');
                const json = await res.json();
                const result = json?.chart?.result?.[0];
                const meta = result?.meta;
                const lastPrice = meta?.regularMarketPrice;
                const prevClose = meta?.chartPreviousClose;
                if (typeof lastPrice === 'number' && typeof prevClose === 'number' && prevClose !== 0) {
                          setData((prev) => ({
                                      ...prev,
                                      spxPrice: lastPrice,
                                      spxChangePct: ((lastPrice - prevClose) / prevClose) * 100,
                          }));
                }
        } catch (error) {
                console.error('MarketTicker: S&P 500 source unavailable', error);
        }
  };

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
