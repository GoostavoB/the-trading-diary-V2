-- ============================================
-- PHASE 1: Trade Replay & Analysis Tables
-- ============================================

-- Trade annotations for replay system
CREATE TABLE IF NOT EXISTS public.trade_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  annotation_type TEXT NOT NULL, -- 'entry', 'exit', 'stop_loss', 'take_profit', 'note'
  price NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trade_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotations" 
  ON public.trade_annotations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annotations" 
  ON public.trade_annotations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations" 
  ON public.trade_annotations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations" 
  ON public.trade_annotations FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PHASE 2: Social Features Tables
-- ============================================

-- Extend profiles table for social features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'private'; -- 'private', 'followers', 'public'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- User follows system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows" 
  ON public.user_follows FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own follows" 
  ON public.user_follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" 
  ON public.user_follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- Social posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL, -- 'trade_share', 'strategy', 'milestone', 'tip'
  visibility TEXT DEFAULT 'followers', -- 'private', 'followers', 'public'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public posts" 
  ON public.social_posts FOR SELECT 
  USING (
    visibility = 'public' OR 
    user_id = auth.uid() OR
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE following_id = social_posts.user_id 
      AND follower_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own posts" 
  ON public.social_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
  ON public.social_posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" 
  ON public.social_posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes" 
  ON public.post_likes FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own likes" 
  ON public.post_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
  ON public.post_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible posts" 
  ON public.post_comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.social_posts 
      WHERE id = post_comments.post_id 
      AND (
        visibility = 'public' OR 
        user_id = auth.uid() OR
        (visibility = 'followers' AND EXISTS (
          SELECT 1 FROM public.user_follows 
          WHERE following_id = social_posts.user_id 
          AND follower_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can create comments" 
  ON public.post_comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON public.post_comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON public.post_comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Shared strategies
CREATE TABLE IF NOT EXISTS public.shared_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  setup_type TEXT,
  rules JSONB NOT NULL, -- Entry rules, exit rules, risk management
  performance_stats JSONB, -- Calculated stats
  visibility TEXT DEFAULT 'public',
  likes_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public strategies" 
  ON public.shared_strategies FOR SELECT 
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create own strategies" 
  ON public.shared_strategies FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" 
  ON public.shared_strategies FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" 
  ON public.shared_strategies FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PHASE 3: AI Analysis Tables
-- ============================================

-- AI analysis results cache
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'trade_analysis', 'pattern_recognition', 'risk_assessment', 'suggestions'
  request_hash TEXT NOT NULL, -- Hash of the request to avoid duplicate processing
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_hash ON public.ai_analysis_cache(request_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);

ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis" 
  ON public.ai_analysis_cache FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analysis" 
  ON public.ai_analysis_cache FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- AI chat history
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB, -- Trade IDs, stats, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history" 
  ON public.ai_chat_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat history" 
  ON public.ai_chat_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER update_trade_annotations_updated_at
  BEFORE UPDATE ON public.trade_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_strategies_updated_at
  BEFORE UPDATE ON public.shared_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Functions for counter updates
-- ============================================

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
    
    UPDATE public.profiles 
    SET followers_count = GREATEST(followers_count - 1, 0) 
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();