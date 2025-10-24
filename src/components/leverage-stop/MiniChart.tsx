import { useEffect, useRef, useState } from 'react';
import { Side } from '@/utils/leverageCalculations';

interface MiniChartProps {
  entry: number;
  stop: number;
  liquidation: number;
  side: Side;
  onStopChange: (newStop: number) => void;
}

export function MiniChart({ entry, stop, liquidation, side, onStopChange }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getPositionPercent = (price: number) => {
    const prices = [entry, stop, liquidation].sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const range = max - min;
    
    if (range === 0) return 50;
    
    return ((price - min) / range) * 100;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    
    const prices = [entry, stop, liquidation].sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const range = max - min;
    
    const newStop = min + (percent / 100) * range;
    const rounded = Math.round(newStop * 10) / 10; // Snap to 0.1 increments
    
    // Validate stop is on correct side
    if (side === "long" && rounded < entry) {
      onStopChange(rounded);
    } else if (side === "short" && rounded > entry) {
      onStopChange(rounded);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, entry, side]);

  const entryPos = getPositionPercent(entry);
  const stopPos = getPositionPercent(stop);
  const liqPos = getPositionPercent(liquidation);

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        className="relative h-20 bg-card border border-border rounded-lg overflow-hidden cursor-crosshair"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 via-warning/10 to-success/10" />
        
        {/* Entry marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
          style={{ left: `${entryPos}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap">
            Entry: ${entry.toLocaleString()}
          </div>
        </div>

        {/* Stop marker (draggable) */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-warning z-20 cursor-grab active:cursor-grabbing"
          style={{ left: `${stopPos}%` }}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-warning text-warning-foreground text-xs rounded whitespace-nowrap">
            Stop: ${stop.toLocaleString()}
          </div>
        </div>

        {/* Liquidation marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
          style={{ left: `${liqPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded whitespace-nowrap">
            Liq: ${liquidation.toLocaleString()}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Drag the yellow stop marker to adjust your stop loss
      </p>
    </div>
  );
}
