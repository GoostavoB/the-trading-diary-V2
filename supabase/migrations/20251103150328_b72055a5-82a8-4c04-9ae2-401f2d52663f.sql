-- Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gift_credits_awarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_ends_at TIMESTAMPTZ;

-- Create analytics events table
CREATE TABLE IF NOT EXISTS user_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON user_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON user_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON user_analytics_events(created_at DESC);

-- Enable RLS on analytics table
ALTER TABLE user_analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON user_analytics_events;
CREATE POLICY "Users can view own analytics" ON user_analytics_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert analytics" ON user_analytics_events;
CREATE POLICY "Service role can insert analytics" ON user_analytics_events
  FOR INSERT WITH CHECK (true);

-- Create function to award gift credits on signup
CREATE OR REPLACE FUNCTION award_signup_gift_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 gift credits only to free tier users on first signup
  IF NEW.gift_credits_awarded = FALSE AND NEW.subscription_tier = 'free' THEN
    -- Update profiles with gift credits
    UPDATE profiles 
    SET 
      gift_credits_awarded = TRUE
    WHERE id = NEW.id;
    
    -- Update subscriptions table with gift credits
    UPDATE subscriptions
    SET upload_credits_balance = COALESCE(upload_credits_balance, 0) + 5
    WHERE user_id = NEW.id;
    
    -- Log the event
    INSERT INTO user_analytics_events (user_id, event_name, event_params)
    VALUES (NEW.id, 'gift_credits_awarded', jsonb_build_object('credits', 5));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for gift credits
DROP TRIGGER IF EXISTS on_profile_gift_credits ON profiles;
CREATE TRIGGER on_profile_gift_credits
  AFTER INSERT OR UPDATE OF subscription_tier ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_signup_gift_credits();

-- Drop existing function and recreate with new return type
DROP FUNCTION IF EXISTS deduct_upload_credit(UUID);

CREATE OR REPLACE FUNCTION deduct_upload_credit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT upload_credits_balance INTO current_balance
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  -- Check if user has credits
  IF current_balance IS NULL OR current_balance <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'You have no credits. Buy more or upgrade to Pro.'
    );
  END IF;
  
  -- Deduct 1 credit
  UPDATE subscriptions
  SET 
    upload_credits_balance = upload_credits_balance - 1,
    upload_credits_used_this_month = COALESCE(upload_credits_used_this_month, 0) + 1
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'remaining_balance', current_balance - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;