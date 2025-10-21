import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Heart, Zap, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const emotionIcons: Record<string, any> = {
  confident: TrendingUp,
  fearful: AlertCircle,
  greedy: Zap,
  calm: Heart,
  anxious: Brain,
};

const emotionColors: Record<string, string> = {
  confident: "bg-green-500/10 text-green-500 border-green-500/20",
  fearful: "bg-red-500/10 text-red-500 border-red-500/20",
  greedy: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  calm: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  anxious: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export function EmotionalTimeline() {
  const { user } = useAuth();

  const { data: logs } = useQuery({
    queryKey: ['psychology-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychology_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('logged_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotional Timeline</CardTitle>
          <CardDescription>Your recent emotional states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No States Logged</h3>
            <p className="text-sm text-muted-foreground">
              Start logging your emotional states to track patterns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotional Timeline</CardTitle>
        <CardDescription>Your recent emotional states and patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {logs.map((log: any) => {
              const EmotionIcon = emotionIcons[log.emotional_state] || Brain;
              const colorClass = emotionColors[log.emotional_state] || "bg-gray-500/10 text-gray-500";

              return (
                <div
                  key={log.id}
                  className="flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-3 rounded-lg ${colorClass} border`}>
                    <EmotionIcon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {log.emotional_state}
                      </Badge>
                      <Badge variant="secondary">
                        Intensity: {log.intensity}/10
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.logged_at), "MMM d, h:mm a")}
                      </div>
                    </div>

                    {log.conditions && log.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {log.conditions.map((condition: string) => (
                          <Badge key={condition} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {log.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
