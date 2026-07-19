-- Fluxos diários dos ETFs spot de cripto (BTC/ETH/SOL), sync via Apify
-- (actor crypto-etf-flow-tracker, dados SoSoValue). Escrita só pela função
-- etf-flows-sync (service role); lido pelo mentor em toda análise.

CREATE TABLE IF NOT EXISTS public.etf_flows (
  etf_type              text NOT NULL,
  flow_date             date NOT NULL,
  net_inflow_usd        numeric NOT NULL,
  value_traded_usd      numeric,
  total_net_assets_usd  numeric,
  cum_net_inflow_usd    numeric,
  aum_change_pct        numeric,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (etf_type, flow_date)
);

ALTER TABLE public.etf_flows ENABLE ROW LEVEL SECURITY;
