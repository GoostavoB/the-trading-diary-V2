CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    onboarding_completed,
    accepted_terms_at,
    accepted_privacy_at,
    provider
  ) VALUES (
    NEW.id,
    v_full_name,
    v_country,
    v_marketing_consent,
    false,
    CASE WHEN NEW.raw_user_meta_data->>'accepted_terms_at' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'accepted_terms_at')::timestamptz
         ELSE now() END,
    CASE WHEN NEW.raw_user_meta_data->>'accepted_privacy_at' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'accepted_privacy_at')::timestamptz
         ELSE now() END,
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  );

  -- Auto-assign Free subscription with correct columns
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    status,
    upload_credits_balance,
    upload_credits_used_this_month,
    monthly_upload_limit,
    extra_credits_purchased,
    current_period_start,
    current_period_end,
    last_reset_date
  ) VALUES (
    NEW.id,
    'free',
    'active',
    5,
    0,
    5,
    0,
    now(),
    now() + interval '1000 years',
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

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

  -- Initialize customization preferences
  INSERT INTO public.user_customization_preferences (
    user_id,
    calm_mode_enabled,
    sound_enabled,
    animation_speed
  ) VALUES (
    NEW.id,
    true,
    false,
    'slow'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;