import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { SocialPost } from "@/types/social";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommentSection } from "./CommentSection";

interface FeedPostProps {
  post: SocialPost;
  onLike?: () => void;
}

export const FeedPost = ({ post, onLike }: FeedPostProps) => {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }

      if (isLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({ post_id: post.id, user_id: user.id });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      onLike?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'trade_share': return 'bg-blue-500/10 text-blue-500';
      case 'strategy': return 'bg-purple-500/10 text-purple-500';
      case 'milestone': return 'bg-green-500/10 text-green-500';
      case 'tip': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={post.profile?.avatar_url || undefined} />
          <AvatarFallback>
            {post.profile?.full_name?.[0] || post.profile?.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">
                {post.profile?.full_name || post.profile?.email || "Anonymous"}
              </p>
              <p className="text-sm text-muted-foreground">
                @{post.profile?.username || "user"} · {formatDistanceToNow(new Date(post.created_at))} ago
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <Badge className={getPostTypeColor(post.post_type)}>
            {post.post_type.replace('_', ' ')}
          </Badge>

          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center gap-6 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {showComments && (
            <CommentSection postId={post.id} />
          )}
        </div>
      </div>
    </Card>
  );
};
