import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EMOTION_TAGS, getTagColor } from "@/constants/tradingTags";

interface TradeTagEditorProps {
  tradeIndex: number;
  emotionTags: string[];
  setup: string;
  onEmotionTagsChange: (tags: string[]) => void;
  onSetupChange: (setup: string) => void;
}

export function TradeTagEditor({
  tradeIndex,
  emotionTags,
  setup,
  onEmotionTagsChange,
  onSetupChange,
}: TradeTagEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmotionTag, setNewEmotionTag] = useState("");
  const [setupInput, setSetupInput] = useState(setup);
  const [emotionPopoverOpen, setEmotionPopoverOpen] = useState(false);
  const [setupPopoverOpen, setSetupPopoverOpen] = useState(false);

  // Fetch custom emotion tags
  const { data: customEmotionTags = [] } = useQuery({
    queryKey: ["custom-emotion-tags"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("custom_tags")
        .select("tag_name")
        .eq("user_id", user.id)
        .eq("tag_type", "emotion")
        .order("tag_name");

      if (error) throw error;
      return data.map(t => t.tag_name);
    },
  });

  // Fetch existing setups from user's trades
  const { data: existingSetups = [] } = useQuery({
    queryKey: ["user-setups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("setup")
        .eq("user_id", user.id)
        .not("setup", "is", null)
        .order("setup");

      if (error) throw error;
      
      // Get unique setups
      const uniqueSetups = [...new Set(data.map(t => t.setup).filter(Boolean))];
      return uniqueSetups as string[];
    },
  });

  const createCustomEmotionTag = useMutation({
    mutationFn: async (tagName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("custom_tags")
        .insert({
          user_id: user.id,
          tag_name: tagName,
          tag_type: "emotion",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-emotion-tags"] });
    },
  });

  const allEmotionTags = [...EMOTION_TAGS, ...customEmotionTags];

  const toggleEmotionTag = async (tag: string) => {
    if (emotionTags.includes(tag)) {
      onEmotionTagsChange(emotionTags.filter(t => t !== tag));
    } else {
      onEmotionTagsChange([...emotionTags, tag]);
    }
  };

  const handleAddCustomEmotionTag = async () => {
    const trimmed = newEmotionTag.trim();
    if (!trimmed) return;

    if (trimmed.length > 30) {
      toast({
        title: "Tag too long",
        description: "Emotion tags must be 30 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (allEmotionTags.includes(trimmed)) {
      // Just add it to selected tags
      if (!emotionTags.includes(trimmed)) {
        onEmotionTagsChange([...emotionTags, trimmed]);
      }
      setNewEmotionTag("");
      return;
    }

    try {
      await createCustomEmotionTag.mutateAsync(trimmed);
      onEmotionTagsChange([...emotionTags, trimmed]);
      setNewEmotionTag("");
      toast({
        title: "Tag created",
        description: `"${trimmed}" has been added to your emotion tags`,
      });
    } catch (error) {
      console.error("Error creating custom tag:", error);
      toast({
        title: "Error",
        description: "Failed to create custom tag",
        variant: "destructive",
      });
    }
  };

  const handleSetupSelect = (selectedSetup: string) => {
    setSetupInput(selectedSetup);
    onSetupChange(selectedSetup);
    setSetupPopoverOpen(false);
  };

  const handleSetupInputChange = (value: string) => {
    setSetupInput(value);
    if (value.trim()) {
      onSetupChange(value.trim());
    }
  };

  const removeEmotionTag = (tag: string) => {
    onEmotionTagsChange(emotionTags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      {/* Emotion Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Emotional Tags</span>
          <Popover open={emotionPopoverOpen} onOpenChange={setEmotionPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Select Emotions</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {allEmotionTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={emotionTags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${
                          emotionTags.includes(tag) ? getTagColor(tag, "emotion") : ""
                        }`}
                        onClick={() => toggleEmotionTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium text-sm">Create Custom Tag</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New emotion tag..."
                      value={newEmotionTag}
                      onChange={(e) => setNewEmotionTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomEmotionTag()}
                      className="h-8 text-xs"
                    />
                    <Button
                      onClick={handleAddCustomEmotionTag}
                      size="sm"
                      className="h-8"
                      disabled={!newEmotionTag.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {emotionTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {emotionTags.map((tag) => (
              <Badge
                key={tag}
                className={`text-xs ${getTagColor(tag, "emotion")}`}
              >
                {tag}
                <button
                  onClick={() => removeEmotionTag(tag)}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No emotions selected</p>
        )}
      </div>

      {/* Setup/Strategy */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Setup/Strategy</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter setup/strategy..."
            value={setupInput}
            onChange={(e) => handleSetupInputChange(e.target.value)}
            className="h-8 text-xs flex-1"
            maxLength={50}
          />
          {existingSetups.length > 0 && (
            <Popover open={setupPopoverOpen} onOpenChange={setSetupPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  Previous
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {existingSetups.map((existingSetup) => (
                    <button
                      key={existingSetup}
                      onClick={() => handleSetupSelect(existingSetup)}
                      className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent transition-colors"
                    >
                      {existingSetup}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {setup && (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
            {setup}
          </Badge>
        )}
      </div>
    </div>
  );
}
