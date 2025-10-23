import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetMiniChartProps {
  symbol: string;
  currentPrice?: number;
  priceChange24h?: number;
  sparklineData?: number[];
  className?: string;
}

export const AssetMiniChart = ({
  symbol,
  currentPrice,
  priceChange24h,
  sparklineData,
  className
}: AssetMiniChartProps) => {
  const [data, setData] = useState<number[]>(sparklineData || []);
  const isPositive = (priceChange24h || 0) > 0;
  const isNegative = (priceChange24h || 0) < 0;

  useEffect(() => {
    // Generate mock sparkline if no data provided
    if (!sparklineData) {
      const mockData = Array.from({ length: 24 }, (_, i) => {
        const base = currentPrice || 100;
        const variance = base * 0.05;
        return base + (Math.random() - 0.5) * variance;
      });
      setData(mockData);
    }
  }, [sparklineData, currentPrice]);

  const renderSparkline = () => {
    if (data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg
        viewBox="0 0 100 30"
        className="w-full h-8"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(
            "transition-colors",
            isPositive && "text-green-500",
            isNegative && "text-red-500",
            !isPositive && !isNegative && "text-muted-foreground"
          )}
        />
      </svg>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Price Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {symbol}
          </span>
          {priceChange24h !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive && "text-green-600 dark:text-green-400",
              isNegative && "text-red-600 dark:text-red-400"
            )}>
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
              <span>
                {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        {currentPrice !== undefined && (
          <span className="text-sm font-semibold">
            ${currentPrice.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </span>
        )}
      </div>

      {/* Mini Sparkline Chart */}
      <div className="w-full">
        {renderSparkline()}
      </div>
    </div>
  );
};
