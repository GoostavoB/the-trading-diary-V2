ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS signal_source text;

CREATE TABLE IF NOT EXISTS public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_sources TO authenticated;
GRANT ALL ON public.signal_sources TO service_role;

ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own signal sources" ON public.signal_sources;
CREATE POLICY "Users manage own signal sources"
  ON public.signal_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trades_signal_source ON public.trades (user_id, signal_source);