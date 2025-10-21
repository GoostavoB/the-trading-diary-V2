import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, Calendar, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Prediction {
  timeframe: string;
  predicted_pnl: number;
  confidence: number;
  best_case: number;
  worst_case: number;
  key_factors: string[];
}

interface RiskAlert {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  recommendation: string;
}

export function PerformancePrediction() {
  const { user } = useAuth();
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [projectionData, setProjectionData] = useState<any[]>([]);

  const { data: historicalData } = useQuery({
    queryKey: ['performance-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const generatePrediction = async () => {
    if (!historicalData || historicalData.length < 10) {
      toast.error("Need at least 10 trades for performance prediction");
      return;
    }

    setPredicting(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-performance-prediction', {
        body: { user_id: user?.id, trades: historicalData }
      });

      if (error) throw error;

      setPredictions(data.predictions);
      setRiskAlerts(data.risk_alerts);
      setProjectionData(data.projection_data);
      toast.success("Performance prediction generated");
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error("Failed to generate prediction");
    } finally {
      setPredicting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Performance Prediction
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered forecasting of your future trading performance
          </p>
        </div>
        <Button 
          onClick={generatePrediction} 
          disabled={predicting || !historicalData || historicalData.length < 10}
        >
          {predicting ? "Predicting..." : "Generate Prediction"}
        </Button>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate predictions to see your expected performance
          </p>
          <p className="text-xs text-muted-foreground">
            {historicalData ? `${historicalData.length} trades available` : "Loading data..."}
          </p>
        </div>
      ) : (
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="projection">Projection Chart</TabsTrigger>
            <TabsTrigger value="risks">Risk Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            {predictions.map((pred, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{pred.timeframe}</h3>
                      <Badge variant="outline" className="mt-1">
                        {pred.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${pred.predicted_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pred.predicted_pnl >= 0 ? '+' : ''}{pred.predicted_pnl.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Predicted ROI</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Best Case</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      +{pred.best_case.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Worst Case</span>
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {pred.worst_case.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Key Factors:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {pred.key_factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="projection" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Performance Projection</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="best_case" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.2}
                    name="Best Case"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stackId="2"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                    name="Expected"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="worst_case" 
                    stackId="3"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.2}
                    name="Worst Case"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-3">
            {riskAlerts.length === 0 ? (
              <Card className="p-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold text-green-600 mb-1">All Clear!</h3>
                <p className="text-sm text-muted-foreground">No significant risk alerts detected</p>
              </Card>
            ) : (
              riskAlerts.map((alert, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{alert.type}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
