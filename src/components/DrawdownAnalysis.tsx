import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import type { Trade } from '@/types/trade';

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

export const DrawdownAnalysis = ({ trades, initialInvestment }: DrawdownAnalysisProps) => {
  const [drawdowns, setDrawdowns] = useState<DrawdownPeriod[]>([]);
  const [currentDrawdown, setCurrentDrawdown] = useState<DrawdownPeriod | null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState<DrawdownPeriod | null>(null);

  useEffect(() => {
    if (trades.length > 0 && initialInvestment > 0) {
      calculateDrawdowns();
    }
  }, [trades, initialInvestment]);

  const calculateDrawdowns = () => {
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    let runningBalance = initialInvestment;
    let peak = initialInvestment;
    let peakDate = sortedTrades[0]?.trade_date || '';
    
    const detectedDrawdowns: DrawdownPeriod[] = [];
    let currentDD: Partial<DrawdownPeriod> | null = null;

    sortedTrades.forEach((trade, index) => {
      const tradePnl = trade.pnl || 0;
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

  const currentBalance = initialInvestment + trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalReturn = ((currentBalance - initialInvestment) / initialInvestment) * 100;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-neon-red" />
          Drawdown Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
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
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`p-4 ${
              currentDrawdown 
                ? 'bg-neon-red/10 border-neon-red/30' 
                : 'bg-neon-green/10 border-neon-green/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className={`w-4 h-4 ${
                  currentDrawdown ? 'text-neon-red' : 'text-neon-green'
                }`} />
                <span className="text-xs text-muted-foreground">Current Status</span>
              </div>
              <div className={`text-2xl font-bold ${
                currentDrawdown ? 'text-neon-red' : 'text-neon-green'
              }`}>
                {currentDrawdown ? 'In Drawdown' : 'At Peak'}
              </div>
              {currentDrawdown && (
                <div className="text-xs text-muted-foreground mt-1">
                  {currentDrawdown.daysInDrawdown} days, {currentDrawdown.tradesInDrawdown} trades
                </div>
              )}
            </Card>

            <Card className="p-4 bg-muted/20 border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Current Balance</span>
              </div>
              <div className={`text-2xl font-bold ${
                totalReturn >= 0 ? 'text-neon-green' : 'text-neon-red'
              }`}>
                ${currentBalance.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% total return
              </div>
            </Card>

            <Card className={`p-4 ${
              maxDrawdown && maxDrawdown.drawdownPercent > 20
                ? 'bg-neon-red/10 border-neon-red/30'
                : 'bg-primary/10 border-primary/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-neon-red" />
                <span className="text-xs text-muted-foreground">Max Drawdown</span>
              </div>
              <div className="text-2xl font-bold text-neon-red">
                {maxDrawdown ? `${maxDrawdown.drawdownPercent.toFixed(2)}%` : '0%'}
              </div>
              {maxDrawdown && (
                <div className="text-xs text-muted-foreground mt-1">
                  -${maxDrawdown.drawdownAmount.toFixed(2)}
                </div>
              )}
            </Card>
          </div>

          {/* Current Drawdown Details */}
          {currentDrawdown && (
            <Card className="p-4 bg-neon-red/10 border-neon-red/30 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-neon-red" />
                <h4 className="font-semibold">Active Drawdown</h4>
                <Badge variant="destructive">ALERT</Badge>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Peak Value</div>
                    <div className="font-semibold">${currentDrawdown.peakValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Value</div>
                    <div className="font-semibold text-neon-red">
                      ${currentDrawdown.troughValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Drawdown</div>
                    <div className="font-semibold text-neon-red">
                      -{currentDrawdown.drawdownPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Days</div>
                    <div className="font-semibold">{currentDrawdown.daysInDrawdown}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Recovery Progress: Need ${currentDrawdown.drawdownAmount.toFixed(2)} to reach peak
                  </div>
                  <Progress 
                    value={0} 
                    className="h-2 [&>div]:bg-neon-red" 
                  />
                </div>
                <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  ⚠️ Consider reducing position sizes and reviewing your strategy during drawdown periods
                </div>
              </div>
            </Card>
          )}

          {/* Historical Drawdowns */}
          {drawdowns.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Historical Drawdowns ({drawdowns.length})
              </h4>
              
              <div className="space-y-3">
                {drawdowns.slice(0, 5).map((dd, index) => (
                  <Card key={index} className="p-4 bg-muted/20 border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={dd.drawdownPercent > 20 ? 'destructive' : 'secondary'}>
                            -{dd.drawdownPercent.toFixed(2)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {dd.recovered ? '✓ Recovered' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(dd.startDate).toLocaleDateString()} - {new Date(dd.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-neon-red">
                          -${dd.drawdownAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dd.daysInDrawdown} days
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Peak:</span> ${dd.peakValue.toFixed(2)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trough:</span> ${dd.troughValue.toFixed(2)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trades:</span> {dd.tradesInDrawdown}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {drawdowns.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 5 most recent of {drawdowns.length} total drawdowns
                </p>
              )}
            </div>
          )}

          {/* Insights */}
          <Card className="p-4 bg-primary/5 border-primary/20 mt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Key Insights
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {maxDrawdown && maxDrawdown.drawdownPercent > 30 ? (
                <p>🚨 Your max drawdown of {maxDrawdown.drawdownPercent.toFixed(2)}% is concerning. Professional traders typically keep drawdowns under 20%.</p>
              ) : maxDrawdown && maxDrawdown.drawdownPercent > 20 ? (
                <p>⚠️ Your max drawdown of {maxDrawdown.drawdownPercent.toFixed(2)}% is elevated. Focus on better risk management.</p>
              ) : (
                <p>✅ Your max drawdown of {maxDrawdown?.drawdownPercent.toFixed(2) || '0'}% is well-controlled. Great risk management!</p>
              )}
              
              {currentDrawdown ? (
                <p><TrendingDown className="inline h-4 w-4 mr-1 text-secondary" />You're currently {currentDrawdown.daysInDrawdown} days into a drawdown. Consider taking a break or reducing your position sizes until you find your edge again.</p>
              ) : (
                <p><TrendingUp className="inline h-4 w-4 mr-1 text-primary" />You're trading at or near peak equity. Stay disciplined and stick to your strategy!</p>
              )}
              
              {drawdowns.length > 3 && (
                <p>💡 You've experienced {drawdowns.length} drawdown periods. Review what led to each one and identify patterns to avoid.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </Card>
  );
};
