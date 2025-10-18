import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PostComposerProps {
  onPostCreated?: () => void;
}

export const PostComposer = ({ onPostCreated }: PostComposerProps) => {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<'trade_share' | 'strategy' | 'milestone' | 'tip'>('tip');
  const [visibility, setVisibility] = useState<'private' | 'followers' | 'public'>('public');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to post");
        return;
      }

      const { error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: postType,
          visibility
        });

      if (error) throw error;

      setContent("");
      toast.success("Post created!");
      onPostCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Share your trading insights, strategies, or milestones..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
        />

        <div className="flex gap-4">
          <Select value={postType} onValueChange={(v: any) => setPostType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Post type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tip">Trading Tip</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="trade_share">Trade Share</SelectItem>
            </SelectContent>
          </Select>

          <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="followers">Followers Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={submitting || !content.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </form>
    </Card>
  );
};
