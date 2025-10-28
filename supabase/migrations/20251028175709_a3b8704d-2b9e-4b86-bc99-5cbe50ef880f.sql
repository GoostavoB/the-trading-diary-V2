-- Create social_share_log table to track social shares and rewards
CREATE TABLE IF NOT EXISTS public.social_share_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'telegram', 'whatsapp')),
  content_type TEXT NOT NULL CHECK (content_type IN ('trade', 'achievement', 'milestone', 'general')),
  content_id UUID,
  xp_awarded INTEGER NOT NULL DEFAULT 50,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_start_date DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_share_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shares"
  ON public.social_share_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shares"
  ON public.social_share_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient weekly share counting
CREATE INDEX idx_social_share_log_user_week ON public.social_share_log(user_id, week_start_date);
CREATE INDEX idx_social_share_log_user_created ON public.social_share_log(user_id, created_at DESC);

-- Function to record social share with XP reward and weekly limit check
CREATE OR REPLACE FUNCTION record_social_share(
  p_platform TEXT,
  p_content_type TEXT,
  p_content_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_week_start DATE;
  v_shares_this_week INTEGER;
  v_xp_to_award INTEGER := 50;
  v_share_id UUID;
  v_new_xp INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate week start (Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  -- Check shares this week
  SELECT COUNT(*)
  INTO v_shares_this_week
  FROM public.social_share_log
  WHERE user_id = v_user_id
    AND week_start_date = v_week_start;

  -- Weekly limit is 3
  IF v_shares_this_week >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Weekly share limit reached (3 shares per week)',
      'shares_this_week', v_shares_this_week,
      'xp_awarded', 0
    );
  END IF;

  -- Record the share
  INSERT INTO public.social_share_log (
    user_id,
    platform,
    content_type,
    content_id,
    xp_awarded,
    week_start_date
  )
  VALUES (
    v_user_id,
    p_platform,
    p_content_type,
    p_content_id,
    v_xp_to_award,
    v_week_start
  )
  RETURNING id INTO v_share_id;

  -- Award XP
  UPDATE public.user_xp_levels
  SET 
    current_xp = current_xp + v_xp_to_award,
    total_xp = total_xp + v_xp_to_award,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING current_xp INTO v_new_xp;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Share recorded successfully',
    'xp_awarded', v_xp_to_award,
    'shares_this_week', v_shares_this_week + 1,
    'new_xp', v_new_xp,
    'share_id', v_share_id
  );
END;
$$;