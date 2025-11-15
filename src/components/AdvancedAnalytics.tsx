import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Target, DollarSign, Edit, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Trade } from '@/types/trade';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';
import { calculateTradePnL, calculateTotalPnL } from '@/utils/pnl';
import { calculateTradingDays } from '@/utils/tradingDays';
import { useUserSettings } from '@/hooks/useUserSettings';

interface AdvancedAnalyticsProps {
  trades: Trade[];
  initialInvestment: number;
  userId: string;
  onInitialInvestmentUpdate: (newValue: number) => void;
}

export const AdvancedAnalytics = ({ trades, initialInvestment, userId, onInitialInvestmentUpdate }: AdvancedAnalyticsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { settings } = useUserSettings();
  const tradingDaysMode = settings.trading_days_calculation_mode || 'calendar';

  const handleSaveCapital = async () => {
    const newValue = parseFloat(capitalValue);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ initial_investment: newValue })
        .eq('user_id', userId);

      if (error) throw error;

      onInitialInvestmentUpdate(newValue);
      toast.success('Initial capital updated successfully!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating initial investment:', error);
      toast.error('Failed to update initial capital');
    } finally {
      setIsSaving(false);
    }
  };
  // Total ROI calculation
  const totalPnl = calculateTotalPnL(trades, { includeFees: true });
  const totalROI = initialInvestment > 0 ? ((totalPnl / initialInvestment) * 100) : 0;

  // Average ROI per trade
  const avgROI = trades.length > 0 
    ? trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length 
    : 0;

  // Average revenue per day
  const tradesByDate = trades.reduce((acc, trade) => {
    const dateKey = trade.closed_at || trade.trade_date;
    if (!dateKey) return acc;
    const date = new Date(dateKey).toDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date] += calculateTradePnL(trade, { includeFees: true });
    return acc;
  }, {} as Record<string, number>);
  
  const { tradingDays } = calculateTradingDays(trades, tradingDaysMode);
  const avgRevenuePerDay = tradingDays > 0 ? totalPnl / tradingDays : 0;

  // Most traded asset
  const assetCounts = trades.reduce((acc, trade) => {
    acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostTradedAsset = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const mostTradedCount = mostTradedAsset !== 'N/A' ? assetCounts[mostTradedAsset] : 0;
  const mostTradedPercentage = trades.length > 0 ? (mostTradedCount / trades.length) * 100 : 0;
  const mostTradedTrades = mostTradedAsset !== 'N/A' ? trades.filter(t => t.symbol === mostTradedAsset) : [];
  const mostTradedROI = mostTradedTrades.length > 0
    ? mostTradedTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / mostTradedTrades.length
    : 0;

  // Asset with more wins
  const assetWins = trades.reduce((acc, trade) => {
    if (calculateTradePnL(trade, { includeFees: true }) > 0) {
      if (!acc[trade.symbol]) acc[trade.symbol] = 0;
      acc[trade.symbol] += 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const assetWithMoreWins = Object.entries(assetWins)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const totalWins = trades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0).length;
  const mostWinsCount = assetWithMoreWins !== 'N/A' ? assetWins[assetWithMoreWins] : 0;
  const mostWinsPercentage = totalWins > 0 ? (mostWinsCount / totalWins) * 100 : 0;
  const mostWinsTrades = assetWithMoreWins !== 'N/A' 
    ? trades.filter(t => t.symbol === assetWithMoreWins && calculateTradePnL(t, { includeFees: true }) > 0) 
    : [];
  const mostWinsROI = mostWinsTrades.length > 0
    ? mostWinsTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / mostWinsTrades.length
    : 0;

  // Asset with biggest losses
  const assetLosses = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) acc[trade.symbol] = 0;
    acc[trade.symbol] += calculateTradePnL(trade, { includeFees: true });
    return acc;
  }, {} as Record<string, number>);
  const assetWithBiggestLosses = Object.entries(assetLosses)
    .sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A';
  const totalLosses = trades.filter(t => calculateTradePnL(t, { includeFees: true }) < 0).length;
  const biggestLossesTrades = assetWithBiggestLosses !== 'N/A' 
    ? trades.filter(t => t.symbol === assetWithBiggestLosses && calculateTradePnL(t, { includeFees: true }) < 0)
    : [];
  const biggestLossesCount = biggestLossesTrades.length;
  const biggestLossesPercentage = totalLosses > 0 ? (biggestLossesCount / totalLosses) * 100 : 0;
  const biggestLossesROI = biggestLossesTrades.length > 0
    ? biggestLossesTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / biggestLossesTrades.length
    : 0;

  // Top setup by wins
  const setupWins = trades.reduce((acc, trade) => {
    if (calculateTradePnL(trade, { includeFees: true }) > 0 && trade.setup) {
      if (!acc[trade.setup]) acc[trade.setup] = 0;
      acc[trade.setup] += 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topSetupByWins = Object.entries(setupWins)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topSetupByWinsCount = topSetupByWins !== 'N/A' ? setupWins[topSetupByWins] : 0;
  const topSetupByWinsROI = topSetupByWins !== 'N/A'
    ? trades.filter(t => t.setup === topSetupByWins && calculateTradePnL(t, { includeFees: true }) > 0)
        .reduce((sum, t) => sum + (t.roi || 0), 0) / topSetupByWinsCount
    : 0;

  // Top setup by ROI
  const setupROI = trades.reduce((acc, trade) => {
    if (trade.setup) {
      if (!acc[trade.setup]) {
        acc[trade.setup] = { total: 0, count: 0 };
      }
      acc[trade.setup].total += trade.roi || 0;
      acc[trade.setup].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
  const topSetupByROIEntry = Object.entries(setupROI)
    .map(([setup, data]) => ({ setup, avgROI: data.total / data.count }))
    .sort((a, b) => b.avgROI - a.avgROI)[0];
  const topSetupByROI = topSetupByROIEntry?.setup || 'N/A';
  const topSetupByROIAvg = topSetupByROIEntry?.avgROI || 0;

  // Short vs Long statistics
  const totalShorts = trades.filter(t => t.side === 'short').length;
  const totalLongs = trades.filter(t => t.side === 'long').length;
  
  // Current month statistics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthTrades = trades.filter(t => {
    const dateKey = t.closed_at || t.trade_date;
    if (!dateKey) return false;
    const tradeDate = new Date(dateKey);
    return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
  });
  const monthShorts = currentMonthTrades.filter(t => t.side === 'short').length;
  const monthLongs = currentMonthTrades.filter(t => t.side === 'long').length;
  const totalMonthTrades = currentMonthTrades.length;
  const monthShortPercentage = totalMonthTrades > 0 ? (monthShorts / totalMonthTrades) * 100 : 0;
  const monthLongPercentage = totalMonthTrades > 0 ? (monthLongs / totalMonthTrades) * 100 : 0;
  const isShortDominant = monthShortPercentage > monthLongPercentage;

  // Day of week statistics
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = daysOfWeek.map((dayName, dayIndex) => {
    const dayTrades = trades.filter(t => new Date(t.trade_date).getDay() === dayIndex);
    const wins = dayTrades.filter(t => t.profit_loss > 0).length;
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
    const avgROI = dayTrades.length > 0 
      ? dayTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / dayTrades.length 
      : 0;
    
    return {
      day: dayName,
      trades: dayTrades.length,
      winRate,
      avgROI
    };
  }).filter(stat => stat.trades > 0); // Only show days with trades

  const topDaysByWinRate = [...dayStats].sort((a, b) => b.winRate - a.winRate).slice(0, 7);
  const topDaysByROI = [...dayStats].sort((a, b) => b.avgROI - a.avgROI).slice(0, 7);

  // Fee calculations
  const totalFundingFees = trades.reduce((sum, t) => sum + (t.funding_fee || 0), 0);
  const totalTradingFees = trades.reduce((sum, t) => sum + (t.trading_fee || 0), 0);
  const totalFees = totalFundingFees + totalTradingFees;
  
  // Calculate Total Assets (P&L minus fees)
  const netPnl = totalPnl - totalFees;
  const totalAssets = initialInvestment + netPnl;

  // Broker fee statistics
  const brokerStats = trades.reduce((acc, trade) => {
    const broker = trade.broker || 'Unknown';
    if (!acc[broker]) {
      acc[broker] = {
        totalFees: 0,
        tradeCount: 0
      };
    }
    acc[broker].totalFees += (trade.funding_fee || 0) + (trade.trading_fee || 0);
    acc[broker].tradeCount += 1;
    return acc;
  }, {} as Record<string, { totalFees: number; tradeCount: number }>);

  const brokerFeeData = Object.entries(brokerStats)
    .map(([broker, stats]) => ({
      broker,
      totalFees: stats.totalFees,
      avgFeePerTrade: stats.totalFees / stats.tradeCount,
      tradeCount: stats.tradeCount
    }))
    .sort((a, b) => b.totalFees - a.totalFees);

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon 
          className={trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-red' : 'text-foreground'} 
          size={24} 
        />
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
        
        {/* Total Assets - Prominent Display */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Total Assets</p>
              <p className={`text-5xl font-bold ${totalAssets === 0 ? 'text-foreground' : totalAssets > initialInvestment ? 'text-neon-green' : 'text-neon-red'}`}>
                <BlurredCurrency amount={totalAssets} />
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Initial Capital: <BlurredCurrency amount={initialInvestment} className="inline" /> + Total P&L: <BlurredCurrency amount={totalPnl} className="inline" /> - Fees: <BlurredCurrency amount={totalFees} className="inline" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">ROI</p>
              <p className={`text-3xl font-bold ${totalROI === 0 ? 'text-foreground' : totalROI > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {totalROI > 0 ? '+' : ''}<BlurredPercent value={totalROI} />
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                From initial capital
              </p>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total ROI</p>
              <Target 
                className={totalROI > 0 ? 'text-neon-green' : totalROI < 0 ? 'text-neon-red' : 'text-foreground'} 
                size={24} 
              />
            </div>
            <p className={`text-2xl font-bold mb-1 ${totalROI === 0 ? 'text-foreground' : totalROI > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              <BlurredPercent value={totalROI} />
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Based on initial investment of <BlurredCurrency amount={initialInvestment} className="inline" />
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setCapitalValue(initialInvestment.toString())}
                >
                  <Edit className="w-3 h-3 mr-2" />
                  {initialInvestment === 0 ? 'Set Initial Capital' : 'Edit Initial Capital'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Initial Capital</DialogTitle>
                  <DialogDescription>
                    Set your starting capital to calculate your total ROI accurately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="capital">Initial Capital ($)</Label>
                    <Input
                      id="capital"
                      type="number"
                      step="0.01"
                      min="0"
                      value={capitalValue}
                      onChange={(e) => setCapitalValue(e.target.value)}
                      placeholder="1000.00"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveCapital} 
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Average ROI per Trade</p>
              <TrendingUp 
                className={avgROI > 0 ? 'text-neon-green' : avgROI < 0 ? 'text-neon-red' : 'text-foreground'} 
                size={24} 
              />
            </div>
            <p className={`text-2xl font-bold ${avgROI === 0 ? 'text-foreground' : avgROI > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              <BlurredPercent value={avgROI} />
            </p>
          </Card>
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Revenue per Day</p>
              <DollarSign 
                className={avgRevenuePerDay > 0 ? 'text-neon-green' : avgRevenuePerDay < 0 ? 'text-neon-red' : 'text-foreground'} 
                size={24} 
              />
            </div>
            <p className={`text-2xl font-bold ${avgRevenuePerDay === 0 ? 'text-foreground' : avgRevenuePerDay > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              <BlurredCurrency amount={avgRevenuePerDay} />
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Funding Fees */}
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Funding Fees</p>
              <DollarSign className="text-neon-red" size={24} />
            </div>
            <p className="text-2xl font-bold text-neon-red">
              <BlurredCurrency amount={totalFundingFees} />
            </p>
          </Card>

          {/* Total Trading Fees */}
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Trading Fees</p>
              <DollarSign className="text-neon-red" size={24} />
            </div>
            <p className="text-2xl font-bold text-neon-red">
              <BlurredCurrency amount={totalTradingFees} />
            </p>
          </Card>

          {/* Total Fees */}
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Fees</p>
              <DollarSign className="text-neon-red" size={24} />
            </div>
            <p className="text-2xl font-bold text-neon-red">
              <BlurredCurrency amount={totalFees} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Funding + Trading fees
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Fees Per Broker */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">💳 Total Paid Fees Per Broker</h3>
            <div className="space-y-3">
              {brokerFeeData.length > 0 ? brokerFeeData.map((data, index) => (
                <div key={data.broker} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400' :
                      index === 2 ? 'bg-orange-600/20 text-orange-600 border-2 border-orange-600' :
                      'bg-muted text-muted-foreground border-2 border-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{data.broker}</p>
                      <p className="text-xs text-muted-foreground">{data.tradeCount} trades</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Total Fees</p>
                      <p className="text-lg font-bold text-neon-red">
                        ${data.totalFees.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Avg per Trade</p>
                      <p className="text-lg font-bold text-foreground">
                        ${data.avgFeePerTrade.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No broker data available
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Short/Long Totals */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Position Types</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Shorts</p>
                <p className="text-3xl font-bold text-neon-red">{totalShorts}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Longs</p>
                <p className="text-3xl font-bold text-neon-green">{totalLongs}</p>
              </div>
            </div>
          </Card>

          {/* Monthly Dominance Card */}
          <Card className="p-6 bg-card border-border relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-4">This Month's Dominance</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neon-red">Short</span>
                    <span className="text-sm font-bold text-neon-red">{monthShortPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div 
                      className="bg-neon-red h-2 rounded-full transition-all duration-500"
                      style={{ width: `${monthShortPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neon-green">Long</span>
                    <span className="text-sm font-bold text-neon-green">{monthLongPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-neon-green h-2 rounded-full transition-all duration-500"
                      style={{ width: `${monthLongPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {totalMonthTrades} trades this month
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Best Days by Win Rate */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Best Days by Win Rate</h3>
            </div>
            <div className="space-y-3">
              {topDaysByWinRate.length > 0 ? topDaysByWinRate.map((stat, index) => (
                <div key={stat.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stat.day}</p>
                      <p className="text-xs text-muted-foreground">{stat.trades} trades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${stat.winRate >= 60 ? 'text-neon-green' : 'text-foreground'}`}>
                      {stat.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">win rate</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Not enough data yet
                </p>
              )}
            </div>
          </Card>

          {/* Best Days by ROI */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Best Days by Avg ROI</h3>
            </div>
            <div className="space-y-3">
              {topDaysByROI.length > 0 ? topDaysByROI.map((stat, index) => (
                <div key={stat.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stat.day}</p>
                      <p className="text-xs text-muted-foreground">{stat.trades} trades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      stat.avgROI > 0 ? 'text-neon-green' : 
                      stat.avgROI < 0 ? 'text-neon-red' : 
                      'text-foreground'
                    }`}>
                      {stat.avgROI >= 0 ? '+' : ''}{stat.avgROI.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">avg ROI</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Not enough data yet
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Most Traded Asset */}
          <Card className="p-5 bg-gradient-to-br from-card to-muted/20 border-border hover:border-primary/50 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Most Traded</p>
                <TrendingUp className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground mb-1">{mostTradedAsset}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{mostTradedCount} trades</span>
                  <span>•</span>
                  <span>{mostTradedPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Average ROI</p>
                <p className={`text-lg font-bold ${mostTradedROI === 0 ? 'text-foreground' : mostTradedROI > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {mostTradedROI >= 0 ? '+' : ''}{mostTradedROI.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Most Wins Asset */}
          <Card className="p-5 bg-gradient-to-br from-card to-neon-green/5 border-border hover:border-neon-green/50 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Most Wins</p>
                <Target className="w-4 h-4 text-neon-green opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neon-green mb-1">{assetWithMoreWins}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{mostWinsCount} wins</span>
                  <span>•</span>
                  <span>{mostWinsPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Average ROI</p>
                <p className="text-lg font-bold text-neon-green">
                  +{mostWinsROI.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Biggest Losses Asset */}
          <Card className="p-5 bg-gradient-to-br from-card to-neon-red/5 border-border hover:border-neon-red/50 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Biggest Losses</p>
                <TrendingDown className="w-4 h-4 text-neon-red opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neon-red mb-1">{assetWithBiggestLosses}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{biggestLossesCount} losses</span>
                  <span>•</span>
                  <span>{biggestLossesPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Average ROI</p>
                <p className="text-lg font-bold text-neon-red">
                  {biggestLossesROI.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Setup Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-1">Top Setup by Wins</p>
                <p className="text-xl font-medium mb-1">{topSetupByWins}</p>
                <p className="text-sm font-medium">
                  Avg ROI: <span className={topSetupByWinsROI === 0 ? 'text-foreground' : topSetupByWinsROI > 0 ? 'text-neon-green' : 'text-neon-red'}>
                    {topSetupByWinsROI >= 0 ? '+' : ''}{topSetupByWinsROI.toFixed(2)}%
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-1">Top Setup by ROI</p>
                <p className="text-xl font-medium mb-1">{topSetupByROI}</p>
                <p className="text-sm font-medium">
                  Avg ROI: <span className={topSetupByROIAvg === 0 ? 'text-foreground' : topSetupByROIAvg > 0 ? 'text-neon-green' : 'text-neon-red'}>
                    {topSetupByROIAvg >= 0 ? '+' : ''}{topSetupByROIAvg.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};