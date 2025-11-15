-- Add new columns to trading_goals table for calculation mode feature
ALTER TABLE trading_goals
ADD COLUMN IF NOT EXISTS calculation_mode text NOT NULL DEFAULT 'current_performance',
ADD COLUMN IF NOT EXISTS baseline_date timestamptz,
ADD COLUMN IF NOT EXISTS baseline_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS capital_target_type text,
ADD COLUMN IF NOT EXISTS period_type text NOT NULL DEFAULT 'all_time',
ADD COLUMN IF NOT EXISTS period_start date,
ADD COLUMN IF NOT EXISTS period_end date;

-- Add check constraints
ALTER TABLE trading_goals
ADD CONSTRAINT calculation_mode_check 
  CHECK (calculation_mode IN ('current_performance', 'start_from_scratch'));

ALTER TABLE trading_goals
ADD CONSTRAINT capital_target_type_check 
  CHECK (capital_target_type IS NULL OR capital_target_type IN ('absolute', 'relative'));

ALTER TABLE trading_goals
ADD CONSTRAINT period_type_check 
  CHECK (period_type IN ('all_time', 'custom_range'));

-- Add comment for documentation
COMMENT ON COLUMN trading_goals.calculation_mode IS 'How progress is calculated: current_performance uses all data, start_from_scratch starts from zero';
COMMENT ON COLUMN trading_goals.baseline_date IS 'When start_from_scratch mode begins tracking (typically today when mode is set)';
COMMENT ON COLUMN trading_goals.baseline_value IS 'Starting value when start_from_scratch mode is enabled';
COMMENT ON COLUMN trading_goals.capital_target_type IS 'For capital goals: absolute (fixed amount) or relative (percentage growth)';
COMMENT ON COLUMN trading_goals.period_type IS 'Timeframe scope: all_time or custom_range';
COMMENT ON COLUMN trading_goals.period_start IS 'Start date for custom_range period (null for all_time)';
COMMENT ON COLUMN trading_goals.period_end IS 'End date for custom_range period (uses deadline for all_time)';