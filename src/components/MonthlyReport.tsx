import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, TrendingUp, TrendingDown, Target, DollarSign, Activity, Award, ThumbsUp, Zap, Scale } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Trade } from '@/types/trade';

interface MonthlyReportProps {
  trades: Trade[];
}

export const MonthlyReport = ({ trades }: MonthlyReportProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Generate list of available months from trades
  const availableMonths = Array.from(
    new Set(
      trades.map(t => {
        const date = new Date(t.trade_date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  // Add current month if not in trades
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!availableMonths.includes(currentMonth)) {
    availableMonths.unshift(currentMonth);
  }

  // Calculate month stats
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  const monthTrades = trades.filter(t => {
    const tradeDate = new Date(t.trade_date);
    return tradeDate >= monthStart && tradeDate <= monthEnd;
  });

  const totalPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = monthTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = monthTrades.filter(t => (t.pnl || 0) < 0);
  const winRate = monthTrades.length > 0 ? (winningTrades.length / monthTrades.length) * 100 : 0;

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  const bestTrade = monthTrades.length > 0
    ? monthTrades.reduce((best, t) => (t.pnl || 0) > (best.pnl || 0) ? t : best)
    : null;

  const worstTrade = monthTrades.length > 0
    ? monthTrades.reduce((worst, t) => (t.pnl || 0) < (worst.pnl || 0) ? t : worst)
    : null;

  // Asset performance
  const assetPnl: Record<string, { pnl: number; trades: number }> = {};
  monthTrades.forEach(trade => {
    if (!assetPnl[trade.symbol]) {
      assetPnl[trade.symbol] = { pnl: 0, trades: 0 };
    }
    assetPnl[trade.symbol].pnl += trade.pnl || 0;
    assetPnl[trade.symbol].trades++;
  });

  const topAssets = Object.entries(assetPnl)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 5);

  // Trading days
  const tradingDays = new Set(monthTrades.map(t => new Date(t.trade_date).toDateString())).size;

  // Daily P&L
  const dailyPnl: Record<string, number> = {};
  monthTrades.forEach(trade => {
    const day = new Date(trade.trade_date).toDateString();
    dailyPnl[day] = (dailyPnl[day] || 0) + (trade.pnl || 0);
  });

  const profitableDays = Object.values(dailyPnl).filter(pnl => pnl > 0).length;
  const dailyWinRate = tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0;

  const bestDay = Object.entries(dailyPnl).reduce(
    (best, [date, pnl]) => pnl > best.pnl ? { date, pnl } : best,
    { date: '', pnl: -Infinity }
  );

  const worstDay = Object.entries(dailyPnl).reduce(
    (worst, [date, pnl]) => pnl < worst.pnl ? { date, pnl } : worst,
    { date: '', pnl: Infinity }
  );

  const handleExport = () => {
    // Create text report
    const report = `
MONTHLY TRADING REPORT - ${format(monthStart, 'MMMM yyyy')}
${'='.repeat(60)}

SUMMARY
-------
Total P&L: $${totalPnl.toFixed(2)} ${totalPnl >= 0 ? '✓' : '✗'}
Total Trades: ${monthTrades.length}
Win Rate: ${winRate.toFixed(1)}%
Winning Trades: ${winningTrades.length}
Losing Trades: ${losingTrades.length}

PERFORMANCE METRICS
-------------------
Average Win: $${avgWin.toFixed(2)}
Average Loss: $${avgLoss.toFixed(2)}
Profit Factor: ${profitFactor.toFixed(2)}
Trading Days: ${tradingDays}
Daily Win Rate: ${dailyWinRate.toFixed(1)}%

BEST TRADES
-----------
Best Trade: ${bestTrade ? `${bestTrade.symbol} - $${bestTrade.pnl?.toFixed(2)}` : 'N/A'}
Best Day: ${bestDay.date ? `${format(new Date(bestDay.date), 'MMM dd')} - $${bestDay.pnl.toFixed(2)}` : 'N/A'}

WORST TRADES
------------
Worst Trade: ${worstTrade ? `${worstTrade.symbol} - $${worstTrade.pnl?.toFixed(2)}` : 'N/A'}
Worst Day: ${worstDay.date ? `${format(new Date(worstDay.date), 'MMM dd')} - $${worstDay.pnl.toFixed(2)}` : 'N/A'}

TOP PERFORMING ASSETS
---------------------
${topAssets.map(([symbol, data], i) => 
  `${i + 1}. ${symbol}: $${data.pnl.toFixed(2)} (${data.trades} trades)`
).join('\n')}

${'='.repeat(60)}
Generated by The Trading Diary
    `.trim();

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-report-${selectedMonth}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Monthly Performance Report
          </h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive monthly trading analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => {
                const [y, m] = month.split('-').map(Number);
                return (
                  <SelectItem key={month} value={month}>
                    {format(new Date(y, m - 1), 'MMMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {monthTrades.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {monthTrades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No trades in {format(monthStart, 'MMMM yyyy')}</p>
          <p className="text-sm">Select a different month or start trading!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={`p-4 ${
              totalPnl > 0 
                ? 'bg-neon-green/10 border-neon-green/30' 
                : 'bg-neon-red/10 border-neon-red/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`w-4 h-4 ${totalPnl > 0 ? 'text-neon-green' : 'text-neon-red'}`} />
                <span className="text-xs text-muted-foreground">Total P&L</span>
              </div>
              <div className={`text-2xl font-bold ${totalPnl > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <div className={`text-2xl font-bold ${winRate >= 70 ? 'text-neon-green' : ''}`}>
                {winRate.toFixed(1)}%
              </div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Trades</span>
              </div>
              <div className="text-2xl font-bold">{monthTrades.length}</div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Trading Days</span>
              </div>
              <div className="text-2xl font-bold">{tradingDays}</div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h4 className="font-semibold mb-4">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Average Win</div>
                <div className="text-lg font-bold text-neon-green">
                  +${avgWin.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Average Loss</div>
                <div className="text-lg font-bold text-neon-red">
                  -${avgLoss.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Profit Factor</div>
                <div className={`text-lg font-bold ${profitFactor >= 2 ? 'text-neon-green' : ''}`}>
                  {profitFactor.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Winning Trades</div>
                <div className="text-lg font-bold text-neon-green">{winningTrades.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Losing Trades</div>
                <div className="text-lg font-bold text-neon-red">{losingTrades.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Daily Win Rate</div>
                <div className="text-lg font-bold">{dailyWinRate.toFixed(1)}%</div>
              </div>
            </div>
          </Card>

          {/* Best & Worst */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-neon-green" />
                Best Performances
              </h4>
              <div className="space-y-3 text-sm">
                {bestTrade && (
                  <div>
                    <div className="text-muted-foreground mb-1">Best Trade</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{bestTrade.symbol}</Badge>
                      <span className="font-bold text-neon-green">
                        +${bestTrade.pnl?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {bestDay.date && (
                  <div>
                    <div className="text-muted-foreground mb-1">Best Day</div>
                    <div className="flex items-center justify-between">
                      <span>{format(new Date(bestDay.date), 'MMM dd')}</span>
                      <span className="font-bold text-neon-green">
                        +${bestDay.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-neon-red/10 to-transparent border-neon-red/30">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-neon-red" />
                Areas to Improve
              </h4>
              <div className="space-y-3 text-sm">
                {worstTrade && (
                  <div>
                    <div className="text-muted-foreground mb-1">Worst Trade</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{worstTrade.symbol}</Badge>
                      <span className="font-bold text-neon-red">
                        ${worstTrade.pnl?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {worstDay.date && (
                  <div>
                    <div className="text-muted-foreground mb-1">Worst Day</div>
                    <div className="flex items-center justify-between">
                      <span>{format(new Date(worstDay.date), 'MMM dd')}</span>
                      <span className="font-bold text-neon-red">
                        ${worstDay.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Assets */}
          {topAssets.length > 0 && (
            <Card className="p-4 bg-muted/20 border-border">
              <h4 className="font-semibold mb-4">Top Performing Assets</h4>
              <div className="space-y-2">
                {topAssets.map(([symbol, data], idx) => (
                  <div key={symbol} className="flex items-center justify-between p-2 rounded bg-card">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <div>
                        <Badge variant="outline">{symbol}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {data.trades} trades
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      data.pnl > 0 ? 'text-neon-green' : 'text-neon-red'
                    }`}>
                      {data.pnl > 0 ? '+' : ''}${data.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monthly Summary */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
            <h4 className="font-semibold mb-3">💡 Monthly Summary</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {totalPnl > 0 ? (
                <p>✅ Great month! You finished with ${totalPnl.toFixed(2)} profit. Keep executing your plan.</p>
              ) : (
                <p>⚠️ Challenging month with ${Math.abs(totalPnl).toFixed(2)} loss. Review what went wrong and adjust.</p>
              )}
              
              {winRate >= 70 ? (
                <p><Target className="inline h-4 w-4 mr-1 text-primary" />Outstanding {winRate.toFixed(1)}% win rate! You're trading at an elite level.</p>
              ) : winRate >= 50 ? (
                <p><ThumbsUp className="inline h-4 w-4 mr-1 text-primary" />Solid {winRate.toFixed(1)}% win rate. Focus on letting winners run to boost profits.</p>
              ) : (
                <p><TrendingDown className="inline h-4 w-4 mr-1 text-secondary" />{winRate.toFixed(1)}% win rate needs improvement. Review your entry criteria and risk management.</p>
              )}
              
              {profitFactor >= 2 ? (
                <p><Zap className="inline h-4 w-4 mr-1 text-primary" />Excellent {profitFactor.toFixed(2)} profit factor. Your winners significantly outweigh your losers.</p>
              ) : (
                <p><Scale className="inline h-4 w-4 mr-1 text-muted-foreground" />Work on improving your profit factor of {profitFactor.toFixed(2)}. Cut losses faster and let winners run.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};
