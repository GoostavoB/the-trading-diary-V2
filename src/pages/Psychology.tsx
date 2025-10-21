import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { EmotionalStateLogger } from "@/components/psychology/EmotionalStateLogger";
import { EmotionalTimeline } from "@/components/psychology/EmotionalTimeline";
import { BehaviorPatternAnalysis } from "@/components/psychology/BehaviorPatternAnalysis";
import { Brain, Clock, BarChart3, Lightbulb } from "lucide-react";

export default function Psychology() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Trading Psychology</h1>
            <p className="text-muted-foreground">Track and improve your mental game</p>
          </div>
        </div>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="log" className="gap-2">
              <Brain className="h-4 w-4" />
              Log State
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmotionalStateLogger />
              <EmotionalTimeline />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <EmotionalTimeline />
          </TabsContent>

          <TabsContent value="analysis">
            <BehaviorPatternAnalysis />
          </TabsContent>

          <TabsContent value="insights">
            <div className="text-center py-16">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">AI Insights Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI-powered psychological insights and recommendations
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
