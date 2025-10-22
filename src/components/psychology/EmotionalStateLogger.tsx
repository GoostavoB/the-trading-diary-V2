import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const emotionalStates = [
  { id: "confident", label: "Confident", icon: TrendingUp, color: "bg-green-500" },
  { id: "fearful", label: "Fearful", icon: AlertCircle, color: "bg-red-500" },
  { id: "greedy", label: "Greedy", icon: Zap, color: "bg-orange-500" },
  { id: "calm", label: "Calm", icon: Heart, color: "bg-blue-500" },
  { id: "anxious", label: "Anxious", icon: Brain, color: "bg-yellow-500" },
];

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

export function EmotionalStateLogger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [intensity, setIntensity] = useState([5]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = async () => {
    if (!selectedEmotion) {
      toast.error("Please select your emotional state");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('psychology_logs')
        .insert({
          user_id: user?.id,
          emotional_state: selectedEmotion,
          intensity: intensity[0],
          conditions: selectedConditions,
          notes,
          logged_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Your emotional state has been recorded");

      // Reset form
      setSelectedEmotion("");
      setIntensity([5]);
      setSelectedConditions([]);
      setNotes("");

      // Invalidate and refetch the timeline
      queryClient.invalidateQueries({ queryKey: ['psychology-logs'] });

    } catch (error) {
      console.error("Error logging state:", error);
      toast.error("Failed to log emotional state");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Log Emotional State</CardTitle>
        <CardDescription className="text-sm">Track your mental and emotional state before/during trading</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emotion Selection - More Compact */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">How are you feeling?</Label>
          <div className="grid grid-cols-5 gap-2">
            {emotionalStates.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => setSelectedEmotion(emotion.id)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedEmotion === emotion.id
                    ? `${emotion.color} border-current text-white shadow-md`
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <emotion.icon className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs font-medium">{emotion.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout for Intensity and Conditions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Intensity Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Intensity</Label>
              <span className="text-lg font-bold text-primary">{intensity[0]}/10</span>
            </div>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Trading Conditions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Trading Conditions</Label>
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
        </div>

        {/* Notes - Compact */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What triggered this emotion? Any specific thoughts or concerns?"
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
          size="default"
        >
          {isSubmitting ? "Logging..." : "Log State"}
        </Button>
      </CardContent>
    </Card>
  );
}
