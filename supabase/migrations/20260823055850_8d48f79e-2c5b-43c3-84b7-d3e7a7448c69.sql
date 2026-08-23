-- 1. friend_invitations: remove public read
DROP POLICY IF EXISTS "Anyone can view invitation by code" ON public.friend_invitations;

-- 2. newsletter_subscriptions: admin-only read
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can view subscriptions"
ON public.newsletter_subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. social_notifications: cannot spoof arbitrary targets
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.social_notifications;
CREATE POLICY "Users can insert notifications for related users"
ON public.social_notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = actor_id
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_follows f
      WHERE f.follower_id = social_notifications.user_id
        AND f.following_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.social_posts p
      WHERE p.user_id = social_notifications.user_id
        AND p.id = social_notifications.post_id
    )
  )
);

-- 4. streak_reminder_log: service_role only management
DROP POLICY IF EXISTS "Service can manage reminder log" ON public.streak_reminder_log;
CREATE POLICY "Service role can manage reminder log"
ON public.streak_reminder_log FOR ALL TO service_role
USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.streak_reminder_log FROM anon, authenticated;

-- 5. user_widget_unlocks: service_role only management
DROP POLICY IF EXISTS "Service can manage widget unlocks" ON public.user_widget_unlocks;
CREATE POLICY "Service role can manage widget unlocks"
ON public.user_widget_unlocks FOR ALL TO service_role
USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.user_widget_unlocks FROM anon, authenticated;

-- 6. widget_tier_requirements: enable RLS, read-only
ALTER TABLE public.widget_tier_requirements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.widget_tier_requirements TO anon, authenticated;
GRANT ALL ON public.widget_tier_requirements TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.widget_tier_requirements FROM anon, authenticated;
DROP POLICY IF EXISTS "Widget tier requirements are readable" ON public.widget_tier_requirements;
CREATE POLICY "Widget tier requirements are readable"
ON public.widget_tier_requirements FOR SELECT TO anon, authenticated
USING (true);

-- 7. storage: remove open read on trade-screenshots
DROP POLICY IF EXISTS "Users can view trade screenshots" ON storage.objects;

-- 8. Fix mutable search_path on all public functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- 9. Revoke direct EXECUTE on SECURITY DEFINER functions from client roles,
--    except those needed by RLS policies or the app.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname NOT IN ('has_role','can_add_account','can_create_custom_metric','increment_broker_usage')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', r.sig);
  END LOOP;
END $$;