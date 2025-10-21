import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
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
      toast({
        title: "Missing Information",
        description: "Please select your emotional state",
        variant: "destructive",
      });
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

      toast({
        title: "State Logged",
        description: "Your emotional state has been recorded",
      });

      // Reset form
      setSelectedEmotion("");
      setIntensity([5]);
      setSelectedConditions([]);
      setNotes("");

    } catch (error) {
      console.error("Error logging state:", error);
      toast({
        title: "Error",
        description: "Failed to log emotional state",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Emotional State</CardTitle>
        <CardDescription>Track your mental and emotional state before/during trading</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>How are you feeling?</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {emotionalStates.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => setSelectedEmotion(emotion.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedEmotion === emotion.id
                    ? `${emotion.color} border-current text-white`
                    : "border-border hover:border-primary/50"
                }`}
              >
                <emotion.icon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{emotion.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Intensity Level</Label>
            <span className="text-2xl font-bold">{intensity[0]}/10</span>
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

        <div className="space-y-3">
          <Label>Trading Conditions</Label>
          <div className="flex flex-wrap gap-2">
            {tradingConditions.map((condition) => (
              <Badge
                key={condition}
                variant={selectedConditions.includes(condition) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCondition(condition)}
              >
                {condition}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What triggered this emotion? Any specific thoughts or concerns?"
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Logging..." : "Log State"}
        </Button>
      </CardContent>
    </Card>
  );
}
