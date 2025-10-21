import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface PsychologyMetric {
  category: string;
  score: number;
  status: "excellent" | "good" | "warning" | "critical";
  insights: string[];
  recommendations: string[];
}

export function TradingPsychologyTracker() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<PsychologyMetric[]>([]);

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades-psychology', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const analyzePsychology = async () => {
    if (!recentTrades || recentTrades.length < 5) {
      toast.error("Need at least 5 trades to analyze trading psychology");
      return;
    }

    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-psychology-analysis', {
        body: { user_id: user?.id, trades: recentTrades }
      });

      if (error) throw error;

      setMetrics(data.metrics);
      toast.success("Psychology analysis complete");
    } catch (error) {
      console.error('Psychology analysis error:', error);
      toast.error("Failed to analyze trading psychology");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-600";
      case "warning": return "text-yellow-600";
      case "critical": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "good": return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Trading Psychology Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered analysis of your trading mindset and emotional patterns
          </p>
        </div>
        <Button 
          onClick={analyzePsychology} 
          disabled={analyzing || !recentTrades || recentTrades.length < 5}
        >
          {analyzing ? "Analyzing..." : "Analyze Psychology"}
        </Button>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run an analysis to get insights into your trading psychology
          </p>
          <p className="text-xs text-muted-foreground">
            {recentTrades ? `${recentTrades.length} trades available` : "Loading trades..."}
          </p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <h3 className="font-semibold">{metric.category}</h3>
                      <Badge variant="outline" className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{metric.score}/100</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>
                
                <Progress value={metric.score} className="mb-3" />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Key Insights:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {metric.insights.slice(0, 2).map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <h3 className="text-xl font-semibold">{metric.category}</h3>
                      <Badge variant="outline" className={getStatusColor(metric.status)}>
                        {metric.status} - Score: {metric.score}/100
                      </Badge>
                    </div>
                  </div>
                </div>

                <Progress value={metric.score} className="mb-6" />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Detailed Insights
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {metric.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 bg-accent rounded">
                          <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {metric.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
