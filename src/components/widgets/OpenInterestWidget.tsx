import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PinButton } from './PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface OIData {
  openInterest: string;
  openInterestValue: string;
  change: number;
  isIncreasing: boolean;
}

export function OpenInterestWidget() {
  const [oiData, setOiData] = useState<OIData | null>(null);
  const { isPinned, togglePin } = usePinnedWidgets();
  const widgetId = 'openInterestChart' as const;

  useEffect(() => {
    const fetchOI = async () => {
      try {
        const response = await fetch(
          'https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1d&limit=2'
        );
        const data = await response.json();

        const current = parseFloat(data[0].sumOpenInterest);
        const previous = parseFloat(data[1].sumOpenInterest);
        const change = ((current - previous) / previous) * 100;

        const currentValue = parseFloat(data[0].sumOpenInterestValue);

        setOiData({
          openInterest: current.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          openInterestValue: (currentValue / 1_000_000_000).toFixed(2),
          change,
          isIncreasing: change > 0,
        });
      } catch (error) {
        console.error('Error fetching OI:', error);
      }
    };

    fetchOI();
    const interval = setInterval(fetchOI, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!oiData) {
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
          <span className="text-xs text-muted-foreground">Open Interest (BTC)</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold">
              {oiData.openInterest}
            </span>
            <div className={`flex items-center gap-1 text-xs ${
              oiData.isIncreasing ? 'text-success' : 'text-destructive'
            }`}>
              {oiData.isIncreasing ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(oiData.change).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">Value (USD)</span>
          <p className="text-lg font-semibold">
            ${oiData.openInterestValue}B
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {oiData.isIncreasing 
            ? 'Growing open interest suggests increasing market activity'
            : 'Declining open interest suggests decreasing market activity'}
        </p>
      </div>
    </Card>
  );
}
