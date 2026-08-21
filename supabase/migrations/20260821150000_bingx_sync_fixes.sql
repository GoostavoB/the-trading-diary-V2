-- ────────────────────────────────────────────────────────────────────────────
-- Exchange API sync fixes (see docs/EXCHANGE_API_SYNC_FIXES.md)
--
-- 1) exchange_connections.exchange_name CHECK constraint only allowed 4 of the
--    11 exchanges ExchangeService.ts actually supports. Widen it.
-- 2) Add sync_start_date: a per-connection floor so "only import trades from
--    date X forward" is remembered on every future sync, not re-specified
--    per request. Editable after creation (user can move it later).
-- 3) Add market_types: which BingX market segments to pull (spot, swap, or
--    both). Defaults to both per product decision (2026-08-21).
-- ────────────────────────────────────────────────────────────────────────────

-- 1) Widen exchange_name CHECK constraint to match ExchangeService.SUPPORTED_EXCHANGES
ALTER TABLE public.exchange_connections
  DROP CONSTRAINT IF EXISTS exchange_connections_exchange_name_check;

ALTER TABLE public.exchange_connections
  ADD CONSTRAINT exchange_connections_exchange_name_check
  CHECK (exchange_name IN (
    'bingx', 'binance', 'bybit', 'coinbase', 'kraken',
    'bitfinex', 'mexc', 'kucoin', 'okx', 'gateio', 'bitstamp'
  ));

-- 2) sync_start_date — hard floor for trade imports on this connection.
ALTER TABLE public.exchange_connections
  ADD COLUMN IF NOT EXISTS sync_start_date timestamptz;

COMMENT ON COLUMN public.exchange_connections.sync_start_date IS
  'User-chosen floor for trade imports on this connection. Every sync (manual or scheduled) must clamp its startTime to max(requested startDate, sync_start_date). Never import trades before this date, regardless of what the caller passes. Editable after connection creation.';

-- 3) market_types — which BingX (and future multi-market exchange) segments to sync.
ALTER TABLE public.exchange_connections
  ADD COLUMN IF NOT EXISTS market_types text[] NOT NULL DEFAULT ARRAY['spot', 'swap'];

COMMENT ON COLUMN public.exchange_connections.market_types IS
  'Which market segments to fetch trades from on this connection. spot = spot market, swap = perpetual futures (USDT-M). Defaults to both.';

-- 4) exchange_pending_trades / trades need to carry which market a trade came
--    from so it is not miscategorized. trades.trade_type already exists with
--    CHECK (trade_type IN (''spot'', ''futures'', ''dex'')) — swap/perp trades
--    must be written as trade_type = 'futures', spot trades as 'spot'.
--    No schema change needed here, just documenting the mapping the edge
--    function must follow (spot -> 'spot', swap -> 'futures').
