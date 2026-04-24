import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface BinanceLongShortData {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string;
}

interface ChartDataPoint {
  time: string;
  index: number;
  longShortRatio: number;
  longAccount: number;
  shortAccount: number;
}

interface DragSelection {
  startIndex: number | null;
  endIndex: number | null;
  startValue: number | null;
  endValue: number | null;
}

const LongShortRatio = () => {
  const [binanceData, setBinanceData] = useState<BinanceLongShortData[]>([]);
  const [loadingBinance, setLoadingBinance] = useState(true);
  const [period, setPeriod] = useState("1h");
  const { toast } = useToast();

  // Drag selection state for ratio chart
  const [ratioDrag, setRatioDrag] = useState<DragSelection>({ startIndex: null, endIndex: null, startValue: null, endValue: null });
  const [ratioSelection, setRatioSelection] = useState<{ startIdx: number; endIdx: number; change: number } | null>(null);
  const isDraggingRatio = useRef(false);

  // Drag selection state for distribution chart
  const [distDrag, setDistDrag] = useState<DragSelection>({ startIndex: null, endIndex: null, startValue: null, endValue: null });
  const [distSelection, setDistSelection] = useState<{ startIdx: number; endIdx: number; longChange: number; shortChange: number } | null>(null);
  const isDraggingDist = useRef(false);

  const fetchBinanceData = async () => {
    setLoadingBinance(true);
    try {
      const response = await fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=${period}&limit=100`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Binance data");
      }

      const result = await response.json();
      setBinanceData(result);
    } catch (error) {
      console.error("Error fetching Binance long/short ratio:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Binance data",
        variant: "destructive",
      });
    } finally {
      setLoadingBinance(false);
    }
  };

  useEffect(() => {
    fetchBinanceData();
  }, [period]);

  const chartData: ChartDataPoint[] = useMemo(() => binanceData.map((item, index) => ({
    time: new Date(parseInt(item.timestamp)).toLocaleString(),
    index,
    longShortRatio: parseFloat(item.longShortRatio),
    longAccount: parseFloat(item.longAccount) * 100,
    shortAccount: parseFloat(item.shortAccount) * 100,
  })), [binanceData]);

  const latestData = binanceData[binanceData.length - 1];

  // --- Drag handlers for ratio chart ---
  const handleRatioMouseDown = useCallback((e: any) => {
    if (!e?.activeLabel) return;
    const idx = chartData.findIndex(d => d.time === e.activeLabel);
    if (idx < 0) return;
    isDraggingRatio.current = true;
    setRatioDrag({ startIndex: idx, endIndex: idx, startValue: chartData[idx].longShortRatio, endValue: null });
    setRatioSelection(null);
  }, [chartData]);

  const handleRatioMouseMove = useCallback((e: any) => {
    if (!isDraggingRatio.current || !e?.activeLabel) return;
    const idx = chartData.findIndex(d => d.time === e.activeLabel);
    if (idx < 0) return;
    setRatioDrag(prev => ({ ...prev, endIndex: idx, endValue: chartData[idx].longShortRatio }));
  }, [chartData]);

  const handleRatioMouseUp = useCallback(() => {
    if (!isDraggingRatio.current) return;
    isDraggingRatio.current = false;
    setRatioDrag(prev => {
      if (prev.startIndex !== null && prev.endIndex !== null && prev.startIndex !== prev.endIndex) {
        const startIdx = Math.min(prev.startIndex, prev.endIndex);
        const endIdx = Math.max(prev.startIndex, prev.endIndex);
        const startVal = chartData[startIdx].longShortRatio;
        const endVal = chartData[endIdx].longShortRatio;
        const change = startVal > 0 ? ((endVal - startVal) / startVal) * 100 : 0;
        setRatioSelection({ startIdx, endIdx, change });
      }
      return { startIndex: null, endIndex: null, startValue: null, endValue: null };
    });
  }, [chartData]);

  // --- Drag handlers for distribution chart ---
  const handleDistMouseDown = useCallback((e: any) => {
    if (!e?.activeLabel) return;
    const idx = chartData.findIndex(d => d.time === e.activeLabel);
    if (idx < 0) return;
    isDraggingDist.current = true;
    setDistDrag({ startIndex: idx, endIndex: idx, startValue: chartData[idx].longAccount, endValue: null });
    setDistSelection(null);
  }, [chartData]);

  const handleDistMouseMove = useCallback((e: any) => {
    if (!isDraggingDist.current || !e?.activeLabel) return;
    const idx = chartData.findIndex(d => d.time === e.activeLabel);
    if (idx < 0) return;
    setDistDrag(prev => ({ ...prev, endIndex: idx }));
  }, [chartData]);

  const handleDistMouseUp = useCallback(() => {
    if (!isDraggingDist.current) return;
    isDraggingDist.current = false;
    setDistDrag(prev => {
      if (prev.startIndex !== null && prev.endIndex !== null && prev.startIndex !== prev.endIndex) {
        const startIdx = Math.min(prev.startIndex, prev.endIndex);
        const endIdx = Math.max(prev.startIndex, prev.endIndex);
        const longStart = chartData[startIdx].longAccount;
        const longEnd = chartData[endIdx].longAccount;
        const shortStart = chartData[startIdx].shortAccount;
        const shortEnd = chartData[endIdx].shortAccount;
        const longChange = longStart > 0 ? ((longEnd - longStart) / longStart) * 100 : 0;
        const shortChange = shortStart > 0 ? ((shortEnd - shortStart) / shortStart) * 100 : 0;
        setDistSelection({ startIdx, endIdx, longChange, shortChange });
      }
      return { startIndex: null, endIndex: null, startValue: null, endValue: null };
    });
  }, [chartData]);

  // Get reference area bounds
  const getRatioRefArea = () => {
    if (ratioDrag.startIndex !== null && ratioDrag.endIndex !== null) {
      return { x1: chartData[Math.min(ratioDrag.startIndex, ratioDrag.endIndex)]?.time, x2: chartData[Math.max(ratioDrag.startIndex, ratioDrag.endIndex)]?.time };
    }
    if (ratioSelection) {
      return { x1: chartData[ratioSelection.startIdx]?.time, x2: chartData[ratioSelection.endIdx]?.time };
    }
    return null;
  };

  const getDistRefArea = () => {
    if (distDrag.startIndex !== null && distDrag.endIndex !== null) {
      return { x1: chartData[Math.min(distDrag.startIndex, distDrag.endIndex)]?.time, x2: chartData[Math.max(distDrag.startIndex, distDrag.endIndex)]?.time };
    }
    if (distSelection) {
      return { x1: chartData[distSelection.startIdx]?.time, x2: chartData[distSelection.endIdx]?.time };
    }
    return null;
  };

  const ratioRef = getRatioRefArea();
  const distRef = getDistRefArea();

  return (
    <>
      <SEO
        title={pageMeta.longShortRatio.title}
        description={pageMeta.longShortRatio.description}
        keywords={pageMeta.longShortRatio.keywords}
        canonical={pageMeta.longShortRatio.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <PremiumCard title="Symbol" className="flex-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            BTC/USDT
          </div>
        </PremiumCard>

        <PremiumCard title="Time Period" className="flex-1">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 Minutes</SelectItem>
              <SelectItem value="15m">15 Minutes</SelectItem>
              <SelectItem value="30m">30 Minutes</SelectItem>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="2h">2 Hours</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="12h">12 Hours</SelectItem>
              <SelectItem value="1d">1 Day</SelectItem>
            </SelectContent>
          </Select>
        </PremiumCard>
      </div>

      {loadingBinance ? (
        <PremiumCard>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </PremiumCard>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PremiumCard title="Long/Short Ratio" subtitle="Current ratio">
              <p className="text-3xl font-bold">
                {latestData ? parseFloat(latestData.longShortRatio).toFixed(4) : "N/A"}
              </p>
            </PremiumCard>

            <PremiumCard title="Long Accounts" subtitle="Percentage of long positions">
              <p className="text-3xl font-bold text-neon-green">
                {latestData ? (parseFloat(latestData.longAccount) * 100).toFixed(2) : "N/A"}%
              </p>
            </PremiumCard>

            <PremiumCard title="Short Accounts" subtitle="Percentage of short positions">
              <p className="text-3xl font-bold text-neon-red">
                {latestData ? (parseFloat(latestData.shortAccount) * 100).toFixed(2) : "N/A"}%
              </p>
            </PremiumCard>
          </div>

          {/* L/S Ratio History Chart with drag-select */}
          <PremiumCard 
            title="Long/Short Ratio History" 
            subtitle="Click and drag to measure % change between two points"
          >
            {ratioSelection && (
              <div className="mb-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-card/80 border border-border/50">
                <span className="text-xs text-muted-foreground">Selected range:</span>
                <span className={`text-sm font-bold ${ratioSelection.change >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {ratioSelection.change >= 0 ? '+' : ''}{ratioSelection.change.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({chartData[ratioSelection.startIdx]?.longShortRatio.toFixed(4)} → {chartData[ratioSelection.endIdx]?.longShortRatio.toFixed(4)})
                </span>
                <button 
                  onClick={() => setRatioSelection(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={chartData}
                onMouseDown={handleRatioMouseDown}
                onMouseMove={handleRatioMouseMove}
                onMouseUp={handleRatioMouseUp}
                onMouseLeave={handleRatioMouseUp}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Legend />
                {ratioRef && (
                  <ReferenceArea
                    x1={ratioRef.x1}
                    x2={ratioRef.x2}
                    strokeOpacity={0.3}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    stroke="hsl(var(--primary))"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="longShortRatio"
                  stroke="hsl(var(--neon-blue))"
                  name="Long/Short Ratio"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </PremiumCard>

          {/* Account Distribution Chart with drag-select */}
          <PremiumCard 
            title="Account Distribution" 
            subtitle="Click and drag to measure % change between two points"
          >
            {distSelection && (
              <div className="mb-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-card/80 border border-border/50 flex-wrap">
                <span className="text-xs text-muted-foreground">Selected range:</span>
                <span className="text-sm font-bold text-neon-green">
                  Long: {distSelection.longChange >= 0 ? '+' : ''}{distSelection.longChange.toFixed(2)}%
                </span>
                <span className="text-sm font-bold text-neon-red">
                  Short: {distSelection.shortChange >= 0 ? '+' : ''}{distSelection.shortChange.toFixed(2)}%
                </span>
                <button 
                  onClick={() => setDistSelection(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={chartData}
                onMouseDown={handleDistMouseDown}
                onMouseMove={handleDistMouseMove}
                onMouseUp={handleDistMouseUp}
                onMouseLeave={handleDistMouseUp}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  domain={[0, 100]}
                  stroke="hsl(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Legend />
                {distRef && (
                  <ReferenceArea
                    x1={distRef.x1}
                    x2={distRef.x2}
                    strokeOpacity={0.3}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    stroke="hsl(var(--primary))"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="longAccount"
                  stroke="hsl(var(--neon-green))"
                  name="Long Accounts %"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="shortAccount"
                  stroke="hsl(var(--neon-red))"
                  name="Short Accounts %"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </PremiumCard>
        </>
      )}
    </div>
    </AppLayout>
    </>
  );
};

export default LongShortRatio;
