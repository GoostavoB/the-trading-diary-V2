import { useState, useEffect, memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

interface DrawdownPeriod {
  startDate: string;
  endDate: string;
  peakValue: number;
  troughValue: number;
  drawdownAmount: number;
  drawdownPercent: number;
  recoveryDate: string | null;
  daysInDrawdown: number;
  tradesInDrawdown: number;
  recovered: boolean;
}

interface DrawdownAnalysisProps {
  trades: Trade[];
  initialInvestment: number;
}

const DrawdownAnalysisComponent = ({ trades, initialInvestment }: DrawdownAnalysisProps) => {
  const [drawdowns, setDrawdowns] = useState<DrawdownPeriod[]>([]);
  const [currentDrawdown, setCurrentDrawdown] = useState<DrawdownPeriod | null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState<DrawdownPeriod | null>(null);

  // Memoize sorted trades
  const sortedTrades = useMemo(() => 
    [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    ),
    [trades]
  );

  // Memoize current balance and return
  const { currentBalance, totalReturn } = useMemo(() => {
    const balance = initialInvestment + trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const returns = ((balance - initialInvestment) / initialInvestment) * 100;
    return { currentBalance: balance, totalReturn: returns };
  }, [initialInvestment, trades]);

  useEffect(() => {
    if (sortedTrades.length > 0 && initialInvestment > 0) {
      calculateDrawdowns();
    }
  }, [sortedTrades, initialInvestment]);

  const calculateDrawdowns = () => {

    let runningBalance = initialInvestment;
    let peak = initialInvestment;
    let peakDate = sortedTrades[0]?.trade_date || '';
    
    const detectedDrawdowns: DrawdownPeriod[] = [];
    let currentDD: Partial<DrawdownPeriod> | null = null;

    sortedTrades.forEach((trade, index) => {
      const tradePnl = trade.profit_loss || 0;
      runningBalance += tradePnl;

      // Check if we hit a new peak
      if (runningBalance > peak) {
        // If we were in a drawdown, it's now recovered
        if (currentDD) {
          currentDD.recoveryDate = trade.trade_date;
          currentDD.recovered = true;
          
          const startDate = new Date(currentDD.startDate!);
          const endDate = new Date(trade.trade_date);
          currentDD.daysInDrawdown = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          detectedDrawdowns.push(currentDD as DrawdownPeriod);
          currentDD = null;
        }
        
        peak = runningBalance;
        peakDate = trade.trade_date;
      }
      // Check if we're in a drawdown
      else if (runningBalance < peak) {
        if (!currentDD) {
          // Start new drawdown period
          currentDD = {
            startDate: peakDate,
            endDate: trade.trade_date,
            peakValue: peak,
            troughValue: runningBalance,
            drawdownAmount: peak - runningBalance,
            drawdownPercent: ((peak - runningBalance) / peak) * 100,
            recoveryDate: null,
            tradesInDrawdown: 1,
            recovered: false,
            daysInDrawdown: 0,
          };
        } else {
          // Update existing drawdown
          currentDD.endDate = trade.trade_date;
          currentDD.troughValue = Math.min(currentDD.troughValue!, runningBalance);
          currentDD.drawdownAmount = peak - currentDD.troughValue!;
          currentDD.drawdownPercent = ((peak - currentDD.troughValue!) / peak) * 100;
          currentDD.tradesInDrawdown!++;
        }
      }
    });

    // If still in drawdown at the end
    if (currentDD) {
      const startDate = new Date(currentDD.startDate!);
      const endDate = new Date(currentDD.endDate!);
      currentDD.daysInDrawdown = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      setCurrentDrawdown(currentDD as DrawdownPeriod);
    } else {
      setCurrentDrawdown(null);
    }

    setDrawdowns(detectedDrawdowns);

    // Find max drawdown
    const allDrawdowns = [...detectedDrawdowns];
    if (currentDD) allDrawdowns.push(currentDD as DrawdownPeriod);
    
    if (allDrawdowns.length > 0) {
      const max = allDrawdowns.reduce((prev, current) => 
        current.drawdownPercent > prev.drawdownPercent ? current : prev
      );
      setMaxDrawdown(max);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/50 border-border shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-secondary" />
          Drawdown Analysis
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Understand your account's peak-to-trough declines
        </p>
      </div>

      {initialInvestment === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Set your initial investment in Advanced Analytics to see drawdown analysis</p>
        </div>
      ) : (
        <>
          {/* Premium Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Current Drawdown Card */}
            <Card className={`p-6 relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
              currentDrawdown 
                ? 'bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border-secondary/40 shadow-lg shadow-secondary/20' 
                : 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/40 shadow-lg shadow-primary/20'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <p className="text-xs font-medium text-muted-foreground/80 mb-1 uppercase tracking-wider">
                  Current Drawdown
                </p>
                <div className={`text-4xl font-black mb-2 ${
                  currentDrawdown ? 'text-secondary' : 'text-foreground'
                }`}>
                  {currentDrawdown ? '-' : ''}<BlurredPercent value={currentDrawdown?.drawdownPercent || 0} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    currentDrawdown 
                      ? 'bg-secondary/20 text-secondary' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {currentDrawdown ? 'Active' : 'At Peak'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Maximum Drawdown Card */}
            <Card className={`p-6 relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
              maxDrawdown && maxDrawdown.drawdownPercent > 20
                ? 'bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border-secondary/40 shadow-lg shadow-secondary/20'
                : 'bg-gradient-to-br from-card via-card/80 to-card/50 border-border/60 shadow-lg'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <p className="text-xs font-medium text-muted-foreground/80 mb-1 uppercase tracking-wider">
                  Maximum Drawdown
                </p>
                <div className="text-4xl font-black text-secondary mb-2">
                  {maxDrawdown ? '-' : ''}<BlurredPercent value={maxDrawdown?.drawdownPercent || 0} />
                </div>
                {maxDrawdown && (
                  <p className="text-xs text-muted-foreground">
                    -<BlurredCurrency amount={maxDrawdown.drawdownAmount} className="inline font-semibold" />
                  </p>
                )}
              </div>
            </Card>

            {/* Recovery Needed Card */}
            <Card className={`p-6 relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
              currentDrawdown
                ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/40 shadow-lg shadow-primary/20'
                : 'bg-gradient-to-br from-card via-card/80 to-card/50 border-border/60 shadow-lg'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <p className="text-xs font-medium text-muted-foreground/80 mb-1 uppercase tracking-wider">
                  Recovery Needed
                </p>
                <div className="text-4xl font-black text-primary mb-2">
                  <BlurredPercent value={currentDrawdown?.drawdownPercent || 0} />
                </div>
                {currentDrawdown && (
                  <p className="text-xs text-muted-foreground">
                    <BlurredCurrency amount={currentDrawdown.drawdownAmount} className="inline font-semibold" /> to recover
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Active Drawdown Alert - Premium */}
          {currentDrawdown && (
            <Card className="p-6 bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border-2 border-secondary/40 mb-6 shadow-xl shadow-secondary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-secondary/20">
                  <AlertTriangle className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">Active Drawdown</h4>
                  <p className="text-xs text-muted-foreground">Monitor your recovery progress</p>
                </div>
                <Badge variant="destructive" className="font-bold">ALERT</Badge>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium">Peak Value</div>
                    <div className="font-bold text-base text-foreground">
                      <BlurredCurrency amount={currentDrawdown.peakValue} className="inline" />
                    </div>
                  </div>
                  <div className="bg-secondary/10 backdrop-blur-sm rounded-lg p-3 border border-secondary/30">
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium">Current Value</div>
                    <div className="font-bold text-base text-secondary">
                      <BlurredCurrency amount={currentDrawdown.troughValue} className="inline" />
                    </div>
                  </div>
                  <div className="bg-secondary/10 backdrop-blur-sm rounded-lg p-3 border border-secondary/30">
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium">Drawdown</div>
                    <div className="font-bold text-base text-secondary">
                      -<BlurredPercent value={currentDrawdown.drawdownPercent} className="inline" />
                    </div>
                  </div>
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium">Days</div>
                    <div className="font-bold text-base text-foreground">{currentDrawdown.daysInDrawdown}</div>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="text-sm text-foreground/90 mb-3 font-medium">
                    Recovery Progress: Need <BlurredCurrency amount={currentDrawdown.drawdownAmount} className="inline font-bold" /> to reach peak
                  </div>
                  <Progress 
                    value={0} 
                    className="h-2.5 bg-secondary/20 [&>div]:bg-gradient-to-r [&>div]:from-secondary [&>div]:to-secondary/70" 
                  />
                </div>
                <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-sm text-foreground/90 flex items-start gap-2">
                    <span className="text-yellow-500 text-lg leading-none">⚠️</span>
                    <span>Consider reducing position sizes and reviewing your strategy during drawdown periods</span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Historical Drawdowns - Premium */}
          {drawdowns.length > 0 && (
            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Historical Drawdowns ({drawdowns.length})
              </h4>
              
              <div className="space-y-3">
                {drawdowns.slice(0, 5).map((dd, index) => (
                  <Card key={index} className="p-5 bg-gradient-to-br from-card via-card/90 to-card/70 border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={dd.drawdownPercent > 20 ? 'destructive' : 'secondary'}
                            className="font-bold text-sm px-3 py-1"
                          >
                            -{dd.drawdownPercent.toFixed(2)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium">
                            {dd.recovered ? '✓ Recovered' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {new Date(dd.startDate).toLocaleDateString()} → {new Date(dd.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-secondary">
                          -<BlurredCurrency amount={dd.drawdownAmount} className="inline" />
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mt-1">
                          {dd.daysInDrawdown} days
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
                      <div>
                        <span className="text-muted-foreground font-medium">Peak:</span>
                        <div className="font-bold text-foreground mt-0.5">
                          <BlurredCurrency amount={dd.peakValue} className="inline" />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Trough:</span>
                        <div className="font-bold text-foreground mt-0.5">
                          <BlurredCurrency amount={dd.troughValue} className="inline" />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Trades:</span>
                        <div className="font-bold text-foreground mt-0.5">{dd.tradesInDrawdown}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {drawdowns.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2 bg-muted/30 rounded-lg">
                  Showing 5 most recent of {drawdowns.length} total drawdowns
                </p>
              )}
            </div>
          )}

          {/* Recovery Strategy - Premium Styling */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 mt-6">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recovery Strategy
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground/90">Continue current strategy</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground/90">Maintain discipline and consistency</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground/90">Keep tracking your performance</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground/90">Stay within risk parameters</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </Card>
  );
};

export const DrawdownAnalysis = memo(DrawdownAnalysisComponent);
