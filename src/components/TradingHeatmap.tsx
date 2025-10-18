import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Trade {
  trade_date: string;
  pnl: number;
  roi: number;
}

interface TradingHeatmapProps {
  trades: Trade[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TradingHeatmap({ trades }: TradingHeatmapProps) {
  const heatmapData = useMemo(() => {
    const data: Record<string, { wins: number; total: number; pnl: number; roi: number }> = {};

    trades.forEach((trade) => {
      const date = new Date(trade.trade_date);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;

      if (!data[key]) {
        data[key] = { wins: 0, total: 0, pnl: 0, roi: 0 };
      }

      data[key].total += 1;
      data[key].pnl += trade.pnl || 0;
      data[key].roi += trade.roi || 0;
      if ((trade.pnl || 0) > 0) {
        data[key].wins += 1;
      }
    });

    return data;
  }, [trades]);

  const getCellColor = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const cell = heatmapData[key];

    if (!cell) return 'hsl(var(--muted))';

    const winRate = cell.wins / cell.total;

    if (winRate >= 0.7) return 'hsl(var(--neon-green))';
    if (winRate >= 0.5) return 'hsl(142 71% 35%)';
    if (winRate >= 0.4) return 'hsl(45 93% 47%)';
    return 'hsl(var(--neon-red))';
  };

  const getBestSlot = () => {
    let best = { key: '', winRate: 0, trades: 0 };

    Object.entries(heatmapData).forEach(([key, data]) => {
      const winRate = data.wins / data.total;
      if (data.total >= 3 && winRate > best.winRate) {
        best = { key, winRate, trades: data.total };
      }
    });

    return best;
  };

  const bestSlot = getBestSlot();

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Trading Success Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your performance by day and time. Hover for details.
        </p>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Hour labels */}
              <div className="flex mb-2">
                <div className="w-12"></div>
                {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                  <div
                    key={hour}
                    className="text-xs text-muted-foreground text-center"
                    style={{ width: '36px', marginRight: '2px' }}
                  >
                    {hour}h
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-12 text-xs text-muted-foreground font-medium">
                    {day}
                  </div>
                  <div className="flex gap-0.5">
                    {HOURS.map((hour) => {
                      const key = `${dayIndex}-${hour}`;
                      const cell = heatmapData[key];
                      const isBest = key === bestSlot.key;

                      return (
                        <Tooltip key={hour} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-8 rounded-sm transition-all hover:scale-125 cursor-pointer ${
                                isBest ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                              }`}
                              style={{
                                backgroundColor: getCellColor(dayIndex, hour),
                                opacity: cell ? 0.9 : 0.2,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover border-border">
                            {cell ? (
                              <div className="text-xs space-y-1">
                                <div className="font-semibold">
                                  {day} {hour}:00-{hour + 1}:00
                                </div>
                                <div>Win Rate: {((cell.wins / cell.total) * 100).toFixed(1)}%</div>
                                <div>Trades: {cell.total}</div>
                                <div>Avg ROI: {(cell.roi / cell.total).toFixed(2)}%</div>
                                <div>Total P&L: ${cell.pnl.toFixed(2)}</div>
                                {isBest && (
                                  <div className="text-accent font-semibold mt-1">⭐ Best Slot</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs">No trades</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--neon-green))' }}></div>
                  <span className="text-muted-foreground">High Win Rate (70%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45 93% 47%)' }}></div>
                  <span className="text-muted-foreground">Neutral (40-50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--neon-red))' }}></div>
                  <span className="text-muted-foreground">Low Win Rate (&lt;40%)</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
