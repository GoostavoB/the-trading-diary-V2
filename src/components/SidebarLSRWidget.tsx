import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

interface LSRData {
  longShortRatio: number;
  change15m: number;
  openInterest: number;
  openInterestChange15m: number;
}

export function SidebarLSRWidget() {
  const { open } = useSidebar();
  const [lsrData, setLsrData] = useState<LSRData | null>(null);

  useEffect(() => {
    const fetchBinanceLSR = async () => {
      try {
        const [lsrResponse, oiResponse] = await Promise.all([
          fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=15m&limit=2'),
          fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=15m&limit=2')
        ]);

        const lsrJson = await lsrResponse.json();
        const oiJson = await oiResponse.json();

        if (lsrJson && lsrJson.length >= 2) {
          const current = parseFloat(lsrJson[0].longShortRatio);
          const previous = parseFloat(lsrJson[1].longShortRatio);
          const change = ((current - previous) / previous) * 100;

          const currentOI = parseFloat(oiJson[0].sumOpenInterest);
          const previousOI = parseFloat(oiJson[1].sumOpenInterest);
          const oiChange = ((currentOI - previousOI) / previousOI) * 100;

          setLsrData({
            longShortRatio: current,
            change15m: change,
            openInterest: currentOI,
            openInterestChange15m: oiChange
          });
        }
      } catch (error) {
        console.error('Failed to fetch LSR data:', error);
      }
    };

    fetchBinanceLSR();
    const interval = setInterval(fetchBinanceLSR, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!lsrData) return null;

  if (!open) {
    return (
      <div className="p-3 flex justify-center">
        <Activity className="h-4 w-4 text-primary" />
      </div>
    );
  }

  const isLsrPositive = lsrData.change15m >= 0;
  const isOiPositive = lsrData.openInterestChange15m >= 0;

  return (
    <div className="p-3 space-y-2 bg-background/50">
      {/* LSR */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">LSR (BTC 15m):</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-foreground">
            {lsrData.longShortRatio.toFixed(4)}
          </span>
          <span className={`font-mono text-[10px] flex items-center gap-0.5 ${
            isLsrPositive ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {isLsrPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isLsrPositive ? '+' : ''}{lsrData.change15m.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Open Interest */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Open Interest:</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-foreground">
            ${(lsrData.openInterest / 1e9).toFixed(2)}B
          </span>
          <span className={`font-mono text-[10px] flex items-center gap-0.5 ${
            isOiPositive ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {isOiPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isOiPositive ? '+' : ''}{lsrData.openInterestChange15m.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
