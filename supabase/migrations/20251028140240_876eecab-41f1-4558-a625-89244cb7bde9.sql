-- Reset user XP to fresh start (user requested full XP wipe)

-- Reset XP levels to starting state
UPDATE user_xp_levels 
SET 
  current_xp = 0,
  current_level = 1,
  total_xp_earned = 0,
  level_up_count = 0,
  last_xp_earned_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'e019b392-2eb3-4b82-8e92-bbb8f502560b';

-- Reset XP tiers with proper default cap (750 for Bronze/Tier 0)
UPDATE user_xp_tiers 
SET 
  daily_xp_earned = 0,
  current_tier = 0,
  daily_xp_cap = 750,
  last_reset_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'e019b392-2eb3-4b82-8e92-bbb8f502560b';