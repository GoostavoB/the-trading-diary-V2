import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/types/trade";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { WidgetProps } from "@/types/widget";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTagColor } from "@/constants/tradingTags";

interface TagStats {
  tag: string;
  type: 'emotion' | 'mistake';
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgPnL: number;
  totalPnL: number;
}

export function EmotionMistakeCorrelationWidget({ id, isEditMode, onRemove }: WidgetProps) {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades-emotion-correlation'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('closed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Trade[];
    },
  });

  const analyzePatterns = (): { emotions: TagStats[], mistakes: TagStats[] } => {
    const emotionMap = new Map<string, { wins: number; losses: number; pnls: number[] }>();
    const mistakeMap = new Map<string, { wins: number; losses: number; pnls: number[] }>();

    // Add defensive check
    (trades || []).forEach(trade => {
      const pnl = trade.pnl || trade.profit_loss || 0;
      const isWin = pnl > 0;

      // Process emotions
      if (trade.emotion_tags && Array.isArray(trade.emotion_tags)) {
        trade.emotion_tags.forEach(emotion => {
          if (!emotionMap.has(emotion)) {
            emotionMap.set(emotion, { wins: 0, losses: 0, pnls: [] });
          }
          const stats = emotionMap.get(emotion)!;
          if (isWin) stats.wins++;
          else stats.losses++;
          stats.pnls.push(pnl);
        });
      }

      // Process mistakes
      if (trade.error_tags && Array.isArray(trade.error_tags)) {
        trade.error_tags.forEach(mistake => {
          if (!mistakeMap.has(mistake)) {
            mistakeMap.set(mistake, { wins: 0, losses: 0, pnls: [] });
          }
          const stats = mistakeMap.get(mistake)!;
          if (isWin) stats.wins++;
          else stats.losses++;
          stats.pnls.push(pnl);
        });
      }
    });

    const processStats = (map: Map<string, any>, type: 'emotion' | 'mistake'): TagStats[] => {
      return Array.from(map.entries())
        .map(([tag, data]) => {
          const totalTrades = data.wins + data.losses;
          const avgPnL = data.pnls.reduce((a: number, b: number) => a + b, 0) / totalTrades;
          const totalPnL = data.pnls.reduce((a: number, b: number) => a + b, 0);
          
          return {
            tag,
            type,
            totalTrades,
            winningTrades: data.wins,
            losingTrades: data.losses,
            winRate: (data.wins / totalTrades) * 100,
            avgPnL,
            totalPnL,
          };
        })
        .filter(stat => stat.totalTrades >= 3) // Only show tags with 3+ trades
        .sort((a, b) => b.winRate - a.winRate);
    };

    return {
      emotions: processStats(emotionMap, 'emotion'),
      mistakes: processStats(mistakeMap, 'mistake'),
    };
  };

  const { emotions, mistakes } = analyzePatterns();

  // Prepare chart data - top emotions by win rate
  const emotionChartData = emotions.slice(0, 5).map(stat => ({
    name: stat.tag.length > 12 ? stat.tag.substring(0, 12) + '...' : stat.tag,
    fullName: stat.tag,
    winRate: Math.round(stat.winRate),
    avgPnL: Math.round(stat.avgPnL * 100) / 100,
    trades: stat.totalTrades,
  }));

  // Prepare mistake chart data - sorted by win rate (ascending to show worst first)
  const mistakeChartData = mistakes.slice(0, 5).map(stat => ({
    name: stat.tag.length > 12 ? stat.tag.substring(0, 12) + '...' : stat.tag,
    fullName: stat.tag,
    winRate: Math.round(stat.winRate),
    avgPnL: Math.round(stat.avgPnL * 100) / 100,
    trades: stat.totalTrades,
  })).sort((a, b) => a.winRate - b.winRate);

  const getBarColor = (winRate: number) => {
    if (winRate >= 60) return 'hsl(var(--success))';
    if (winRate >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center bg-card border-border">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (emotions.length === 0 && mistakes.length === 0) {
    return (
      <Card className="p-6 h-full bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Emotion & Mistake Patterns</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          <p>Add emotion and mistake tags to trades to see correlation patterns</p>
        </div>
      </Card>
    );
  }

  // Find best and worst patterns
  const bestEmotion = emotions[0];
  const worstEmotion = emotions[emotions.length - 1];
  const bestMistake = mistakes[mistakes.length - 1]; // Highest win rate among mistakes
  const worstMistake = mistakes[0]; // Lowest win rate

  return (
    <Card className="p-6 h-full bg-card border-border overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Emotion & Mistake Patterns</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {/* Key Insights */}
          <div className="grid grid-cols-2 gap-3">
            {bestEmotion && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs font-medium text-success">Best Emotion</span>
                </div>
                <Badge className={`text-xs ${getTagColor(bestEmotion.tag, 'emotion')}`}>
                  {bestEmotion.tag}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(bestEmotion.winRate)}% win rate ({bestEmotion.totalTrades} trades)
                </p>
              </div>
            )}
            {worstMistake && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium text-destructive">Worst Mistake</span>
                </div>
                <Badge className={`text-xs ${getTagColor(worstMistake.tag, 'error')}`}>
                  {worstMistake.tag}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(worstMistake.winRate)}% win rate ({worstMistake.totalTrades} trades)
                </p>
              </div>
            )}
          </div>

          {/* Emotion Chart */}
          {emotionChartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Emotions by Win Rate</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={emotionChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      return [value, name];
                    }}
                    labelFormatter={(label: string, payload: any) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.fullName} (${payload[0].payload.trades} trades)`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {emotionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mistake Chart */}
          {mistakeChartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Common Mistakes by Win Rate</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mistakeChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      return [value, name];
                    }}
                    labelFormatter={(label: string, payload: any) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.fullName} (${payload[0].payload.trades} trades)`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {mistakeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Top Emotions */}
            {emotions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Top Emotions</h4>
                <div className="space-y-2">
                  {emotions.slice(0, 3).map(stat => (
                    <div key={stat.tag} className="text-xs">
                      <Badge className={getTagColor(stat.tag, 'emotion')}>
                        {stat.tag}
                      </Badge>
                      <div className="mt-1 text-muted-foreground">
                        {Math.round(stat.winRate)}% WR • {stat.totalTrades} trades
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Costly Mistakes */}
            {mistakes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Costly Mistakes</h4>
                <div className="space-y-2">
                  {mistakes.slice(0, 3).map(stat => (
                    <div key={stat.tag} className="text-xs">
                      <Badge className={getTagColor(stat.tag, 'error')}>
                        {stat.tag}
                      </Badge>
                      <div className="mt-1 text-muted-foreground">
                        {Math.round(stat.winRate)}% WR • ${Math.round(stat.avgPnL)}avg
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
