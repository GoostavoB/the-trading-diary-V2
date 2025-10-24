import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPercent } from '@/utils/formatNumber';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

interface DashboardInsightBannerProps {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
}

interface LSRData {
  longShortRatio: number;
  change24h: number;
  openInterest: number;
  openInterestChange24h: number;
}

export const DashboardInsightBanner = ({ totalPnL, winRate, totalTrades }: DashboardInsightBannerProps) => {
  const navigate = useNavigate();
  const [lsrData, setLsrData] = useState<LSRData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleMarketDataClick = () => {
    navigate('/market-data');
  };

  useEffect(() => {
    fetchBinanceLSR();
    // Refresh LSR every 5 minutes
    const interval = setInterval(fetchBinanceLSR, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBinanceLSR = async () => {
    try {
      // Fetch BTCUSDT LSR and Open Interest from Binance
      const [lsrResponse, oiResponse] = await Promise.all([
        fetch('https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=288'),
        fetch('https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT')
      ]);
      
      const lsrData = await lsrResponse.json();
      const oiData = await oiResponse.json();

      if (lsrData && lsrData.length > 0) {
        const latest = parseFloat(lsrData[lsrData.length - 1].longShortRatio);
        const yesterday = lsrData.length >= 288 ? parseFloat(lsrData[0].longShortRatio) : latest;
        const change24h = ((latest - yesterday) / yesterday) * 100;

        // Fetch historical OI for 24h change calculation
        const oiHistResponse = await fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=288');
        const oiHistData = await oiHistResponse.json();
        
        const currentOI = parseFloat(oiData.openInterest);
        const yesterdayOI = oiHistData && oiHistData.length >= 288 ? parseFloat(oiHistData[0].sumOpenInterest) : currentOI;
        const oiChange24h = ((currentOI - yesterdayOI) / yesterdayOI) * 100;

        setLsrData({
          longShortRatio: latest,
          change24h,
          openInterest: currentOI,
          openInterestChange24h: oiChange24h,
        });
      }
    } catch (error) {
      console.error('Error fetching Binance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceMessage = () => {
    if (totalTrades === 0) return "Start trading to see your insights! 🚀";
    
    if (winRate >= 70 && totalPnL > 0) {
      return (
        <>
          Excellent Performance! 🎯 You're up <BlurredCurrency amount={Math.abs(totalPnL)} className="inline" /> with a <BlurredPercent value={winRate} className="inline" /> win rate. Your consistency is paying off—keep following your strategy!
        </>
      );
    } else if (winRate >= 55 && totalPnL > 0) {
      return (
        <>
          Great Trading! 💪 You're profitable with a <BlurredPercent value={winRate} className="inline" /> win rate. Stay disciplined and manage your risk wisely.
        </>
      );
    } else if (totalPnL > 0) {
      return (
        <>
          Positive Results! ✨ You're up <BlurredCurrency amount={Math.abs(totalPnL)} className="inline" />. Focus on improving consistency to boost that win rate.
        </>
      );
    } else if (winRate >= 50) {
      return (
        <>
          Good Win Rate! 📊 <BlurredPercent value={winRate} className="inline" /> wins shows potential. Review your position sizing and risk management to turn this around.
        </>
      );
    } else {
      return `Stay Focused! 💡 Trading is a journey. Review your strategy, manage risk carefully, and keep learning from each trade.`;
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm max-w-5xl mx-auto">
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

          {/* Binance Market Data Section */}
          {!loading && lsrData && (
            <div 
              onClick={handleMarketDataClick}
              className="flex items-center gap-3 cursor-pointer group"
              title="Click to view detailed market data"
            >
              {/* LSR */}
              <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/50 group-hover:border-primary/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">LSR (BTC)</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">
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
              </div>

              {/* Open Interest */}
              <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/50 group-hover:border-primary/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Open Interest</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">
                    {(lsrData.openInterest / 1000).toFixed(1)}K
                  </span>
                  <div className={`flex items-center gap-1 text-xs ${
                    lsrData.openInterestChange24h >= 0 ? 'text-profit' : 'text-loss'
                  }`}>
                    {lsrData.openInterestChange24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-medium">
                      {lsrData.openInterestChange24h >= 0 ? '+' : ''}{lsrData.openInterestChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
