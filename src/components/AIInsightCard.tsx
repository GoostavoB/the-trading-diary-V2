import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatPercent } from '@/utils/formatNumber';
import { BlurredValue, BlurredCurrency } from '@/components/ui/BlurredValue';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AIInsightCardProps {
  trades: Trade[];
  capitalLog?: any[];
  stats?: any;
}

export const AIInsightCard = memo(({ trades, capitalLog, stats }: AIInsightCardProps) => {
  const { convertAmount, formatAmount } = useCurrency();
  const insight = useMemo(() => {
    // Add defensive check for trades
    if (!trades || trades.length === 0) {
      return {
        title: "Start Trading",
        message: "Upload your first trade to receive personalized AI insights about your trading performance.",
        icon: Target,
        color: "text-primary",
        bg: "bg-primary/5"
      };
    }

    const totalPnl = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    
    // Use stats if available for more accurate calculations
    const effectiveROI = stats?.overallROI || stats?.avgRoi || 0;
    const hasCapitalTracking = capitalLog && capitalLog.length > 0;
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades.length
      : 0;
    
    const losingTrades = trades.filter(t => (t.profit_loss || 0) <= 0);
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losingTrades.length)
      : 0;

    // Recent trades (last 10)
    const recentTrades = trades.slice(-10);
    const recentPnl = recentTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const recentWins = recentTrades.filter(t => (t.profit_loss || 0) > 0).length;

    // Generate dynamic insight
    if (hasCapitalTracking && effectiveROI > 20) {
      return {
        title: "Outstanding ROI! 🚀",
        message: { roi: effectiveROI, text: "period-based ROI considering capital additions. Your capital management strategy is working!" },
        icon: TrendingUp,
        color: "text-neon-green",
        bg: "bg-neon-green/5",
        type: "roi"
      };
    }
    
    if (totalPnl > 0 && winRate >= 60) {
      return {
        title: "Excellent Performance! 🎯",
        message: { pnl: totalPnl, winRate, text: "Your consistency is paying off—keep following your strategy!" },
        icon: TrendingUp,
        color: "text-neon-green",
        bg: "bg-neon-green/5",
        type: "performance"
      };
    }
    
    if (recentPnl > 0 && recentWins >= 7) {
      return {
        title: "Hot Streak Detected! 🔥",
        message: { wins: recentWins, pnl: recentPnl, text: "Momentum is strong—stay disciplined!" },
        icon: Sparkles,
        color: "text-primary",
        bg: "bg-primary/5",
        type: "streak"
      };
    }
    
    if (avgWin > avgLoss * 2 && winRate >= 40) {
      return {
        title: "Great Risk Management",
        message: { avgWin, avgLoss, ratio: avgWin / avgLoss, text: "You're cutting losses early!" },
        icon: Target,
        color: "text-primary",
        bg: "bg-primary/5",
        type: "risk"
      };
    }
    
    if (recentPnl < 0) {
      return {
        title: "Take a Break",
        message: { pnl: Math.abs(recentPnl), text: "Consider reviewing your strategy and reducing position size temporarily." },
        icon: TrendingDown,
        color: "text-yellow-500",
        bg: "bg-yellow-500/5",
        type: "warning"
      };
    }
    
    if (totalPnl < 0) {
      return {
        title: "Review Your Strategy",
        message: { pnl: Math.abs(totalPnl), text: "Focus on risk management and consider paper trading your next setup before committing." },
        icon: TrendingDown,
        color: "text-neon-red",
        bg: "bg-neon-red/5",
        type: "alert"
      };
    }

    return {
      title: "Keep Building",
      message: { trades: trades.length, winRate, text: hasCapitalTracking ? "Track capital in Analytics for accurate ROI insights." : "Add capital history for period-based ROI tracking." },
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/5",
      type: "building"
    };
  }, [trades, capitalLog, stats]);

  const Icon = insight.icon;

  const renderMessage = () => {
    if (typeof insight.message === 'string') {
      return insight.message;
    }

    const msg = insight.message as any;
    
    switch (insight.type) {
      case 'roi':
        return (
          <>
            <BlurredValue value={msg.roi.toFixed(2)} suffix="%" /> {msg.text}
          </>
        );
      case 'performance':
        return (
          <>
            You're up <BlurredCurrency amount={msg.pnl} className="inline" /> with a <BlurredValue value={msg.winRate.toFixed(2)} suffix="%" /> win rate. {msg.text}
          </>
        );
      case 'streak':
        return (
          <>
            You've won {msg.wins} of your last 10 trades with <BlurredCurrency amount={msg.pnl} className="inline" /> profit. {msg.text}
          </>
        );
      case 'risk':
        return (
          <>
            Your average win (<BlurredCurrency amount={msg.avgWin} className="inline" />) is <BlurredValue value={msg.ratio.toFixed(1)} suffix="x" /> your average loss. {msg.text}
          </>
        );
      case 'warning':
        return (
          <>
            Recent trades are down <BlurredCurrency amount={msg.pnl} className="inline" />. {msg.text}
          </>
        );
      case 'alert':
        return (
          <>
            Overall down <BlurredCurrency amount={msg.pnl} className="inline" />. {msg.text}
          </>
        );
      case 'building':
        return (
          <>
            {msg.trades} trades logged with <BlurredValue value={msg.winRate.toFixed(2)} suffix="%" /> win rate. {msg.text}
          </>
        );
      default:
        return msg.text || msg;
    }
  };

  return (
    <Card className={`p-6 ${insight.bg} border-border/50 hover-lift transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${insight.color}`} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">AI Insight</span>
          </div>
          <h3 className="font-semibold text-base">{insight.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {renderMessage()}
          </p>
        </div>
      </div>
    </Card>
  );
});

AIInsightCard.displayName = 'AIInsightCard';
