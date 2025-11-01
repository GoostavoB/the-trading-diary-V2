import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialPost } from "@/types/social";
import { FeedPost } from "@/components/social/FeedPost";
import { PostComposer } from "@/components/social/PostComposer";
import { UserCard } from "@/components/social/UserCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { PremiumFeatureLock } from "@/components/PremiumFeatureLock";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function Social() {
  const { isFeatureLocked } = useSubscription();
  const isPremiumLocked = isFeatureLocked('pro');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (activeTab === "following" && user) {
        // Get posts from users I follow
        const { data: following } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = following?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in("user_id", followingIds);
        } else {
          setFollowingPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data: postsData, error } = await query;
      if (error) throw error;

      // Fetch profiles and liked status
      const userIds = postsData?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      let likedPostIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postsData?.map(p => p.id) || []);
        likedPostIds = likes?.map(l => l.post_id) || [];
      }

      const postsWithData = postsData?.map(post => ({
        ...post,
        profile: profiles?.find(p => p.id === post.user_id) as any,
        is_liked: likedPostIds.includes(post.id)
      })) || [];

      if (activeTab === "following") {
        setFollowingPosts(postsWithData as SocialPost[]);
      } else {
        setPosts(postsWithData as SocialPost[]);
      }
    } catch (error: any) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const displayPosts = activeTab === "following" ? followingPosts : posts;

  return (
    <AppLayout>
      <PremiumFeatureLock requiredPlan="pro" isLocked={isPremiumLocked}>
        <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trading Community</h1>
          <p className="text-muted-foreground mt-1">Connect, share, and learn from fellow traders</p>
        </div>

        <PostComposer onPostCreated={fetchPosts} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 glass">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : displayPosts.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                No posts yet. Be the first to share!
              </p>
            ) : (
              displayPosts.map((post) => (
                <FeedPost key={post.id} post={post} onLike={fetchPosts} />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : displayPosts.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                No posts from users you follow. Start following traders to see their posts here!
              </p>
            ) : (
              displayPosts.map((post) => (
                <FeedPost key={post.id} post={post} onLike={fetchPosts} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      </PremiumFeatureLock>
    </AppLayout>
  );
}
