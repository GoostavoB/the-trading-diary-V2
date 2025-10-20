import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPercent } from '@/utils/formatNumber';

interface DashboardInsightBannerProps {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
}

interface LSRData {
  longShortRatio: number;
  change24h: number;
}

export const DashboardInsightBanner = ({ totalPnL, winRate, totalTrades }: DashboardInsightBannerProps) => {
  const [lsrData, setLsrData] = useState<LSRData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBinanceLSR();
    // Refresh LSR every 5 minutes
    const interval = setInterval(fetchBinanceLSR, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBinanceLSR = async () => {
    try {
      // Fetch BTCUSDT LSR from Binance (most representative)
      const response = await fetch(
        'https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=288'
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const latest = parseFloat(data[data.length - 1].longShortRatio);
        // Calculate 24h change (288 data points = 24 hours at 5min intervals)
        const yesterday = data.length >= 288 ? parseFloat(data[0].longShortRatio) : latest;
        const change24h = ((latest - yesterday) / yesterday) * 100;

        setLsrData({
          longShortRatio: latest,
          change24h,
        });
      }
    } catch (error) {
      console.error('Error fetching Binance LSR:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceMessage = () => {
    if (totalTrades === 0) return "Start trading to see your insights! 🚀";
    
    if (winRate >= 70 && totalPnL > 0) {
      return `Excellent Performance! 🎯 You're up $${Math.abs(totalPnL).toFixed(2)} with a ${winRate.toFixed(1)}% win rate. Your consistency is paying off—keep following your strategy!`;
    } else if (winRate >= 55 && totalPnL > 0) {
      return `Great Trading! 💪 You're profitable with a ${winRate.toFixed(1)}% win rate. Stay disciplined and manage your risk wisely.`;
    } else if (totalPnL > 0) {
      return `Positive Results! ✨ You're up $${Math.abs(totalPnL).toFixed(2)}. Focus on improving consistency to boost that win rate.`;
    } else if (winRate >= 50) {
      return `Good Win Rate! 📊 ${winRate.toFixed(1)}% wins shows potential. Review your position sizing and risk management to turn this around.`;
    } else {
      return `Stay Focused! 💡 Trading is a journey. Review your strategy, manage risk carefully, and keep learning from each trade.`;
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-start gap-4 flex-wrap">
          {/* AI Insight Section */}
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    ✨ AI Insight
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {getPerformanceMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Binance LSR Section */}
          {!loading && lsrData && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-card/50 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Binance LSR (BTC)</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {lsrData.longShortRatio.toFixed(4)}
                  </span>
                  <div className={`flex items-center gap-1 text-xs ${
                    lsrData.change24h >= 0 ? 'text-profit' : 'text-loss'
                  }`}>
                    {lsrData.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-medium">
                      {lsrData.change24h >= 0 ? '+' : ''}{lsrData.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">24h change</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
