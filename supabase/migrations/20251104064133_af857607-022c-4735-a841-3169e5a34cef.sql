-- Phase 1: Foundation - Database Schema Changes

-- 1. Add activation tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_upload_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS activation_source TEXT DEFAULT 'organic';

-- 2. Create reward_events table for tracking variable rewards (future use)
CREATE TABLE IF NOT EXISTS reward_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'xp_boost', 'credit_bonus', 'cosmetic_unlock'
  reward_value JSONB NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Enable RLS on reward_events
ALTER TABLE reward_events ENABLE ROW LEVEL SECURITY;

-- Policies for reward_events
CREATE POLICY "Users can view their own rewards"
  ON reward_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON reward_events FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Create trigger to track first upload
CREATE OR REPLACE FUNCTION track_first_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if first_upload_at is null (first upload)
  UPDATE profiles
  SET first_upload_at = NEW.created_at
  WHERE id = NEW.user_id AND first_upload_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_first_trade_upload ON trades;
CREATE TRIGGER on_first_trade_upload
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION track_first_upload();

-- 4. Update handle_new_user to auto-assign Free plan with 5 credits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_country TEXT;
  v_marketing_consent BOOLEAN;
BEGIN
  -- Extract metadata
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_country := NEW.raw_user_meta_data->>'country';
  v_marketing_consent := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false);

  -- Create profile
  INSERT INTO public.profiles (
    id,
    full_name,
    country,
    marketing_consent,
    onboarding_completed
  ) VALUES (
    NEW.id,
    v_full_name,
    v_country,
    v_marketing_consent,
    false  -- Will be set to true after onboarding
  );

  -- Auto-assign Free subscription with 5 credits
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    status,
    upload_credits_total,
    upload_credits_used,
    stripe_subscription_id,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'active',
    5,  -- 5 free credits
    0,
    'free_tier_' || NEW.id,  -- Placeholder for free tier
    now(),
    now() + interval '1000 years'  -- Never expires for free tier
  );

  -- Initialize XP system
  INSERT INTO public.user_xp_levels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_xp_tiers (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize customization preferences (with mobile-first defaults)
  INSERT INTO public.user_customization_preferences (
    user_id,
    calm_mode_enabled,
    sound_enabled,
    animation_speed
  ) VALUES (
    NEW.id,
    true,  -- Default ON for mobile-first approach
    false, -- Sound off by default
    'slow' -- Slow animations by default
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_first_upload ON profiles(first_upload_at);
CREATE INDEX IF NOT EXISTS idx_reward_events_user ON reward_events(user_id, triggered_at);