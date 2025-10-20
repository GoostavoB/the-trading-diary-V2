-- Add new widgets to existing user dashboard layouts
UPDATE user_settings
SET 
  layout_json = jsonb_set(
    layout_json,
    '{layout}',
    (
      SELECT COALESCE(jsonb_agg(widget_item), '[]'::jsonb)
      FROM (
        -- Keep all existing widgets from the layout array
        SELECT * FROM jsonb_array_elements(layout_json->'layout')
        
        UNION ALL
        
        -- Add avgPnLPerTrade if missing
        SELECT '{"i": "avgPnLPerTrade", "x": 0, "y": 15, "w": 3, "h": 3, "minW": 3, "minH": 2, "maxH": 4}'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(layout_json->'layout') existing
          WHERE existing->>'i' = 'avgPnLPerTrade'
        )
        
        UNION ALL
        
        -- Add avgPnLPerDay if missing
        SELECT '{"i": "avgPnLPerDay", "x": 3, "y": 15, "w": 3, "h": 3, "minW": 3, "minH": 2, "maxH": 4}'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(layout_json->'layout') existing
          WHERE existing->>'i' = 'avgPnLPerDay'
        )
        
        UNION ALL
        
        -- Add currentROI if missing
        SELECT '{"i": "currentROI", "x": 6, "y": 15, "w": 3, "h": 3, "minW": 3, "minH": 2, "maxH": 4}'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(layout_json->'layout') existing
          WHERE existing->>'i' = 'currentROI'
        )
        
        UNION ALL
        
        -- Add avgROIPerTrade if missing
        SELECT '{"i": "avgROIPerTrade", "x": 9, "y": 15, "w": 3, "h": 3, "minW": 3, "minH": 2, "maxH": 4}'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(layout_json->'layout') existing
          WHERE existing->>'i' = 'avgROIPerTrade'
        )
        
        UNION ALL
        
        -- Add capitalGrowth if missing
        SELECT '{"i": "capitalGrowth", "x": 0, "y": 18, "w": 6, "h": 4, "minW": 4, "minH": 3, "maxH": 6}'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(layout_json->'layout') existing
          WHERE existing->>'i' = 'capitalGrowth'
        )
      ) as widget_item
    )
  ),
  updated_at = now()
WHERE layout_json IS NOT NULL 
  AND layout_json->'layout' IS NOT NULL
  AND jsonb_typeof(layout_json->'layout') = 'array';