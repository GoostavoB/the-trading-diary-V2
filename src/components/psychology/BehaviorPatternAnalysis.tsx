import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Brain, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function BehaviorPatternAnalysis() {
  const { user } = useAuth();

  const { data: trades } = useQuery({
    queryKey: ['trades-psychology', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: logs } = useQuery({
    queryKey: ['psychology-logs-analysis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychology_logs')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Analyze patterns
  const analyzePatterns = () => {
    if (!trades || !logs || trades.length === 0 || logs.length === 0) {
      return null;
    }

    // Emotion frequency
    const emotionCounts: Record<string, number> = {};
    logs.forEach((log: any) => {
      emotionCounts[log.emotional_state] = (emotionCounts[log.emotional_state] || 0) + 1;
    });

    const totalLogs = logs.length;
    const emotionFrequency = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: (count / totalLogs) * 100,
    })).sort((a, b) => b.count - a.count);

    // Average intensity by emotion
    const emotionIntensities: Record<string, number[]> = {};
    logs.forEach((log: any) => {
      if (!emotionIntensities[log.emotional_state]) {
        emotionIntensities[log.emotional_state] = [];
      }
      emotionIntensities[log.emotional_state].push(log.intensity);
    });

    const avgIntensities = Object.entries(emotionIntensities).map(([emotion, intensities]) => ({
      emotion,
      avgIntensity: intensities.reduce((sum, i) => sum + i, 0) / intensities.length,
    }));

    // Condition frequency
    const conditionCounts: Record<string, number> = {};
    logs.forEach((log: any) => {
      if (log.conditions) {
        log.conditions.forEach((condition: string) => {
          conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        });
      }
    });

    const topConditions = Object.entries(conditionCounts)
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      emotionFrequency,
      avgIntensities,
      topConditions,
    };
  };

  const analysis = analyzePatterns();

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior Pattern Analysis</CardTitle>
          <CardDescription>AI-powered insights into your trading psychology</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Insufficient Data</h3>
            <p className="text-sm text-muted-foreground">
              Log more emotional states to see pattern analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Emotional Frequency</CardTitle>
          <CardDescription>Your most common emotional states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.emotionFrequency.map((item) => (
            <div key={item.emotion} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{item.emotion}</span>
                <span className="text-sm text-muted-foreground">
                  {item.count} times ({item.percentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Intensity Levels</CardTitle>
          <CardDescription>How intense each emotion typically is</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.avgIntensities.map((item) => (
            <div key={item.emotion} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{item.emotion}</span>
                <Badge variant="outline">
                  {item.avgIntensity.toFixed(1)}/10
                </Badge>
              </div>
              <Progress value={item.avgIntensity * 10} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Trading Conditions</CardTitle>
          <CardDescription>Your typical mental state while trading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.topConditions.map((item, index) => (
              <div
                key={item.condition}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.condition}</span>
                </div>
                <Badge>{item.count} times</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Psychological Insights</CardTitle>
          <CardDescription>Key patterns and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Dominant Emotion</p>
              <p className="text-sm text-muted-foreground">
                You most often trade while feeling{" "}
                <span className="font-semibold capitalize text-foreground">
                  {analysis.emotionFrequency[0].emotion}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Watch For</p>
              <p className="text-sm text-muted-foreground">
                Monitor your performance when experiencing high-intensity emotions
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Target className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground">
                Track correlation between emotional states and trade outcomes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
