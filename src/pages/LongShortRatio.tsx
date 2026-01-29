import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import bullNeon from "@/assets/bull-neon.png";
import bearNeon from "@/assets/bear-neon.png";
import bullBearFight from "@/assets/bull-bear-fight-neon.png";

interface BinanceLongShortData {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string;
}

interface BybitLongShortData {
  symbol: string;
  buyRatio: string;
  sellRatio: string;
  timestamp: string;
}

const LongShortRatio = () => {
  const [binanceData, setBinanceData] = useState<BinanceLongShortData[]>([]);
  const [bybitData, setBybitData] = useState<BybitLongShortData[]>([]);
  const [loadingBinance, setLoadingBinance] = useState(true);
  const [loadingBybit, setLoadingBybit] = useState(true);
  const [period, setPeriod] = useState("1h");
  const [bybitPeriod, setBybitPeriod] = useState("1h");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const { toast } = useToast();

  const fetchBinanceData = async () => {
    setLoadingBinance(true);
    try {
      const response = await fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=100`
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

  const fetchBybitData = async () => {
    setLoadingBybit(true);
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=${bybitPeriod}&limit=100`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Bybit data");
      }

      const result = await response.json();
      if (result.retCode === 0 && result.result?.list) {
        setBybitData(result.result.list.reverse());
      } else {
        throw new Error(result.retMsg || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching Bybit long/short ratio:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Bybit data",
        variant: "destructive",
      });
      setBybitData([]);
    } finally {
      setLoadingBybit(false);
    }
  };

  useEffect(() => {
    fetchBinanceData();
  }, [period, symbol]);

  useEffect(() => {
    fetchBybitData();
  }, [bybitPeriod, symbol]);

  const binanceChartData = binanceData.map((item) => ({
    time: new Date(parseInt(item.timestamp)).toLocaleString(),
    longShortRatio: parseFloat(item.longShortRatio),
    longAccount: parseFloat(item.longAccount) * 100,
    shortAccount: parseFloat(item.shortAccount) * 100,
  }));

  const bybitChartData = bybitData.map((item) => {
    const buyRatio = parseFloat(item.buyRatio) * 100;
    const sellRatio = parseFloat(item.sellRatio) * 100;
    const longShortRatio = parseFloat(item.buyRatio) / parseFloat(item.sellRatio);

    return {
      time: new Date(parseInt(item.timestamp)).toLocaleString(),
      timestamp: parseInt(item.timestamp),
      longShortRatio: longShortRatio,
      longAccount: buyRatio,
      shortAccount: sellRatio,
    };
  });

  // Calculate combined average data
  const combinedChartData = binanceChartData.map((binanceItem, index) => {
    const bybitItem = bybitChartData.find(b =>
      Math.abs(b.timestamp - parseInt(binanceData[index]?.timestamp || "0")) < 3600000 // Within 1 hour
    );

    if (bybitItem) {
      return {
        time: binanceItem.time,
        longShortRatio: (binanceItem.longShortRatio + bybitItem.longShortRatio) / 2,
        longAccount: (binanceItem.longAccount + bybitItem.longAccount) / 2,
        shortAccount: (binanceItem.shortAccount + bybitItem.shortAccount) / 2,
      };
    }
    return null;
  }).filter(item => item !== null);

  const latestBinanceData = binanceData[binanceData.length - 1];
  const latestBybitData = bybitData[bybitData.length - 1];
  const latestCombinedData = combinedChartData[combinedChartData.length - 1];

  function CombinedContent() {
    const isLoading = loadingBinance || loadingBybit;

    return (
      <>
        {/* Compact controls + KPIs in one row */}
        <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-4">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Symbol:</span>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="h-8 w-[120px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border/50 hidden sm:block" />

          {/* Period */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Period:</span>
            <Select value={period} onValueChange={(value) => {
              setPeriod(value);
              setBybitPeriod(value === "1h" ? "1h" : value === "4h" ? "4h" : value === "1d" ? "1d" : "1h");
            }}>
              <SelectTrigger className="h-8 w-[100px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border/50 hidden md:block" />

          {/* KPI Chips */}
          {!isLoading && latestCombinedData && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
                <span className="text-xs text-muted-foreground">L/S Ratio:</span>
                <span className="text-sm font-bold">{latestCombinedData.longShortRatio.toFixed(4)}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
                <span className="text-xs text-muted-foreground">Long:</span>
                <span className="text-sm font-bold text-profit">{latestCombinedData.longAccount.toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
                <span className="text-xs text-muted-foreground">Short:</span>
                <span className="text-sm font-bold text-loss">{latestCombinedData.shortAccount.toFixed(2)}%</span>
              </div>
            </>
          )}
        </div>

        {isLoading ? (
          <PremiumCard className="glass">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </PremiumCard>
        ) : combinedChartData.length === 0 ? (
          <PremiumCard className="glass">
            <div className="pt-6">
              <p className="text-center text-muted-foreground text-sm">
                No combined data available. Please ensure both data sources are loaded.
              </p>
            </div>
          </PremiumCard>
        ) : (
          <>
            <PremiumCard title="Combined Long/Short Ratio History" subtitle="Average of Binance and Bybit data" className="glass">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="longShortRatio"
                    stroke="hsl(var(--neon-blue))"
                    name="Avg Long/Short Ratio"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard title="Combined Account Distribution" subtitle="Average percentage of long vs short accounts" className="glass">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="longAccount"
                    stroke="hsl(var(--neon-green))"
                    name="Avg Long Accounts %"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="shortAccount"
                    stroke="hsl(var(--neon-red))"
                    name="Avg Short Accounts %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>
          </>
        )}
      </>
    );
  }

  function BinanceContent() {
    return (
      <>
        <div className="flex gap-4">
          <PremiumCard title="Symbol" className="flex-1">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumCard title="Long/Short Ratio" subtitle="Current ratio">
                <p className="text-3xl font-bold">
                  {latestBinanceData ? parseFloat(latestBinanceData.longShortRatio).toFixed(4) : "N/A"}
                </p>
              </PremiumCard>

              <PremiumCard title="Long Accounts" subtitle="Percentage of long positions">
                <p className="text-3xl font-bold text-neon-green">
                  {latestBinanceData ? (parseFloat(latestBinanceData.longAccount) * 100).toFixed(2) : "N/A"}%
                </p>
              </PremiumCard>

              <PremiumCard title="Short Accounts" subtitle="Percentage of short positions">
                <p className="text-3xl font-bold text-neon-red">
                  {latestBinanceData ? (parseFloat(latestBinanceData.shortAccount) * 100).toFixed(2) : "N/A"}%
                </p>
              </PremiumCard>
            </div>

            <PremiumCard title="Long/Short Ratio History" subtitle="Historical trend of long/short account ratio">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={binanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Line
                    type="monotone"
                    dataKey="longShortRatio"
                    stroke="hsl(var(--neon-blue))"
                    name="Long/Short Ratio"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard title="Account Distribution" subtitle="Percentage of long vs short accounts over time">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={binanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Line
                    type="monotone"
                    dataKey="longAccount"
                    stroke="hsl(var(--neon-green))"
                    name="Long Accounts %"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="shortAccount"
                    stroke="hsl(var(--neon-red))"
                    name="Short Accounts %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>
          </>
        )}
      </>
    );
  }

  function BybitContent() {
    return (
      <>
        <div className="flex gap-4">
          <PremiumCard title="Symbol" className="flex-1">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
              </SelectContent>
            </Select>
          </PremiumCard>

          <PremiumCard title="Time Period" className="flex-1">
            <Select value={bybitPeriod} onValueChange={setBybitPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5min">5 Minutes</SelectItem>
                <SelectItem value="15min">15 Minutes</SelectItem>
                <SelectItem value="30min">30 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </PremiumCard>
        </div>

        {loadingBybit ? (
          <PremiumCard>
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-[400px] w-full" />
          </PremiumCard>
        ) : bybitData.length === 0 ? (
          <PremiumCard>
            <div className="pt-6">
              <p className="text-center text-muted-foreground">
                No data available. Please try different parameters.
              </p>
            </div>
          </PremiumCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumCard title="Long/Short Ratio" subtitle="Current ratio">
                <p className="text-3xl font-bold">
                  {latestBybitData ? (parseFloat(latestBybitData.buyRatio) / parseFloat(latestBybitData.sellRatio)).toFixed(4) : "N/A"}
                </p>
              </PremiumCard>

              <PremiumCard title="Long Accounts" subtitle="Percentage of long positions">
                <p className="text-3xl font-bold text-neon-green">
                  {latestBybitData ? (parseFloat(latestBybitData.buyRatio) * 100).toFixed(2) : "N/A"}%
                </p>
              </PremiumCard>

              <PremiumCard title="Short Accounts" subtitle="Percentage of short positions">
                <p className="text-3xl font-bold text-neon-red">
                  {latestBybitData ? (parseFloat(latestBybitData.sellRatio) * 100).toFixed(2) : "N/A"}%
                </p>
              </PremiumCard>
            </div>

            <PremiumCard title="Long/Short Ratio History" subtitle="Historical trend of long/short account ratio from Bybit">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={bybitChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Line
                    type="monotone"
                    dataKey="longShortRatio"
                    stroke="hsl(var(--neon-blue))"
                    name="Long/Short Ratio"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard title="Account Distribution" subtitle="Percentage of long vs short accounts over time">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={bybitChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/5" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Line
                    type="monotone"
                    dataKey="longAccount"
                    stroke="hsl(var(--neon-green))"
                    name="Long Accounts %"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="shortAccount"
                    stroke="hsl(var(--neon-red))"
                    name="Short Accounts %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PremiumCard>
          </>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="combined" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass bg-primary/5 max-w-full">
          <TabsTrigger value="combined">Combined LSR</TabsTrigger>
          <TabsTrigger value="binance">Binance LSR</TabsTrigger>
          <TabsTrigger value="bybit">Bybit LSR</TabsTrigger>
        </TabsList>

        <TabsContent value="combined" className="space-y-6 mt-6">
          <CombinedContent />
        </TabsContent>
        <TabsContent value="binance" className="space-y-6 mt-6">
          <BinanceContent />
        </TabsContent>
        <TabsContent value="bybit" className="space-y-6 mt-6">
          <BybitContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LongShortRatio;
