import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/types/trade";

interface TradeReplayProps {
  trade: Trade;
}

export const TradeReplay = ({ trade }: TradeReplayProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Replay</h3>
          <Badge>{trade.symbol_temp}</Badge>
        </div>

        {/* Chart visualization would go here */}
        <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Chart Visualization Area</p>
        </div>

        {/* Trade Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Entry</p>
            <p className="font-semibold">${trade.entry_price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Exit</p>
            <p className="font-semibold">${trade.exit_price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">P&L</p>
            <p className={`font-semibold ${(trade.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${trade.profit_loss?.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-semibold">
              {trade.duration_days}d {trade.duration_hours}h {trade.duration_minutes}m
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Slider
          value={[progress]}
          onValueChange={handleProgressChange}
          max={100}
          step={1}
          className="w-full"
        />

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setProgress(0)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => setProgress(100)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSpeed(speed === 2 ? 0.5 : speed + 0.5)}
            >
              {speed}x
            </Button>
            <Button size="icon" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Annotations */}
        {trade.notes && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">Notes</p>
            <p className="text-sm text-muted-foreground">{trade.notes}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
