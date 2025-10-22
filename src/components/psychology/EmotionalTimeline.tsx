import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Zap, TrendingUp, AlertCircle, Calendar, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const tradingConditions = [
  "Clear headed",
  "Well rested",
  "Stressed",
  "Distracted",
  "Rushed",
  "Patient",
  "Disciplined",
  "Emotional",
];

export function EmotionalTimeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([5]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data: logs, refetch } = useQuery({
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

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('psychology-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'psychology_logs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const handleEditClick = (log: any) => {
    setEditingLog(log);
    setIntensity([log.intensity]);
    setSelectedConditions(log.conditions || []);
    setNotes(log.notes || "");
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from('psychology_logs')
        .update({
          intensity: intensity[0],
          conditions: selectedConditions,
          notes,
        })
        .eq('id', editingLog.id);

      if (error) throw error;

      toast.success("Emotional state updated");
      setEditingLog(null);
      refetch();
    } catch (error) {
      console.error("Error updating log:", error);
      toast.error("Failed to update emotional state");
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;

    try {
      const { error } = await supabase
        .from('psychology_logs')
        .delete()
        .eq('id', deleteLogId);

      if (error) throw error;

      toast.success("Emotional state deleted");
      setDeleteLogId(null);
      refetch();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete emotional state");
    }
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

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
    <>
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
                    className="flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
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

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(log)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteLogId(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Emotional State</DialogTitle>
            <DialogDescription>Update your emotional state details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensity</Label>
                <span className="text-lg font-bold text-primary">{intensity[0]}/10</span>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Trading Conditions</Label>
              <div className="flex flex-wrap gap-1.5">
                {tradingConditions.map((condition) => (
                  <Badge
                    key={condition}
                    variant={selectedConditions.includes(condition) ? "default" : "outline"}
                    className="cursor-pointer text-xs px-2 py-0.5"
                    onClick={() => toggleCondition(condition)}
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What triggered this emotion?"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingLog(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLog}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLogId} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Emotional State?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this emotional state entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
