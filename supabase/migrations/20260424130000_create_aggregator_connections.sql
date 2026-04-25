-- ────────────────────────────────────────────────────────────────────────────
-- 1-click exchange connections via SnapTrade (and future aggregators).
--
-- A user can have multiple connections (e.g., Binance + Coinbase + Bybit).
-- We store the SnapTrade userSecret encrypted (Supabase encrypts at rest by
-- default on managed instances). RLS ensures users can only see their own.
-- ────────────────────────────────────────────────────────────────────────────

-- Enum of supported aggregator providers (extend as needed)
DO $$ BEGIN
  CREATE TYPE aggregator_provider AS ENUM ('snaptrade', 'vezgo', 'mesh');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enum of connection lifecycle states
DO $$ BEGIN
  CREATE TYPE aggregator_connection_status AS ENUM (
    'pending',          -- user kicked off connect flow but didn't finish
    'active',           -- connection healthy
    'syncing',          -- in middle of historical pull
    'requires_reauth',  -- token expired, user must reauthenticate
    'disconnected',     -- user removed it
    'error'             -- last sync failed
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 1) Per-user provider account (SnapTrade requires a userId+userSecret pair)
CREATE TABLE IF NOT EXISTS public.aggregator_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        aggregator_provider NOT NULL,

  -- SnapTrade: provider_user_id == user_id (uuid as string), provider_user_secret == returned secret
  provider_user_id     text NOT NULL,
  provider_user_secret text NOT NULL,  -- encrypted at rest by Supabase

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_aggregator_users_user
  ON public.aggregator_users (user_id);

-- ── 2) Each broker connection (one user can have many)
CREATE TABLE IF NOT EXISTS public.aggregator_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        aggregator_provider NOT NULL DEFAULT 'snaptrade',

  -- SnapTrade authorization id
  connection_id   text NOT NULL,
  broker_slug     text NOT NULL,         -- e.g., 'BINANCE', 'COINBASE', 'KRAKEN'
  broker_label    text,                  -- human display name

  status          aggregator_connection_status NOT NULL DEFAULT 'pending',
  last_synced_at  timestamptz,
  last_error      text,
  account_count   int NOT NULL DEFAULT 0,
  trade_count     int NOT NULL DEFAULT 0,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, provider, connection_id)
);

CREATE INDEX IF NOT EXISTS idx_aggregator_connections_user
  ON public.aggregator_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_aggregator_connections_status
  ON public.aggregator_connections (status);

-- ── 3) Trade-import dedupe table — maps aggregator trade IDs to our trades
-- Prevents re-importing the same trade on subsequent syncs.
CREATE TABLE IF NOT EXISTS public.aggregator_trade_map (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        aggregator_provider NOT NULL,
  provider_trade_id text NOT NULL,       -- e.g., SnapTrade activity id
  trade_id        uuid REFERENCES public.trades(id) ON DELETE CASCADE,
  imported_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, provider, provider_trade_id)
);

CREATE INDEX IF NOT EXISTS idx_aggregator_trade_map_user
  ON public.aggregator_trade_map (user_id);

-- ── 4) updated_at trigger (reuses existing helper)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aggregator_users_updated_at ON public.aggregator_users;
CREATE TRIGGER trg_aggregator_users_updated_at
  BEFORE UPDATE ON public.aggregator_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_aggregator_connections_updated_at ON public.aggregator_connections;
CREATE TRIGGER trg_aggregator_connections_updated_at
  BEFORE UPDATE ON public.aggregator_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5) RLS policies
ALTER TABLE public.aggregator_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_trade_map ENABLE ROW LEVEL SECURITY;

-- aggregator_users: only owner can SELECT; INSERT/UPDATE done by edge functions (service role)
DROP POLICY IF EXISTS "aggregator_users_select_own" ON public.aggregator_users;
CREATE POLICY "aggregator_users_select_own"
  ON public.aggregator_users FOR SELECT
  USING (auth.uid() = user_id);

-- aggregator_connections: owner can SELECT, edge functions write via service role
DROP POLICY IF EXISTS "aggregator_connections_select_own" ON public.aggregator_connections;
CREATE POLICY "aggregator_connections_select_own"
  ON public.aggregator_connections FOR SELECT
  USING (auth.uid() = user_id);

-- aggregator_trade_map: owner SELECT, service role writes
DROP POLICY IF EXISTS "aggregator_trade_map_select_own" ON public.aggregator_trade_map;
CREATE POLICY "aggregator_trade_map_select_own"
  ON public.aggregator_trade_map FOR SELECT
  USING (auth.uid() = user_id);

-- (Service role bypasses RLS automatically; no need for INSERT/UPDATE policies
--  since user-facing writes always go through edge functions that use the
--  SUPABASE_SERVICE_ROLE_KEY.)

COMMENT ON TABLE public.aggregator_users IS
  'SnapTrade/Vezgo/Mesh per-user provider account (stores opaque user_secret).';
COMMENT ON TABLE public.aggregator_connections IS
  '1-click broker connections; one row per linked exchange account.';
COMMENT ON TABLE public.aggregator_trade_map IS
  'Dedupe map between aggregator trade IDs and local trades.id.';
