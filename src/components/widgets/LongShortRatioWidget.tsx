import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PinButton } from './PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface LSRData {
  longShortRatio: number;
  longPercent: number;
  shortPercent: number;
  change: number;
  isIncreasing: boolean;
}

export function LongShortRatioWidget() {
  const [lsrData, setLsrData] = useState<LSRData | null>(null);
  const { isPinned, togglePin } = usePinnedWidgets();
  const widgetId = 'lsrMarketData' as const;

  useEffect(() => {
    const fetchLSR = async () => {
      try {
        const response = await fetch(
          'https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1d&limit=2'
        );
        const data = await response.json();

        const current = parseFloat(data[0].longShortRatio);
        const previous = parseFloat(data[1].longShortRatio);
        const change = ((current - previous) / previous) * 100;

        const longPercent = parseFloat(data[0].longAccount) * 100;
        const shortPercent = parseFloat(data[0].shortAccount) * 100;

        setLsrData({
          longShortRatio: current,
          longPercent,
          shortPercent,
          change,
          isIncreasing: change > 0,
        });
      } catch (error) {
        console.error('Error fetching LSR:', error);
      }
    };

    fetchLSR();
    const interval = setInterval(fetchLSR, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lsrData) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative p-4 hover:shadow-lg transition-all">
      <div className="absolute top-2 right-2">
        <PinButton isPinned={isPinned(widgetId)} onToggle={() => togglePin(widgetId)} />
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-muted-foreground">Long/Short Ratio</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold">
              {lsrData.longShortRatio.toFixed(4)}
            </span>
            <div className={`flex items-center gap-1 text-xs ${
              lsrData.isIncreasing ? 'text-success' : 'text-destructive'
            }`}>
              {lsrData.isIncreasing ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(lsrData.change).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-success">Long: {lsrData.longPercent.toFixed(1)}%</span>
            <span className="text-destructive">Short: {lsrData.shortPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="bg-success/50" 
              style={{ width: `${lsrData.longPercent}%` }}
            />
            <div 
              className="bg-destructive/50" 
              style={{ width: `${lsrData.shortPercent}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {lsrData.longShortRatio > 1 
            ? 'More traders are long (bullish)'
            : 'More traders are short (bearish)'}
        </p>
      </div>
    </Card>
  );
}
