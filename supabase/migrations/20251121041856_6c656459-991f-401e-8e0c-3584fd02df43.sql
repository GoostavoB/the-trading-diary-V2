-- Fix existing trades with incorrect ROI values
-- This updates trades where ROI is 0 or NULL but should be calculated

-- Step 1: Update margin for trades where it's missing
UPDATE trades
SET margin = (position_size * entry_price) / COALESCE(NULLIF(leverage, 0), 1)
WHERE (margin IS NULL OR margin = 0)
  AND position_size IS NOT NULL 
  AND position_size > 0
  AND entry_price IS NOT NULL 
  AND entry_price > 0
  AND deleted_at IS NULL;

-- Step 2: Update ROI for all trades with missing or incorrect ROI
UPDATE trades
SET roi = CASE
    WHEN margin > 0 AND pnl IS NOT NULL AND pnl != 'NaN'::numeric THEN
      ROUND(((pnl / margin) * 100)::numeric, 2)
    ELSE 0
  END
WHERE (roi IS NULL OR roi = 0)
  AND margin IS NOT NULL
  AND margin > 0
  AND pnl IS NOT NULL
  AND deleted_at IS NULL;