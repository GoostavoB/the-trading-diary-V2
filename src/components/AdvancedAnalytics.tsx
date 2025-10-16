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
import { TrendingUp, TrendingDown, Target, DollarSign, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bullBearImage from '@/assets/bull-bear-realistic.png';

interface Trade {
  id: string;
  asset: string;
  pnl: number;
  roi: number;
  setup: string;
  trade_date: string;
  position_type?: 'long' | 'short';
}

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
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalROI = initialInvestment > 0 ? ((totalPnl / initialInvestment) * 100) : 0;

  // Average ROI per trade
  const avgROI = trades.length > 0 
    ? trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length 
    : 0;

  // Average revenue per day
  const tradesByDate = trades.reduce((acc, trade) => {
    const date = new Date(trade.trade_date).toDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date] += trade.pnl || 0;
    return acc;
  }, {} as Record<string, number>);
  const avgRevenuePerDay = Object.keys(tradesByDate).length > 0
    ? Object.values(tradesByDate).reduce((sum, pnl) => sum + pnl, 0) / Object.keys(tradesByDate).length
    : 0;

  // Most traded asset
  const assetCounts = trades.reduce((acc, trade) => {
    acc[trade.asset] = (acc[trade.asset] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostTradedAsset = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const mostTradedCount = mostTradedAsset !== 'N/A' ? assetCounts[mostTradedAsset] : 0;
  const mostTradedPercentage = trades.length > 0 ? (mostTradedCount / trades.length) * 100 : 0;
  const mostTradedTrades = mostTradedAsset !== 'N/A' ? trades.filter(t => t.asset === mostTradedAsset) : [];
  const mostTradedROI = mostTradedTrades.length > 0
    ? mostTradedTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / mostTradedTrades.length
    : 0;

  // Asset with more wins
  const assetWins = trades.reduce((acc, trade) => {
    if (trade.pnl > 0) {
      if (!acc[trade.asset]) acc[trade.asset] = 0;
      acc[trade.asset] += 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const assetWithMoreWins = Object.entries(assetWins)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const totalWins = trades.filter(t => t.pnl > 0).length;
  const mostWinsCount = assetWithMoreWins !== 'N/A' ? assetWins[assetWithMoreWins] : 0;
  const mostWinsPercentage = totalWins > 0 ? (mostWinsCount / totalWins) * 100 : 0;
  const mostWinsTrades = assetWithMoreWins !== 'N/A' ? trades.filter(t => t.asset === assetWithMoreWins && t.pnl > 0) : [];
  const mostWinsROI = mostWinsTrades.length > 0
    ? mostWinsTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / mostWinsTrades.length
    : 0;

  // Asset with biggest losses
  const assetLosses = trades.reduce((acc, trade) => {
    if (!acc[trade.asset]) acc[trade.asset] = 0;
    acc[trade.asset] += trade.pnl || 0;
    return acc;
  }, {} as Record<string, number>);
  const assetWithBiggestLosses = Object.entries(assetLosses)
    .sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A';
  const totalLosses = trades.filter(t => t.pnl < 0).length;
  const biggestLossesTrades = assetWithBiggestLosses !== 'N/A' 
    ? trades.filter(t => t.asset === assetWithBiggestLosses && t.pnl < 0)
    : [];
  const biggestLossesCount = biggestLossesTrades.length;
  const biggestLossesPercentage = totalLosses > 0 ? (biggestLossesCount / totalLosses) * 100 : 0;
  const biggestLossesROI = biggestLossesTrades.length > 0
    ? biggestLossesTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / biggestLossesTrades.length
    : 0;

  // Top setup by wins
  const setupWins = trades.reduce((acc, trade) => {
    if (trade.pnl > 0 && trade.setup) {
      if (!acc[trade.setup]) acc[trade.setup] = 0;
      acc[trade.setup] += 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topSetupByWins = Object.entries(setupWins)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topSetupByWinsCount = topSetupByWins !== 'N/A' ? setupWins[topSetupByWins] : 0;
  const topSetupByWinsROI = topSetupByWins !== 'N/A'
    ? trades.filter(t => t.setup === topSetupByWins && t.pnl > 0)
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
  const totalShorts = trades.filter(t => t.position_type === 'short').length;
  const totalLongs = trades.filter(t => t.position_type === 'long').length;
  
  // Current month statistics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthTrades = trades.filter(t => {
    const tradeDate = new Date(t.trade_date);
    return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
  });
  const monthShorts = currentMonthTrades.filter(t => t.position_type === 'short').length;
  const monthLongs = currentMonthTrades.filter(t => t.position_type === 'long').length;
  const totalMonthTrades = currentMonthTrades.length;
  const monthShortPercentage = totalMonthTrades > 0 ? (monthShorts / totalMonthTrades) * 100 : 0;
  const monthLongPercentage = totalMonthTrades > 0 ? (monthLongs / totalMonthTrades) * 100 : 0;
  const isShortDominant = monthShortPercentage > monthLongPercentage;

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-card border-border hover:border-foreground/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total ROI</p>
              <Target 
                className={totalROI > 0 ? 'text-neon-green' : totalROI < 0 ? 'text-neon-red' : 'text-foreground'} 
                size={24} 
              />
            </div>
            <p className="text-2xl font-bold mb-1">{totalROI.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mb-3">
              Based on initial investment of ${initialInvestment.toFixed(2)}
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
          <StatCard
            title="Average ROI per Trade"
            value={`${avgROI.toFixed(2)}%`}
            icon={TrendingUp}
            trend="neutral"
          />
          <StatCard
            title="Avg Revenue per Day"
            value={`$${avgRevenuePerDay.toFixed(2)}`}
            icon={DollarSign}
            trend={avgRevenuePerDay > 0 ? 'up' : 'down'}
          />
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
              <div className="flex items-center justify-between mb-4">
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
                <div className="ml-6 flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                    isShortDominant 
                      ? 'border-neon-red bg-neon-red/10' 
                      : 'border-neon-green bg-neon-green/10'
                  } transition-all duration-500`}>
                    <img 
                      src={bullBearImage} 
                      alt={isShortDominant ? "Bear Market" : "Bull Market"}
                      className={`w-14 h-14 object-contain transition-all duration-500 ${
                        isShortDominant ? 'rotate-180 opacity-80' : 'opacity-80'
                      }`}
                      style={{
                        filter: isShortDominant 
                          ? 'hue-rotate(0deg) saturate(1.5) brightness(1.2)' 
                          : 'hue-rotate(90deg) saturate(1.5) brightness(1.2)'
                      }}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Asset Performance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Most Traded</p>
                <p className="text-xl font-medium mb-1">{mostTradedAsset}</p>
                <p className="text-xs text-muted-foreground">
                  {mostTradedCount} trades / {trades.length} total ({mostTradedPercentage.toFixed(1)}%)
                </p>
                <p className="text-sm font-medium mt-1">
                  Avg ROI: <span className={mostTradedROI >= 0 ? 'text-neon-green' : 'text-neon-red'}>
                    {mostTradedROI >= 0 ? '+' : ''}{mostTradedROI.toFixed(2)}%
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Most Wins</p>
                <p className="text-xl font-medium text-neon-green mb-1">{assetWithMoreWins}</p>
                <p className="text-xs text-muted-foreground">
                  {mostWinsCount} wins / {totalWins} total ({mostWinsPercentage.toFixed(1)}%)
                </p>
                <p className="text-sm font-medium mt-1">
                  Avg ROI: <span className="text-neon-green">
                    +{mostWinsROI.toFixed(2)}%
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Biggest Losses</p>
                <p className="text-xl font-medium text-neon-red mb-1">{assetWithBiggestLosses}</p>
                <p className="text-xs text-muted-foreground">
                  {biggestLossesCount} losses / {totalLosses} total ({biggestLossesPercentage.toFixed(1)}%)
                </p>
                <p className="text-sm font-medium mt-1">
                  Avg ROI: <span className="text-neon-red">
                    {biggestLossesROI.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Setup Performance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Setup by Wins</p>
                <p className="text-xl font-medium mb-1">{topSetupByWins}</p>
                <p className="text-sm font-medium">
                  Avg ROI: <span className={topSetupByWinsROI >= 0 ? 'text-neon-green' : 'text-neon-red'}>
                    {topSetupByWinsROI >= 0 ? '+' : ''}{topSetupByWinsROI.toFixed(2)}%
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Setup by ROI</p>
                <p className="text-xl font-medium mb-1">{topSetupByROI}</p>
                <p className="text-sm font-medium">
                  Avg ROI: <span className={topSetupByROIAvg >= 0 ? 'text-neon-green' : 'text-neon-red'}>
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