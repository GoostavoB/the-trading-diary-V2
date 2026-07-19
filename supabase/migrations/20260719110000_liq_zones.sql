-- Zonas densas de liquidação (destiladas do heatmap CoinGlass via Apify).
-- Escrita só pela função liquidation-heatmap-sync (service role).

CREATE TABLE IF NOT EXISTS public.liq_zones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol      text NOT NULL,
  side        text NOT NULL CHECK (side IN ('above', 'below')),
  price       numeric NOT NULL,
  liq_usd     numeric NOT NULL,
  pct_away    numeric,
  ref_price   numeric,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.liq_zones ENABLE ROW LEVEL SECURITY;
