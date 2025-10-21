import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface LSRData {
  longShortRatio: number;
  change15m: number;
  openInterest: number;
  openInterestChange15m: number;
}

export const HomeMarketBanner = () => {
  const [lsrData, setLsrData] = useState<LSRData | null>(null);

  useEffect(() => {
    fetchBinanceLSR();
    const interval = setInterval(fetchBinanceLSR, 15 * 1000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBinanceLSR = async () => {
    try {
      // Fetch 15min timeframe data
      const [lsrResponse, oiResponse] = await Promise.all([
        fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=15m&limit=2'),
        fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=15m&limit=2')
      ]);

      const lsrData = await lsrResponse.json();
      const oiData = await oiResponse.json();

      if (lsrData && lsrData.length >= 2 && oiData && oiData.length >= 2) {
        const latestLSR = parseFloat(lsrData[lsrData.length - 1].longShortRatio);
        const prevLSR = parseFloat(lsrData[0].longShortRatio);
        const lsrChange = ((latestLSR - prevLSR) / prevLSR) * 100;

        const latestOI = parseFloat(oiData[oiData.length - 1].sumOpenInterest);
        const prevOI = parseFloat(oiData[0].sumOpenInterest);
        const oiChange = ((latestOI - prevOI) / prevOI) * 100;

        setLsrData({
          longShortRatio: latestLSR,
          change15m: lsrChange,
          openInterest: latestOI,
          openInterestChange15m: oiChange,
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  if (!lsrData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 hidden md:block"
    >
      <div className="glass-strong backdrop-blur-xl border border-primary/20 rounded-2xl px-6 py-3 shadow-lg">
        <div className="flex items-center gap-6 text-xs">
          {/* LSR */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-medium">LSR (BTC 15m):</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {lsrData.longShortRatio.toFixed(4)}
              </span>
              <div className={`flex items-center gap-1 ${
                lsrData.change15m >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {lsrData.change15m >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-semibold">
                  {lsrData.change15m >= 0 ? '+' : ''}{lsrData.change15m.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border/50" />

          {/* Open Interest */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-medium">Open Interest:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                ${(lsrData.openInterest / 1_000_000_000).toFixed(2)}B
              </span>
              <div className={`flex items-center gap-1 ${
                lsrData.openInterestChange15m >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {lsrData.openInterestChange15m >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-semibold">
                  {lsrData.openInterestChange15m >= 0 ? '+' : ''}{lsrData.openInterestChange15m.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
