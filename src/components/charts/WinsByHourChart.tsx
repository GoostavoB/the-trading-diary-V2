import { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useThemeMode } from "@/hooks/useThemeMode";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { ExplainMetricButton } from "@/components/ExplainMetricButton";
import { useAIAssistant } from "@/contexts/AIAssistantContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, BarChart3, Grid3x3 } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatNumber, formatPercent } from "@/utils/formatNumber";

interface WinsByHourChartProps {
  trades: Trade[];
}

const WinsByHourChartComponent = ({ trades }: WinsByHourChartProps) => {
  const { colors } = useThemeMode();
  const { isMobile } = useMobileOptimization();
  const { openWithPrompt } = useAIAssistant();

  const [viewMode, setViewMode] = useState<'bar' | 'heatmap'>('bar');
  const [timeType, setTimeType] = useState<'open' | 'close'>('close');
  const [dateRange, setDateRange] = useState<'7' | '30' | 'all'>('30');
  const [tradeType, setTradeType] = useState<'all' | 'long' | 'short'>('all');
  const [selectedAsset, setSelectedAsset] = useState<string>('all');

  // Filter trades based on selections
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    // Date range filter
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      filtered = filtered.filter(t => new Date(t.trade_date || '') >= cutoffDate);
    }

    // Trade type filter
    if (tradeType !== 'all') {
      filtered = filtered.filter(t => t.side?.toLowerCase() === tradeType);
    }

    // Asset filter
    if (selectedAsset !== 'all') {
      filtered = filtered.filter(t => t.symbol === selectedAsset);
    }

    return filtered;
  }, [trades, dateRange, tradeType, selectedAsset]);

  // Get unique assets
  const assets = useMemo(() => {
    const unique = Array.from(new Set(trades.map(t => t.symbol).filter(Boolean)));
    return ['all', ...unique];
  }, [trades]);

  const { hourlyData, bestHour, worstHour, aiInsight } = useMemo(() => {
    const hourlyDataRaw = Array.from({ length: 24 }, (_, hour) => {
      const tradesAtHour = filteredTrades.filter(trade => {
        const dateField = timeType === 'open' ? trade.opened_at : trade.closed_at;
        if (!dateField) return false;
        const date = new Date(dateField);
        return date.getHours() === hour;
      });

      const wins = tradesAtHour.filter(t => (t.pnl || 0) > 0);
      const losses = tradesAtHour.filter(t => (t.pnl || 0) <= 0);
      const totalPnL = tradesAtHour.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgROI = tradesAtHour.length > 0
        ? tradesAtHour.reduce((sum, t) => sum + (t.roi || 0), 0) / tradesAtHour.length
        : 0;
      const winRate = tradesAtHour.length > 0
        ? (wins.length / tradesAtHour.length) * 100
        : 0;

      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        hourNum: hour,
        wins: wins.length,
        losses: losses.length,
        totalPnL,
        avgROI,
        winRate,
        tradeCount: tradesAtHour.length,
      };
    });

    // Find best and worst hours
    const hoursWithTrades = hourlyDataRaw.filter(h => h.tradeCount > 0);
    const best = hoursWithTrades.reduce((max, h) => 
      h.totalPnL > max.totalPnL ? h : max
    , { hour: '--', totalPnL: -Infinity, avgROI: 0 });
    
    const worst = hoursWithTrades.reduce((min, h) => 
      h.totalPnL < min.totalPnL ? h : min
    , { hour: '--', totalPnL: Infinity, avgROI: 0 });

    // Generate AI insight
    const insight = hoursWithTrades.length > 0
      ? `Your best performance happens at ${best.hour} (avg ${formatNumber(best.totalPnL)} P&L, ${formatPercent(best.avgROI)} ROI). ${
          worst.totalPnL < 0 
            ? `Losses occur most often at ${worst.hour}. Consider reducing position size or avoiding trades during this time.`
            : 'All active hours show positive performance.'
        }`
      : 'Not enough trade data to generate insights.';

    return { 
      hourlyData: hourlyDataRaw,
      bestHour: best,
      worstHour: worst,
      aiInsight: insight
    };
  }, [filteredTrades, timeType]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{data.hour}</p>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            Trades: <span className="text-foreground font-medium">{data.tradeCount}</span>
          </p>
          <p className="text-green-500">
            Wins: <span className="font-medium">{data.wins}</span>
          </p>
          <p className="text-red-500">
            Losses: <span className="font-medium">{data.losses}</span>
          </p>
          <p className="text-muted-foreground">
            Win Rate: <span className="text-foreground font-medium">{formatPercent(data.winRate)}</span>
          </p>
          <p className="text-muted-foreground">
            Avg ROI: <span className="text-foreground font-medium">{formatPercent(data.avgROI)}</span>
          </p>
          <p className={`font-medium ${data.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            Total P&L: ${formatNumber(data.totalPnL)}
          </p>
        </div>
      </div>
    );
  };

  // Heatmap color calculation - uses theme colors
  const getHeatmapColor = (pnl: number, maxPnL: number) => {
    if (pnl === 0) return 'hsl(var(--muted))';
    const intensity = Math.abs(pnl) / maxPnL;
    
    if (pnl > 0) {
      // Use positive color from theme with intensity variation
      return colors.positive.replace(')', ` / ${0.5 + intensity * 0.5})`);
    } else {
      // Use negative color from theme with intensity variation
      return colors.negative.replace(')', ` / ${0.5 + intensity * 0.5})`);
    }
  };

  const maxPnL = Math.max(...hourlyData.map(h => Math.abs(h.totalPnL)));

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Trading Performance by Hour</CardTitle>
            <ExplainMetricButton
              metricName="Hour-by-Hour Performance"
              metricValue={`${filteredTrades.length} trades analyzed`}
              context={aiInsight}
              onExplain={openWithPrompt}
            />
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: colors.positive }} />
              <span className="text-muted-foreground">Best:</span>
              <Badge variant="outline" style={{ 
                backgroundColor: `${colors.positive.replace(')', ' / 0.1)')}`,
                color: colors.positive,
                borderColor: `${colors.positive.replace(')', ' / 0.2)')}`
              }}>
                {bestHour.hour} ({formatNumber(bestHour.totalPnL)})
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" style={{ color: colors.negative }} />
              <span className="text-muted-foreground">Worst:</span>
              <Badge variant="outline" style={{ 
                backgroundColor: `${colors.negative.replace(')', ' / 0.1)')}`,
                color: colors.negative,
                borderColor: `${colors.negative.replace(')', ' / 0.2)')}`
              }}>
                {worstHour.hour} ({formatNumber(worstHour.totalPnL)})
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('bar')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Chart
              </Button>
              <Button
                variant={viewMode === 'heatmap' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('heatmap')}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Heatmap
              </Button>
            </div>

            <Select value={timeType} onValueChange={(v: any) => setTimeType(v)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="close">Close Time</SelectItem>
                <SelectItem value="open">Open Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tradeType} onValueChange={(v: any) => setTradeType(v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="long">Longs Only</SelectItem>
                <SelectItem value="short">Shorts Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Assets" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset}>
                    {asset === 'all' ? 'All Assets' : asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {viewMode === 'bar' ? (
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 360}>
            <BarChart data={hourlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis 
                dataKey="hour" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={isMobile ? 3 : 1}
                angle={0}
                height={50}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="wins" 
                fill={colors.positive}
                radius={[6, 6, 0, 0]}
                name="Wins"
              />
              <Bar 
                dataKey="losses" 
                fill={colors.negative}
                radius={[6, 6, 0, 0]}
                name="Losses"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Performance intensity by hour (green = profit, red = loss)</p>
            <div className="grid grid-cols-8 gap-2">
              {hourlyData.map((data) => (
                <div
                  key={data.hourNum}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 group relative"
                  style={{
                    backgroundColor: getHeatmapColor(data.totalPnL, maxPnL),
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Hour ${data.hourNum}: ${data.tradeCount} trades, P&L: $${formatNumber(data.totalPnL)}`}
                >
                  <span className="text-xs font-medium text-primary-foreground drop-shadow-lg">
                    {data.hourNum}h
                  </span>
                  <span className="text-[10px] text-primary-foreground/80 drop-shadow">
                    {data.tradeCount}
                  </span>
                  
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg p-3 shadow-xl text-xs whitespace-nowrap">
                      <p className="font-semibold mb-1">{data.hour}</p>
                      <p className={data.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ${formatNumber(data.totalPnL)}
                      </p>
                      <p className="text-muted-foreground">
                        {data.tradeCount} trades
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights Panel */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1 text-foreground">AI Insights</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiInsight}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const WinsByHourChart = memo(WinsByHourChartComponent);
