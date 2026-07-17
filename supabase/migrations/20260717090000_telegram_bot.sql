-- Telegram bot (AI Trading Mentor) — P0 schema
-- Spec: AI_TRADING_MENTOR_BOT_SPEC.md §6

-- ── 1) Account linking ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id           bigint NOT NULL UNIQUE,
  telegram_username text,
  timezone          text DEFAULT 'UTC',
  locale            text DEFAULT 'en',
  linked_at         timestamptz NOT NULL DEFAULT now(),
  last_active_at    timestamptz,
  UNIQUE (user_id)
);
COMMENT ON TABLE public.telegram_users IS 'Links a Telegram chat_id to an app user for the mentor bot.';

CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token       text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone    text DEFAULT 'UTC',
  locale      text DEFAULT 'en',
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at     timestamptz
);
COMMENT ON TABLE public.telegram_link_tokens IS 'One-time deep-link tokens for /start; expire in 15 minutes.';

-- ── 2) User preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_preferences (
  user_id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_digest               boolean NOT NULL DEFAULT true,
  daily_digest_hour_local    int NOT NULL DEFAULT 22 CHECK (daily_digest_hour_local BETWEEN 0 AND 23),
  weekly_digest              boolean NOT NULL DEFAULT true,
  weekly_digest_day          int NOT NULL DEFAULT 0 CHECK (weekly_digest_day BETWEEN 0 AND 6),
  alert_on_trade_close       boolean NOT NULL DEFAULT true,
  alert_on_big_loss          boolean NOT NULL DEFAULT true,
  alert_on_streak            boolean NOT NULL DEFAULT true,
  alert_on_rule_violation    boolean NOT NULL DEFAULT true,
  alert_on_daily_loss_lock   boolean NOT NULL DEFAULT true,
  mute_until                 timestamptz,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- ── 3) Message log (dedup + rate limit + debugging) ─────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_message_log (
  id             bigserial PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  chat_id        bigint,
  direction      text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type   text NOT NULL,
  template_name  text,
  -- Dedup key, e.g. 'daily:2026-07-17' or 'trade:<trade_id>' — prevents double sends
  ref_id         text,
  content        text,
  telegram_message_id bigint,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_telegram_message_log_user
  ON public.telegram_message_log(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_message_log_dedup
  ON public.telegram_message_log(user_id, template_name, ref_id)
  WHERE ref_id IS NOT NULL AND direction = 'outbound';

-- ── 4) RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_users_own_select" ON public.telegram_users
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "telegram_users_own_delete" ON public.telegram_users
  FOR DELETE USING (auth.uid() = user_id);  -- "Disconnect" in Settings

ALTER TABLE public.telegram_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_prefs_own_select" ON public.telegram_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "telegram_prefs_own_update" ON public.telegram_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "telegram_prefs_own_insert" ON public.telegram_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_link_tokens_own" ON public.telegram_link_tokens
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.telegram_message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_log_own" ON public.telegram_message_log
  FOR SELECT USING (auth.uid() = user_id);

-- (Service role bypasses RLS for edge-function writes.)
