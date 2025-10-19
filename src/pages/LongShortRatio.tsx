import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
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

  // Helper function to determine market sentiment image
  const getMarketSentimentImage = (longPercent: number, shortPercent: number) => {
    const diff = Math.abs(longPercent - shortPercent);
    
    if (diff < 2) {
      // Approximately equal (within 2%) - show fighting image
      return bullBearFight;
    } else if (longPercent > shortPercent) {
      // More longs - show bull
      return bullNeon;
    } else {
      // More shorts - show bear
      return bearNeon;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Long/Short Ratio</h1>
          <p className="text-muted-foreground mt-1">
            Monitor the long/short account ratio from multiple data sources
          </p>
        </div>

        <Tabs defaultValue="combined" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3 glass">
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
    </AppLayout>
  );

  function CombinedContent() {
    const isLoading = loadingBinance || loadingBybit;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Symbol</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                  <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                  <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Time Period</CardTitle>
              <CardDescription className="text-xs">Synced across both sources</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={period} onValueChange={(value) => {
                setPeriod(value);
                setBybitPeriod(value === "1h" ? "1h" : value === "4h" ? "4h" : value === "1d" ? "1d" : "1h");
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card className="glass">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : combinedChartData.length === 0 ? (
          <Card className="glass">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground text-sm">
                No combined data available. Please ensure both data sources are loaded.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Avg Long/Short Ratio</CardTitle>
                  <CardDescription className="text-xs">Combined average</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {latestCombinedData ? latestCombinedData.longShortRatio.toFixed(4) : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Avg Long Accounts</CardTitle>
                  <CardDescription className="text-xs">Combined percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-neon-green">
                    {latestCombinedData ? latestCombinedData.longAccount.toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Avg Short Accounts</CardTitle>
                  <CardDescription className="text-xs">Combined percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-neon-red">
                    {latestCombinedData ? latestCombinedData.shortAccount.toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Combined Long/Short Ratio History</CardTitle>
                <CardDescription className="text-xs">Average of Binance and Bybit data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                      stroke="hsl(var(--primary))" 
                      name="Avg Long/Short Ratio"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Combined Account Distribution</CardTitle>
                <CardDescription className="text-xs">Average percentage of long vs short accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
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
                      stroke="#10b981" 
                      name="Avg Long Accounts %"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shortAccount" 
                      stroke="#ef4444" 
                      name="Avg Short Accounts %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  }

  function BinanceContent() {
    return (
      <>
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Symbol</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Time Period</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {loadingBinance ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long/Short Ratio</CardTitle>
                  <CardDescription>Current ratio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {latestBinanceData ? parseFloat(latestBinanceData.longShortRatio).toFixed(4) : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long Accounts</CardTitle>
                  <CardDescription>Percentage of long positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-neon-green">
                    {latestBinanceData ? (parseFloat(latestBinanceData.longAccount) * 100).toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Short Accounts</CardTitle>
                  <CardDescription>Percentage of short positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-neon-red">
                    {latestBinanceData ? (parseFloat(latestBinanceData.shortAccount) * 100).toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Long/Short Ratio History</CardTitle>
                <CardDescription>Historical trend of long/short account ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={binanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="longShortRatio" 
                      stroke="hsl(var(--primary))" 
                      name="Long/Short Ratio"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Distribution</CardTitle>
                <CardDescription>Percentage of long vs short accounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={binanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="longAccount" 
                      stroke="#10b981" 
                      name="Long Accounts %"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shortAccount" 
                      stroke="#ef4444" 
                      name="Short Accounts %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  }

  function BybitContent() {
    return (
      <>
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Symbol</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Time Period</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {loadingBybit ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        ) : bybitData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No data available. Please try different parameters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long/Short Ratio</CardTitle>
                  <CardDescription>Current ratio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {latestBybitData ? (parseFloat(latestBybitData.buyRatio) / parseFloat(latestBybitData.sellRatio)).toFixed(4) : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long Accounts</CardTitle>
                  <CardDescription>Percentage of long positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-neon-green">
                    {latestBybitData ? (parseFloat(latestBybitData.buyRatio) * 100).toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Short Accounts</CardTitle>
                  <CardDescription>Percentage of short positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-neon-red">
                    {latestBybitData ? (parseFloat(latestBybitData.sellRatio) * 100).toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Long/Short Ratio History</CardTitle>
                <CardDescription>Historical trend of long/short account ratio from Bybit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={bybitChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="longShortRatio" 
                      stroke="hsl(var(--primary))" 
                      name="Long/Short Ratio"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Distribution</CardTitle>
                <CardDescription>Percentage of long vs short accounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={bybitChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="longAccount" 
                      stroke="#10b981" 
                      name="Long Accounts %"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shortAccount" 
                      stroke="#ef4444" 
                      name="Short Accounts %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  }
};

export default LongShortRatio;
