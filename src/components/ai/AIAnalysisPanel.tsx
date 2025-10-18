import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIAnalysisResult } from "@/types/ai";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIAnalysisPanelProps {
  tradeIds?: string[];
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export const AIAnalysisPanel = ({ tradeIds, onAnalysisComplete }: AIAnalysisPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-trade-analysis', {
        body: { trade_ids: tradeIds }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);
      toast.success("Analysis complete!");
    } catch (error: any) {
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error(error.message || "Failed to analyze trades");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Trade Analysis</h3>
        </div>
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze Trades"}
        </Button>
      </div>

      {analysis && (
        <Tabs defaultValue="patterns" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-green-500 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Winning Patterns
                </h4>
                <ul className="space-y-2">
                  {analysis.patterns.winning_patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm pl-4 border-l-2 border-green-500">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-500 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Losing Patterns
                </h4>
                <ul className="space-y-2">
                  {analysis.patterns.losing_patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm pl-4 border-l-2 border-red-500">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            {analysis.insights.behavioral.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <Badge className="mb-2">Behavioral</Badge>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            {analysis.insights.emotional.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <Badge className="mb-2">Emotional</Badge>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="risks" className="space-y-3">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <h4 className="font-semibold mb-2">Risk Score: {analysis.risks.risk_score}/100</h4>
              <ul className="space-y-2">
                {analysis.risks.current_risks.map((risk, idx) => (
                  <li key={idx} className="text-sm">{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {analysis.risks.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm pl-4 border-l-2 border-primary">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Immediate Actions
              </h4>
              <ul className="space-y-2">
                {analysis.suggestions.immediate.map((sug, idx) => (
                  <li key={idx} className="text-sm p-3 bg-muted rounded-lg">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Long-term Improvements</h4>
              <ul className="space-y-2">
                {analysis.suggestions.long_term.map((sug, idx) => (
                  <li key={idx} className="text-sm p-3 bg-muted rounded-lg">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
            {analysis.encouragement && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">{analysis.encouragement}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
};
