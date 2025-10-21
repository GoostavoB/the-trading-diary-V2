-- Add new columns for enhanced fee tracking
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS slippage_cost numeric,
ADD COLUMN IF NOT EXISTS spread_cost numeric,
ADD COLUMN IF NOT EXISTS trade_type text DEFAULT 'futures';

-- Add check constraint for trade_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trades_trade_type_check'
  ) THEN
    ALTER TABLE trades 
    ADD CONSTRAINT trades_trade_type_check 
    CHECK (trade_type IN ('spot', 'futures', 'dex'));
  END IF;
END $$;

-- Create index for faster fee queries
CREATE INDEX IF NOT EXISTS idx_trades_broker_fees ON trades(broker, trading_fee, funding_fee);

-- Create index for trade type queries
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON trades(trade_type);

-- Add comments for documentation
COMMENT ON COLUMN trades.slippage_cost IS 'Cost incurred due to slippage during trade execution';
COMMENT ON COLUMN trades.spread_cost IS 'Cost incurred due to bid-ask spread';
COMMENT ON COLUMN trades.trade_type IS 'Type of trade: spot, futures, or dex';