import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WidgetProps } from '@/types/widget';

interface LSRData {
  ratio: number;
  change24h: number;
  openInterest: number;
  oiChange24h: number;
}

export function LSRWidget({ id, isEditMode }: WidgetProps) {
  const [data, setData] = useState<LSRData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLSRData = async () => {
      try {
        const [lsrRes, oiRes] = await Promise.all([
          fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=288'),
          fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=288')
        ]);

        const [lsrData, oiData] = await Promise.all([
          lsrRes.json(),
          oiRes.json()
        ]);

        if (lsrData && lsrData.length > 0 && oiData && oiData.length > 0) {
          const current = lsrData[lsrData.length - 1];
          const previous = lsrData[0];
          const currentOI = oiData[oiData.length - 1];
          const previousOI = oiData[0];

          const ratio = parseFloat(current.longShortRatio);
          const prevRatio = parseFloat(previous.longShortRatio);
          const change24h = ((ratio - prevRatio) / prevRatio) * 100;

          const oi = parseFloat(currentOI.sumOpenInterest);
          const prevOI = parseFloat(previousOI.sumOpenInterest);
          const oiChange24h = ((oi - prevOI) / prevOI) * 100;

          setData({
            ratio,
            change24h,
            openInterest: oi,
            oiChange24h
          });
        }
      } catch (error) {
        console.error('LSR fetch error:', error);
      }
    };

    fetchLSRData();
    const interval = setInterval(fetchLSRData, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!isEditMode) {
      navigate('/market-data');
    }
  };

  if (!data) {
    return (
      <Card className="cursor-pointer hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-muted-foreground">Long/Short Ratio</span>
            <div className="flex items-center gap-1 text-xs">
              {data.change24h >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={data.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold">{data.ratio.toFixed(3)}</div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-muted-foreground">Open Interest</span>
            <div className="flex items-center gap-1 text-xs">
              {data.oiChange24h >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={data.oiChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.oiChange24h).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-lg font-semibold">
            {(data.openInterest / 1000000).toFixed(2)}M BTC
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Click for detailed analysis
        </div>
      </CardContent>
    </Card>
  );
}
