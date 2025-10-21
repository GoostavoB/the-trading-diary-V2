import { memo, useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Star } from 'lucide-react';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ExplainMetricButton } from '@/components/ExplainMetricButton';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

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

const TradingHeatmapComponent = ({ trades }: TradingHeatmapProps) => {
  const { colors, isClassic } = useThemeMode();
  const { openWithPrompt } = useAIAssistant();
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
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

    // Use theme colors from useThemeMode
    if (winRate >= 0.7) return colors.positive;
    if (winRate >= 0.5) return 'hsl(var(--primary) / 0.7)';
    if (winRate >= 0.4) return 'hsl(var(--secondary) / 0.6)';
    return colors.negative;
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
  const bestSlotInfo = bestSlot.key ? `Best slot: ${DAYS[parseInt(bestSlot.key.split('-')[0])]} ${bestSlot.key.split('-')[1]}:00 (${(bestSlot.winRate * 100).toFixed(0)}% win rate)` : '';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          <p className="text-[10px] text-muted-foreground">
            Click cells to view details • Color indicates win rate
          </p>
        </div>
        <ExplainMetricButton
          metricName="Trading Heatmap"
          metricValue={`${trades.length} trades`}
          context={bestSlotInfo}
          onExplain={openWithPrompt}
          className="flex-shrink-0"
        />
      </div>
      
      <TooltipProvider>
        <div className="relative w-full">
          {/* Responsive Grid Container */}
          <div className="flex gap-1.5 w-full overflow-x-auto">
            {/* Day labels */}
            <div className="flex flex-col justify-around py-0.5 flex-shrink-0">
              {DAYS.map((day) => (
                <div key={day} className="text-[9px] text-muted-foreground font-medium w-7 text-right pr-1.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex-1 min-w-0">
              {/* Hour labels */}
              <div className="flex gap-[2px] mb-1 ml-[2px]">
                {HOURS.filter((h) => h % 4 === 0).map((hour) => (
                  <div
                    key={hour}
                    className="text-[8px] text-muted-foreground text-center flex-1"
                  >
                    {hour}h
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div className="space-y-[2px]">
                {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex gap-[2px]">
                    {HOURS.map((hour) => {
                      const key = `${dayIndex}-${hour}`;
                      const cell = heatmapData[key];
                      const isBest = key === bestSlot.key;
                      const isSelected = selectedCell === key;

                      return (
                        <Tooltip key={hour} delayDuration={100}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedCell(isSelected ? null : key)}
                              className={`
                                flex-1 aspect-square rounded-sm transition-all duration-200
                                hover:scale-110 hover:shadow-lg hover:z-10 min-h-[14px]
                                ${isSelected ? 'scale-110 shadow-xl ring-2 ring-accent z-10' : ''}
                                ${isBest && !isSelected ? 'ring-1 ring-accent/50' : ''}
                              `}
                              style={{
                                backgroundColor: getCellColor(dayIndex, hour),
                                opacity: cell ? (isSelected ? 1 : 0.9) : 0.2,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent 
                            className="glass-strong border-accent/20 shadow-xl"
                            side="top"
                          >
                            {cell ? (
                              <div className="text-xs space-y-1 min-w-[150px]">
                                <div className="font-semibold text-foreground border-b border-border/50 pb-1.5 mb-1.5">
                                  {day} at {hour}:00
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Win Rate:</span>
                                  <span className="font-semibold" style={{ color: getCellColor(dayIndex, hour) }}>
                                    {((cell.wins / cell.total) * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Trades:</span>
                                  <span className="font-medium">{cell.total}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg ROI:</span>
                                  <span className="font-medium">{(cell.roi / cell.total).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total P&L:</span>
                                  <span className={`font-semibold ${cell.pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                                    ${cell.pnl.toFixed(2)}
                                  </span>
                                </div>
                                {isBest && (
                                  <div className="text-accent font-semibold pt-1.5 border-t border-border/50 mt-1.5 text-center flex items-center justify-center gap-1">
                                    <Star className="h-3 w-3 fill-accent" />
                                    Best Time Slot
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">No trades in this time slot</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.positive }}></div>
              <span className="text-[10px] text-muted-foreground font-medium">High (≥70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.7)' }}></div>
              <span className="text-[10px] text-muted-foreground font-medium">Medium (40-70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.negative }}></div>
              <span className="text-[10px] text-muted-foreground font-medium">Low (&lt;40%)</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export const TradingHeatmap = memo(TradingHeatmapComponent);
