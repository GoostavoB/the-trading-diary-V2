import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysisPanel";
import { AIChat } from "@/components/ai/AIChat";
import { AIGeneratedReport } from "@/components/ai/AIGeneratedReport";
import { AIPatternRecognition } from "@/components/ai/AIPatternRecognition";
import { TradingPsychologyTracker } from "@/components/ai/TradingPsychologyTracker";
import { PerformancePrediction } from "@/components/ai/PerformancePrediction";
import { Brain, MessageSquare, FileText, Target, Activity, TrendingUp } from "lucide-react";

export default function AITools() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">AI Trading Assistant</h1>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analysis" className="gap-2">
              <Brain className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <Target className="h-4 w-4" />
              Patterns
            </TabsTrigger>
            <TabsTrigger value="psychology" className="gap-2">
              <Activity className="h-4 w-4" />
              Psychology
            </TabsTrigger>
            <TabsTrigger value="prediction" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Prediction
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Coach
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <AIAnalysisPanel />
          </TabsContent>

          <TabsContent value="patterns">
            <AIPatternRecognition />
          </TabsContent>

          <TabsContent value="psychology">
            <TradingPsychologyTracker />
          </TabsContent>

          <TabsContent value="prediction">
            <PerformancePrediction />
          </TabsContent>

          <TabsContent value="chat">
            <AIChat />
          </TabsContent>

          <TabsContent value="reports">
            <AIGeneratedReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
