import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, ChevronDown } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LSRData {
  longShortRatio: number;
  change: number;
  openInterest: number;
  openInterestChange: number;
}

type TimeFrame = '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';

const TIME_FRAMES: { value: TimeFrame; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '2h', label: '2h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
];

export function SidebarLSRWidget() {
  const { open } = useSidebar();
  const [lsrData, setLsrData] = useState<LSRData | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('15m');

  useEffect(() => {
    const fetchBinanceLSR = async () => {
      try {
        const [lsrResponse, oiResponse] = await Promise.all([
          fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=${timeFrame}&limit=2`),
          fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=${timeFrame}&limit=2`)
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
            change: change,
            openInterest: currentOI,
            openInterestChange: oiChange
          });
        }
      } catch (error) {
        console.error('Failed to fetch LSR data:', error);
      }
    };

    fetchBinanceLSR();
    const interval = setInterval(fetchBinanceLSR, 15000);
    return () => clearInterval(interval);
  }, [timeFrame]);

  if (!lsrData) return null;

  if (!open) {
    return (
      <div className="p-3 flex justify-center">
        <Activity className="h-4 w-4 text-primary" />
      </div>
    );
  }

  const isLsrPositive = lsrData.change >= 0;
  const isOiPositive = lsrData.openInterestChange >= 0;

  return (
    <div className="p-3 space-y-1.5 bg-background/50">
      {/* Header with Time Frame Selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Market Data</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs hover:bg-muted/50"
            >
              {timeFrame}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-24 bg-popover/95 backdrop-blur-sm z-50">
            <DropdownMenuRadioGroup value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
              {TIME_FRAMES.map((tf) => (
                <DropdownMenuRadioItem key={tf.value} value={tf.value} className="text-xs">
                  {tf.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Compact LSR Display */}
      <div className="text-[11px] leading-tight space-y-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-muted-foreground">LSR (BTC):</span>
          <span className="font-mono font-semibold text-foreground">
            {lsrData.longShortRatio.toFixed(4)}
          </span>
          <span className={`font-mono flex items-center gap-0.5 ${
            isLsrPositive ? 'text-profit' : 'text-loss'
          }`}>
            {isLsrPositive ? '↗' : '↘'}
            {isLsrPositive ? '+' : ''}{lsrData.change.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-muted-foreground">Open Interest:</span>
          <span className="font-mono font-semibold text-foreground">
            ${(lsrData.openInterest / 1e9).toFixed(2)}B
          </span>
          <span className={`font-mono flex items-center gap-0.5 ${
            isOiPositive ? 'text-profit' : 'text-loss'
          }`}>
            {isOiPositive ? '↗' : '↘'}
            {isOiPositive ? '+' : ''}{lsrData.openInterestChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
