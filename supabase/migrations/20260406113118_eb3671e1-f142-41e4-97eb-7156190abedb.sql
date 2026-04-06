
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name TEXT;
  v_country TEXT;
  v_marketing_consent BOOLEAN;
  v_sub_account_id UUID;
BEGIN
  -- Extract metadata
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_country := NEW.raw_user_meta_data->>'country';
  v_marketing_consent := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false);

  -- 1. Create profile
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
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create main sub-account directly (don't rely on profile trigger)
  INSERT INTO public.sub_accounts (user_id, name, description, is_active, is_default)
  VALUES (NEW.id, 'Main', 'Main account', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sub_account_id;

  -- If sub-account already existed, fetch it
  IF v_sub_account_id IS NULL THEN
    SELECT id INTO v_sub_account_id
    FROM public.sub_accounts
    WHERE user_id = NEW.id AND is_default = true
    LIMIT 1;
  END IF;

  -- Fallback: get any sub-account for this user
  IF v_sub_account_id IS NULL THEN
    SELECT id INTO v_sub_account_id
    FROM public.sub_accounts
    WHERE user_id = NEW.id
    LIMIT 1;
  END IF;

  -- 3. Create subscription
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

  -- 4. Initialize XP system
  INSERT INTO public.user_xp_levels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_xp_tiers (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 5. Initialize user settings (requires sub_account_id)
  IF v_sub_account_id IS NOT NULL THEN
    INSERT INTO public.user_settings (user_id, sub_account_id)
    VALUES (NEW.id, v_sub_account_id)
    ON CONFLICT (sub_account_id) DO NOTHING;

    -- 6. Initialize customization preferences (requires sub_account_id)
    INSERT INTO public.user_customization_preferences (
      user_id,
      sub_account_id,
      calm_mode_enabled,
      sound_enabled,
      animation_speed
    ) VALUES (
      NEW.id,
      v_sub_account_id,
      true,
      false,
      'slow'
    )
    ON CONFLICT (sub_account_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;
