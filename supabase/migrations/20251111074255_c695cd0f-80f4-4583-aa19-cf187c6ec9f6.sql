-- Add trade_station_layout_json column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS trade_station_layout_json jsonb;