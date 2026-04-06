
-- 1. Drop the competing trigger on profiles
DROP TRIGGER IF EXISTS on_profile_created_create_sub_account ON public.profiles;

-- 2. Replace handle_new_user with a clean version (no EXCEPTION swallowing, no trigger competition)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sub_account_id UUID;
BEGIN
  -- 1. Profile
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'country',
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false),
    false,
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms_at')::timestamptz, now()),
    COALESCE((NEW.raw_user_meta_data->>'accepted_privacy_at')::timestamptz, now()),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Main sub-account
  INSERT INTO public.sub_accounts (user_id, name, description, is_active, is_default)
  VALUES (NEW.id, 'Main', 'Main account', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sub_account_id;

  IF v_sub_account_id IS NULL THEN
    SELECT id INTO v_sub_account_id
    FROM public.sub_accounts
    WHERE user_id = NEW.id AND is_default = true
    LIMIT 1;
  END IF;

  -- 3. Subscription
  INSERT INTO public.subscriptions (
    user_id, plan_type, status,
    upload_credits_balance, upload_credits_used_this_month,
    monthly_upload_limit, extra_credits_purchased,
    current_period_start, current_period_end, last_reset_date
  ) VALUES (
    NEW.id, 'free', 'active',
    5, 0, 5, 0,
    now(), now() + interval '1000 years', now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. XP
  INSERT INTO public.user_xp_levels (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_xp_tiers (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  -- 5. Settings & customization (only if sub-account was created)
  IF v_sub_account_id IS NOT NULL THEN
    INSERT INTO public.user_settings (user_id, sub_account_id)
    VALUES (NEW.id, v_sub_account_id)
    ON CONFLICT (sub_account_id) DO NOTHING;

    INSERT INTO public.user_customization_preferences (user_id, sub_account_id, calm_mode_enabled, sound_enabled, animation_speed)
    VALUES (NEW.id, v_sub_account_id, true, false, 'slow')
    ON CONFLICT (sub_account_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Clean orphaned data (profiles that never got a subscription = ghost accounts)
DELETE FROM public.user_customization_preferences
WHERE user_id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);

DELETE FROM public.user_settings
WHERE user_id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);

DELETE FROM public.user_xp_tiers
WHERE user_id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);

DELETE FROM public.user_xp_levels
WHERE user_id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);

DELETE FROM public.sub_accounts
WHERE user_id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);

DELETE FROM public.profiles
WHERE id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE s.user_id IS NULL
);
