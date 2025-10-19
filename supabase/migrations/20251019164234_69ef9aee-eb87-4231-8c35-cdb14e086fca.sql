-- Create table to track unlocked badges
CREATE TABLE public.unlocked_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.unlocked_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own unlocked badges"
  ON public.unlocked_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocked badges"
  ON public.unlocked_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked badges"
  ON public.unlocked_badges
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_unlocked_badges_user_id ON public.unlocked_badges(user_id);
CREATE INDEX idx_unlocked_badges_notified ON public.unlocked_badges(user_id, notified) WHERE notified = false;