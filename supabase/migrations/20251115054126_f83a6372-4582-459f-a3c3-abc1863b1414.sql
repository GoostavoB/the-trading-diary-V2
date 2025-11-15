-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS get_trading_analytics(uuid, timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION get_trading_analytics(
  user_uuid UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_trades BIGINT,
  winning_trades BIGINT,
  losing_trades BIGINT,
  win_rate NUMERIC,
  total_pnl NUMERIC,
  avg_win NUMERIC,
  avg_loss NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_trades,
    COUNT(*) FILTER (WHERE COALESCE(t.pnl, t.profit_loss, 0) > 0)::BIGINT as winning_trades,
    COUNT(*) FILTER (WHERE COALESCE(t.pnl, t.profit_loss, 0) < 0)::BIGINT as losing_trades,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE COALESCE(t.pnl, t.profit_loss, 0) > 0)::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0 
    END as win_rate,
    COALESCE(SUM(COALESCE(t.pnl, t.profit_loss, 0)), 0) as total_pnl,
    COALESCE(AVG(COALESCE(t.pnl, t.profit_loss, 0)) FILTER (WHERE COALESCE(t.pnl, t.profit_loss, 0) > 0), 0) as avg_win,
    COALESCE(AVG(COALESCE(t.pnl, t.profit_loss, 0)) FILTER (WHERE COALESCE(t.pnl, t.profit_loss, 0) < 0), 0) as avg_loss
  FROM trades t
  WHERE t.user_id = user_uuid
    AND (start_date IS NULL OR t.trade_date >= start_date)
    AND (end_date IS NULL OR t.trade_date <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;