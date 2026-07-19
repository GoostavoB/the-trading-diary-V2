-- Depósitos/saques de baleias (≥$1M) nas grandes corretoras, dados estilo
-- Arkham via Apify. Escrita só pela função whale-flows-sync (service role).
-- Depósito em corretora = possível distribuição; saque = acumulação.

CREATE TABLE IF NOT EXISTS public.whale_flows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id       text NOT NULL UNIQUE,
  symbol      text NOT NULL DEFAULT 'BTC',
  direction   text NOT NULL CHECK (direction IN ('in', 'out')),
  exchange    text NOT NULL,
  amount      numeric NOT NULL,
  usd         numeric NOT NULL,
  happened_at timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whale_flows ENABLE ROW LEVEL SECURITY;
