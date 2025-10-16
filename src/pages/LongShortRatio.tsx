import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface BinanceLongShortData {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string;
}

interface CoinglassLongShortData {
  time: number;
  global_account_long_percent: number;
  global_account_short_percent: number;
  global_account_long_short_ratio: number;
}

const LongShortRatio = () => {
  const [binanceData, setBinanceData] = useState<BinanceLongShortData[]>([]);
  const [coinglassData, setCoinglassData] = useState<CoinglassLongShortData[]>([]);
  const [loadingBinance, setLoadingBinance] = useState(true);
  const [loadingCoinglass, setLoadingCoinglass] = useState(true);
  const [period, setPeriod] = useState("1h");
  const [coinglassInterval, setCoinglassInterval] = useState("1h");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [coinglassExchange, setCoinglassExchange] = useState("Binance");
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

  const fetchCoinglassData = async () => {
    setLoadingCoinglass(true);
    try {
      const response = await fetch(
        `https://open-api-v4.coinglass.com/api/futures/global-long-short-account-ratio/history?exchange=${coinglassExchange}&symbol=${symbol}&interval=${coinglassInterval}&limit=100`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch Coinglass data");
      }
      
      const result = await response.json();
      if (result.code === "0" && result.data) {
        setCoinglassData(result.data);
      } else {
        throw new Error(result.msg || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching Coinglass long/short ratio:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Coinglass data. API may require authentication.",
        variant: "destructive",
      });
      setCoinglassData([]);
    } finally {
      setLoadingCoinglass(false);
    }
  };

  useEffect(() => {
    fetchBinanceData();
  }, [period, symbol]);

  useEffect(() => {
    fetchCoinglassData();
  }, [coinglassInterval, symbol, coinglassExchange]);

  const binanceChartData = binanceData.map((item) => ({
    time: new Date(parseInt(item.timestamp)).toLocaleString(),
    longShortRatio: parseFloat(item.longShortRatio),
    longAccount: parseFloat(item.longAccount) * 100,
    shortAccount: parseFloat(item.shortAccount) * 100,
  }));

  const coinglassChartData = coinglassData.map((item) => ({
    time: new Date(item.time).toLocaleString(),
    longShortRatio: item.global_account_long_short_ratio,
    longAccount: item.global_account_long_percent,
    shortAccount: item.global_account_short_percent,
  }));

  const latestBinanceData = binanceData[binanceData.length - 1];
  const latestCoinglassData = coinglassData[coinglassData.length - 1];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Long/Short Ratio</h1>
          <p className="text-muted-foreground mt-2">
            Monitor the long/short account ratio from multiple data sources
          </p>
        </div>

        <Tabs defaultValue="binance" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="binance">Binance LSR</TabsTrigger>
            <TabsTrigger value="coinglass">Coinglass LSR</TabsTrigger>
          </TabsList>

          <TabsContent value="binance" className="space-y-6 mt-6">
            <BinanceContent />
          </TabsContent>
          <TabsContent value="coinglass" className="space-y-6 mt-6">
            <CoinglassContent />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );

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

  function CoinglassContent() {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={coinglassExchange} onValueChange={setCoinglassExchange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Binance">Binance</SelectItem>
                  <SelectItem value="OKX">OKX</SelectItem>
                  <SelectItem value="Bybit">Bybit</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Interval</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={coinglassInterval} onValueChange={setCoinglassInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="8h">8 Hours</SelectItem>
                  <SelectItem value="12h">12 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {loadingCoinglass ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        ) : coinglassData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No data available. The Coinglass API may require authentication or the selected parameters may not have data.
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
                    {latestCoinglassData ? latestCoinglassData.global_account_long_short_ratio.toFixed(4) : "N/A"}
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
                    {latestCoinglassData ? latestCoinglassData.global_account_long_percent.toFixed(2) : "N/A"}%
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
                    {latestCoinglassData ? latestCoinglassData.global_account_short_percent.toFixed(2) : "N/A"}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Long/Short Ratio History</CardTitle>
                <CardDescription>Historical trend of long/short account ratio from Coinglass</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={coinglassChartData}>
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
                  <LineChart data={coinglassChartData}>
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
