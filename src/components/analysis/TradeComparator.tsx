import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { GitCompare, TrendingUp, TrendingDown, Clock, Target, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";

export function TradeComparator() {
  const { user } = useAuth();
  const [selectedTrade1, setSelectedTrade1] = useState<string>("");
  const [selectedTrade2, setSelectedTrade2] = useState<string>("");

  const { data: trades } = useQuery({
    queryKey: ['trades-for-comparison', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const trade1 = trades?.find(t => t.id === selectedTrade1);
  const trade2 = trades?.find(t => t.id === selectedTrade2);

  const getComparisonColor = (val1: number, val2: number, higherIsBetter: boolean = true) => {
    if (val1 === val2) return "text-gray-600";
    const isVal1Better = higherIsBetter ? val1 > val2 : val1 < val2;
    return isVal1Better ? "text-green-600" : "text-red-600";
  };

  const ComparisonMetric = ({ 
    label, 
    value1, 
    value2, 
    icon: Icon, 
    format: formatValue = (v: any) => v,
    higherIsBetter = true 
  }: any) => (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className={`text-2xl font-bold ${trade1 && trade2 ? getComparisonColor(value1, value2, higherIsBetter) : ''}`}>
            {formatValue(value1)}
          </div>
          <div className="text-xs text-muted-foreground">Trade 1</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${trade1 && trade2 ? getComparisonColor(value2, value1, higherIsBetter) : ''}`}>
            {formatValue(value2)}
          </div>
          <div className="text-xs text-muted-foreground">Trade 2</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <GitCompare className="h-6 w-6" />
          Trade Comparator
        </h2>
        <p className="text-sm text-muted-foreground">
          Compare two trades side-by-side to identify patterns and improve decision-making
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Trade 1</label>
          <Select value={selectedTrade1} onValueChange={setSelectedTrade1}>
            <SelectTrigger>
              <SelectValue placeholder="Select first trade" />
            </SelectTrigger>
            <SelectContent>
              {trades?.map((trade) => (
                <SelectItem key={trade.id} value={trade.id}>
                  {trade.symbol} - {format(new Date(trade.opened_at || trade.trade_date), 'MMM dd, yyyy')} - {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Trade 2</label>
          <Select value={selectedTrade2} onValueChange={setSelectedTrade2}>
            <SelectTrigger>
              <SelectValue placeholder="Select second trade" />
            </SelectTrigger>
            <SelectContent>
              {trades?.map((trade) => (
                <SelectItem key={trade.id} value={trade.id}>
                  {trade.symbol} - {format(new Date(trade.opened_at || trade.trade_date), 'MMM dd, yyyy')} - {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!trade1 || !trade2 ? (
        <div className="text-center py-16">
          <GitCompare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Select Two Trades to Compare</h3>
          <p className="text-sm text-muted-foreground">
            Choose trades from the dropdowns above to see detailed comparison
          </p>
        </div>
      ) : (
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComparisonMetric
                label="Profit/Loss"
                value1={trade1.pnl}
                value2={trade2.pnl}
                icon={DollarSign}
                format={(v: number) => `${v >= 0 ? '+' : ''}$${v.toFixed(2)}`}
              />
              <ComparisonMetric
                label="ROI"
                value1={trade1.roi || 0}
                value2={trade2.roi || 0}
                icon={TrendingUp}
                format={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
              />
              <ComparisonMetric
                label="Duration"
                value1={trade1.duration_minutes || 0}
                value2={trade2.duration_minutes || 0}
                icon={Clock}
                format={(v: number) => `${Math.floor(v / 60)}h ${v % 60}m`}
                higherIsBetter={false}
              />
            </div>

            <Card className="p-4 bg-accent">
              <h4 className="font-semibold mb-3">Quick Comparison</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-2">Trade 1 Summary</div>
                  <div className="space-y-1">
                    <div className={trade1.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Result: {trade1.pnl >= 0 ? 'Win' : 'Loss'} ({trade1.pnl >= 0 ? '+' : ''}{trade1.pnl.toFixed(2)})
                    </div>
                    <div>Setup: {trade1.setup || 'N/A'}</div>
                    <div>Side: <Badge variant="outline">{trade1.side}</Badge></div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Trade 2 Summary</div>
                  <div className="space-y-1">
                    <div className={trade2.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Result: {trade2.pnl >= 0 ? 'Win' : 'Loss'} ({trade2.pnl >= 0 ? '+' : ''}{trade2.pnl.toFixed(2)})
                    </div>
                    <div>Setup: {trade2.setup || 'N/A'}</div>
                    <div>Side: <Badge variant="outline">{trade2.side}</Badge></div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Trade 1 Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium">{trade1.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(trade1.opened_at || trade1.trade_date), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-medium">${trade1.entry_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exit:</span>
                    <span className="font-medium">${trade1.exit_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Broker:</span>
                    <span className="font-medium">{trade1.broker || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">{trade1.period_of_day || 'N/A'}</span>
                  </div>
                  {trade1.emotional_tag && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emotion:</span>
                      <Badge variant="outline">{trade1.emotional_tag}</Badge>
                    </div>
                  )}
                  {trade1.notes && (
                    <div className="pt-2 border-t">
                      <div className="text-muted-foreground mb-1">Notes:</div>
                      <div className="text-sm">{trade1.notes}</div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Trade 2 Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium">{trade2.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(trade2.opened_at || trade2.trade_date), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-medium">${trade2.entry_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exit:</span>
                    <span className="font-medium">${trade2.exit_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Broker:</span>
                    <span className="font-medium">{trade2.broker || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">{trade2.period_of_day || 'N/A'}</span>
                  </div>
                  {trade2.emotional_tag && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emotion:</span>
                      <Badge variant="outline">{trade2.emotional_tag}</Badge>
                    </div>
                  )}
                  {trade2.notes && (
                    <div className="pt-2 border-t">
                      <div className="text-muted-foreground mb-1">Notes:</div>
                      <div className="text-sm">{trade2.notes}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Comparison Insights
              </h4>
              <div className="space-y-4">
                {trade1.pnl > trade2.pnl ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="font-medium text-green-600 mb-1">Better Performer</div>
                    <p className="text-sm">
                      Trade 1 outperformed by ${(trade1.pnl - trade2.pnl).toFixed(2)}. 
                      {trade1.setup && trade2.setup && trade1.setup === trade2.setup && 
                        ` Both used ${trade1.setup} setup.`}
                    </p>
                  </div>
                ) : trade2.pnl > trade1.pnl ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="font-medium text-green-600 mb-1">Better Performer</div>
                    <p className="text-sm">
                      Trade 2 outperformed by ${(trade2.pnl - trade1.pnl).toFixed(2)}.
                      {trade1.setup && trade2.setup && trade1.setup === trade2.setup && 
                        ` Both used ${trade2.setup} setup.`}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded">
                    <div className="font-medium mb-1">Equal Performance</div>
                    <p className="text-sm">Both trades resulted in the same P&L</p>
                  </div>
                )}

                {(trade1.duration_minutes || 0) > 0 && (trade2.duration_minutes || 0) > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="font-medium text-blue-600 mb-1">Duration Analysis</div>
                    <p className="text-sm">
                      {(trade1.duration_minutes || 0) < (trade2.duration_minutes || 0) 
                        ? `Trade 1 was ${((trade2.duration_minutes! - trade1.duration_minutes!) / 60).toFixed(1)} hours faster`
                        : `Trade 2 was ${((trade1.duration_minutes! - trade2.duration_minutes!) / 60).toFixed(1)} hours faster`
                      }
                    </p>
                  </div>
                )}

                {trade1.setup && trade2.setup && trade1.setup !== trade2.setup && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                    <div className="font-medium text-purple-600 mb-1">Setup Comparison</div>
                    <p className="text-sm">
                      Different setups used: Trade 1 ({trade1.setup}) vs Trade 2 ({trade2.setup}).
                      {trade1.pnl > trade2.pnl 
                        ? ` ${trade1.setup} performed better in this instance.`
                        : ` ${trade2.setup} performed better in this instance.`}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <div className="font-medium text-yellow-600 mb-1">Key Takeaway</div>
                  <p className="text-sm">
                    Focus on replicating the conditions that led to the better-performing trade. 
                    Review entry timing, market conditions, and emotional state for both trades.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
