-- Add tier_required column to custom_dashboard_widgets
ALTER TABLE custom_dashboard_widgets
ADD COLUMN IF NOT EXISTS tier_required INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN custom_dashboard_widgets.tier_required IS 'Minimum tier level required to access this widget (0-4)';
