# Phase 1 XP System - Complete Testing Guide

## Overview
This guide will help you thoroughly test all Phase 1 features before moving to Phase 2 (Monetization & Social Layer).

---

## 1. XP Awarding Across All Activity Types

### A. Login & Streak Mechanics
**Location**: Automatic on dashboard load  
**Hook**: `useRetentionMechanics`

**Test Cases**:
1. **Daily Login**
   - Action: Sign in after 24+ hours
   - Expected: Award login XP based on streak (50-100 XP)
   - Verify: Toast notification, XP increase, analytics event `daily_login`

2. **Comeback Login** (after 3+ days away)
   - Action: Sign in after 3+ days inactive
   - Expected: "Welcome back! Fresh start bonus" (50 XP)
   - Verify: Streak resets to 1, `comeback_login` event

3. **Login Milestone** (7, 14, 30, 100 days)
   - Action: Reach milestone login streak
   - Expected: Bonus XP (100-1000 XP)
   - Verify: `streak_milestone` event, special toast

### B. Trade Logging
**Location**: When adding/uploading trades  
**Hook**: `useTradeXPRewards`

**Test Cases**:
1. **Base Trade Completion** (10 XP)
   - Action: Log any trade
   - Expected: "+10 XP" toast
   - Verify: `trade_completed` event

2. **Winning Trade Bonus** (up to 50 XP)
   - Action: Log a profitable trade
   - Expected: Extra XP based on profit (1 XP per $10 profit, max 50)
   - Formula: `Math.min(Math.floor(pnl / 10), 50)`
   - Verify: `winning_trade` event

3. **Losing Trade Participation** (3 XP)
   - Action: Log a losing trade
   - Expected: "+3 XP Learning experience"
   - Verify: `trade_participation` event

4. **Excellent ROI** (20 XP)
   - Action: Log trade with ROI > 5%
   - Expected: "+20 XP Excellent ROI"
   - Verify: `excellent_roi` event

5. **Good ROI** (10 XP)
   - Action: Log trade with ROI > 3% (but ≤ 5%)
   - Expected: "+10 XP Good ROI"
   - Verify: `good_roi` event

6. **Detailed Notes** (5 XP)
   - Action: Add notes > 50 characters
   - Expected: "+5 XP Added detailed trade notes"
   - Verify: `detailed_notes` event

7. **Trade Screenshot** (5 XP)
   - Action: Upload screenshot with trade
   - Expected: "+5 XP Added trade screenshot"
   - Verify: `trade_screenshot` event

8. **Setup Tagged** (5 XP)
   - Action: Add a setup tag to trade
   - Expected: "+5 XP Setup: [name]"
   - Verify: `setup_tagged` event

9. **Trade Streak Bonus**
   - Action: Log trades on consecutive days
   - Expected: Higher XP multiplier (1x → 3x over 21 days)
   - Formula: `150 * (1 + 0.10 * (streak - 1))`
   - Verify: `trade_logged` event with `Day N trade logged`

10. **Trade Milestone** (7, 14, 30, 100 day streaks)
    - Action: Reach milestone trade streak
    - Expected: Bonus XP (100-1000 XP)
    - Verify: `streak_milestone` event

11. **Combo Bonus** (500 XP)
    - Action: Maintain both login AND trade streaks for 7+ days
    - Expected: "+500 XP Maintained both streaks for 7+ days!"
    - Verify: `combo_bonus` event, only awarded once per 7 days

### C. Daily Challenges
**Location**: ProgressAnalytics page  
**Hook**: `useDailyChallenges`

**Test Cases**:
1. **Complete Challenge**
   - Action: Complete a daily challenge
   - Expected: Challenge XP reward (50-200 XP)
   - Verify: `challenge_completed` event, progress bar update

### D. Mystery Rewards
**Location**: When opening mystery boxes  
**Hook**: `useMysteryRewards`

**Test Cases**:
1. **XP Boost Reward**
   - Action: Open mystery box with XP reward
   - Expected: Bonus XP added (varies)
   - Verify: `mystery_reward` event

### E. Dev Test Button
**Location**: Bottom-left on dashboard  
**Component**: `XPTestButton`

**Test Cases**:
1. **Add 100 XP**
   - Action: Click "+100 XP (Test Only)"
   - Expected: Exactly +100 XP (no streak multiplier)
   - Verify: `test` activity type, DailyMissionBar updates immediately

2. **Reset Daily XP**
   - Action: Click "Reset Daily XP (Dev)"
   - Expected: `daily_xp_earned` → 0, bar resets to "0 / 750 XP"
   - Verify: Both XP and tier queries invalidated

---

## 2. Daily XP Cap Enforcement

### Location
**Hook**: `useXPSystem.addXP()` (lines 106-135)

### Test Cases

1. **Tier 0 (Bronze) - 750 XP Cap**
   - Setup: Fresh account (0 total XP)
   - Action: Award XP until cap hit
   - Expected: 
     - At 750: Toast "Daily XP limit reached! Upgrade to Pro/Elite"
     - DailyMissionBar shows "Daily limit reached!" in red
     - Further XP attempts blocked
   - Verify: `daily_xp_cap_reached` analytics event

2. **Partial XP Award**
   - Setup: 700/750 daily XP earned
   - Action: Award 100 XP
   - Expected: Only 50 XP awarded, toast "XP capped: Only 50 XP remaining today"
   - Verify: `daily_xp_earned` = 750, not 800

3. **Upgrade to Higher Tier**
   - Setup: Reach Tier 1 (1000 total XP)
   - Expected: Daily cap increases to 2000 XP
   - Verify: `getDailyXPCap(tierLevel)` recalculates correctly

4. **Midnight Reset**
   - Setup: Hit daily cap (750/750)
   - Action: Wait for midnight UTC OR manually test with SQL:
     ```sql
     -- Simulate midnight reset
     UPDATE user_xp_tiers 
     SET last_reset_at = NOW() - INTERVAL '2 days'
     WHERE user_id = '[your-id]';
     
     -- Then award XP to trigger auto-reset
     -- The system will detect old last_reset_at and auto-reset
     ```
   - Expected: 
     - Auto-reset logic detects old date
     - `daily_xp_earned` → 0 
     - Console log: "[XPSystem] Auto-resetting daily XP (missed cron)"
     - Can earn XP again
   - Verify: `last_reset_at` timestamp updated to today

5. **Cron Job Verification**
   - Query cron status:
     ```sql
     SELECT jobid, schedule, command, active 
     FROM cron.job 
     WHERE jobname = 'reset-daily-xp-caps';
     ```
   - Expected: 
     - `schedule`: '0 0 * * *' (midnight UTC)
     - `active`: true
     - Function: `public.reset_daily_xp_caps()`

6. **Edge Case: Missed Cron**
   - Setup: Set `last_reset_at` to 2 days ago
   - Action: Award any XP
   - Expected: System auto-resets before awarding XP
   - Verify: No data loss, user gets fresh daily cap

5. **Elite/Unlimited Tier**
   - Setup: Reach Tier 4 (15000 total XP)
   - Expected: DailyMissionBar shows "Unlimited XP" with gradient bar
   - Verify: No cap enforced, no upgrade prompt shown

---

## 3. Tier Progression and Unlocks

### Tier Thresholds
- **Tier 0 (Bronze)**: 0 - 999 XP (750 daily cap)
- **Tier 1 (Silver)**: 1000 - 2999 XP (2000 daily cap)
- **Tier 2 (Gold)**: 3000 - 6999 XP (5000 daily cap)
- **Tier 3 (Platinum)**: 7000 - 14999 XP (10000 daily cap)
- **Tier 4 (Diamond)**: 15000+ XP (Unlimited)

### Test Cases

1. **Tier Unlock Detection**
   - Action: Cross tier threshold (e.g., 999 → 1000 XP)
   - Expected: 
     - Toast: "🎉 Tier Unlocked: Silver!"
     - Description: "You've reached Tier 1!"
   - Verify: `tier_unlocked` analytics event with `previousTier` and new `tier`

2. **Tier Progress Bar**
   - Location: DailyMissionBar shows tier name in badge
   - Action: View dashboard at different XP levels
   - Expected: Badge text updates: "(Bronze)" → "(Silver)" → "(Gold)"
   - Verify: `getTierName(tierLevel)` returns correct name

3. **Daily XP Cap Increases**
   - Action: Cross each tier threshold
   - Expected Caps:
     - Bronze: 750
     - Silver: 2000
     - Gold: 5000
     - Platinum: 10000
     - Diamond: Unlimited
   - Verify: `getDailyXPCap(tierLevel)` matches expected

4. **Legacy Tier Mapping**
   - Hook: `useUserTier` (lines 79-87)
   - Logic:
     - Elite subscription → `tier: 'elite'`
     - Pro subscription → `tier: 'pro'`
     - Tier 2+ (3000+ XP) → `tier: 'basic'`
     - Otherwise → `tier: 'free'`
   - Verify: Backwards compatibility with subscription checks

---

## 4. Psychology Feature XP Rewards

### A. Emotional State Logging
**Location**: Psychology page > Log State tab  
**Hook**: `useEmotionalLogXP`

**XP Rewards**:
- Base: 5 XP for logging any emotional state
- Bonus: +5 XP for notes ≥ 20 characters
- Bonus: +5 XP for extreme intensity (1-2 or 9-10)
- Bonus: +3 XP for selecting ≥3 trading conditions
- Daily Cap: 3 emotional logs per day (max 54 XP/day)

**Test Cases**:
1. **Basic Emotional Log** (5 XP)
   - Action: Log emotional state with intensity, no notes
   - Expected: "+5 XP Emotional state logged"
   - Verify: `emotional_log_created` event

2. **Detailed Emotional Log** (15 XP)
   - Action: Log with notes ≥20 chars + extreme intensity (1 or 10)
   - Expected: "+15 XP Emotional state logged (detailed notes, extreme emotion)"
   - Verify: `emotional_log_with_notes` and `extreme_emotion_logged` events

3. **Complete Emotional Log** (18 XP)
   - Action: Log with notes + extreme intensity + ≥3 conditions
   - Expected: "+18 XP Emotional state logged (detailed notes, extreme emotion, detailed conditions)"
   - Verify: All bonus analytics events fire

4. **Daily Cap Enforcement**
   - Action: Log 4th emotional state in same day
   - Expected: No XP awarded, console log "Daily cap reached (3 logs)"
   - Verify: `emotional_log_daily_cap_reached` event
   - Check: `user_xp_tiers.psychology_logs_today` = 3

5. **Midnight Reset**
   - Setup: Hit daily cap (3 logs)
   - Action: Wait for midnight UTC or simulate with SQL
   - Expected: Counter resets to 0, can earn XP again
   - Verify: `psychology_logs_today` = 0

### B. Trading Journal Entries
**Location**: Journal page / Trade detail > Journal tab  
**Component**: `RichTradingJournal`

**XP Rewards**:
- Base: 20 XP for creating entry
- Bonus: +10 XP for content ≥ 50 characters
- Bonus: +5 XP for "What Went Well" ≥ 30 characters
- Bonus: +5 XP for "What To Improve" ≥ 30 characters
- Bonus: +5 XP for "Lessons Learned" ≥ 30 characters
- Bonus: +5 XP for ≥3 tags
- Bonus: +5 XP for linking to a trade
- Daily Cap: 2 journal entries per day (max 110 XP/day)

**Test Cases**:
1. **Basic Journal Entry** (20 XP)
   - Action: Create entry with title only
   - Expected: "+20 XP Journal entry created"
   - Verify: `journal_entry_created` event

2. **Detailed Journal Entry** (30 XP)
   - Action: Create entry with content ≥50 characters
   - Expected: "+30 XP Journal entry created (detailed entry)"
   - Verify: `is_detailed: true` in analytics

3. **Complete Journal Entry** (55 XP)
   - Action: Fill all sections (content, reflections, tags, linked trade)
   - Expected: "+55 XP Journal entry created (detailed entry, what went well, improvements noted, lessons learned, tags added, trade linked)"
   - Verify: `journal_entry_detailed` event with all bonus_reasons

4. **Daily Cap Enforcement**
   - Action: Create 3rd journal entry in same day
   - Expected: Entry saved but no XP awarded
   - Verify: `journal_entry_daily_cap_reached` event
   - Check: `user_xp_tiers.journal_entries_today` = 2

5. **Update Existing Entry**
   - Action: Edit and save existing journal entry
   - Expected: Entry saved but no XP awarded (only new entries)
   - Verify: No XP analytics events fired

### C. Combined Daily Potential
**Psychology Features Combined**: 164 XP/day
- Emotional Logs: 3 × 18 XP = 54 XP
- Journal Entries: 2 × 55 XP = 110 XP

---

## 5. Emotion Tagging and Analytics Events

### Emotion Tags Available
**File**: `src/constants/tradingTags.ts`

**Emotions**:
- Positive: Confident, Calm, Patient, Disciplined
- Negative: Fearful, Anxious, Stressed, Frustrated
- Warning: Greedy, FOMO, Revenge Trading, Overconfident, Impulsive, Excited, Euphoric

### Test Cases

1. **Add Emotion Tags to Trade**
   - Location: TradeHistory > Edit Trade > TradeTagSelector
   - Action: Select multiple emotion tags
   - Expected: Tags saved in `trades.emotion_tags` array
   - Verify: Trade detail shows emotion badges with correct colors

2. **Emotion Performance Correlation**
   - Location: EmotionPerformanceCorrelation component
   - Action: Log trades with different emotion tags
   - Expected: Chart shows PnL correlation per emotion
   - Verify: Query filters `emotion_tags IS NOT NULL`

3. **Custom Emotion Tags**
   - Action: Add custom emotion via "+" button in tag selector
   - Expected: Tag saved to `custom_tags` table with `tag_type: 'emotion'`
   - Verify: Custom tag appears in dropdown alongside predefined tags

4. **Analytics Events Tracking**
   - File: `src/utils/analytics.ts`
   - Key Events:
     - `xp_awarded`: Tracks every XP gain
     - `tier_unlocked`: When crossing tier thresholds
     - `daily_xp_cap_reached`: When hitting daily limit
     - `tier_3_preview_opened`: When 2K XP milestone modal shows
     - `daily_login`: Login streak tracking
     - `trade_logged`: Trade streak tracking
   - Verify: PostHog dashboard shows these events with correct properties

---

## 5. Tier 3 Preview Modal Trigger

### Location
**Component**: `src/components/tier/Tier3PreviewModal.tsx`  
**Hook**: `useXPSystem` (lines 238-274)  
**Trigger**: Dashboard automatically shows modal

### Trigger Logic
```typescript
// Triggers at 2000 total XP (crossing into Tier 1)
if (newTotalXP >= 2000 && oldTotalXP < 2000) {
  // Check if user already saw it
  const existingPreview = await supabase
    .from('tier_preview_unlocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('tier_previewed', 3)
    .single();

  if (!existingPreview) {
    setShowTier3Preview(true); // Show modal
    // Record in database to prevent re-showing
  }
}
```

### Test Cases

1. **First Time Crossing 2K XP**
   - Setup: User at 1950 total XP
   - Action: Award +100 XP (crosses 2000 threshold)
   - Expected:
     - Modal appears with "Tier 3 Preview"
     - Shows locked widgets: "AI Trade Insights", "Advanced Metrics", "Risk/Reward Heatmap"
     - "See Upgrade Options" button navigates to pricing
   - Verify: 
     - `tier_3_preview_opened` analytics event
     - `tier_preview_unlocks` table has new row

2. **Already Seen Modal**
   - Setup: User has crossed 2K before
   - Action: Award more XP
   - Expected: Modal does NOT appear again
   - Verify: `tier_preview_unlocks` check returns existing record

3. **Modal Interactions**
   - Action: Click "See Upgrade Options"
   - Expected: Navigate to `/pricing` page
   - Action: Click "Maybe Later"
   - Expected: Modal closes, can be re-opened manually if needed

4. **Database Recording**
   - Table: `tier_preview_unlocks`
   - Expected Fields:
     - `user_id`: User UUID
     - `tier_previewed`: 3
     - `previewed_at`: Timestamp
   - Verify: One-time insertion per user

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Reset daily XP: Click "Reset Daily XP (Dev)" button
- [ ] Check starting values in database:
  ```sql
  SELECT total_xp_earned, current_level 
  FROM user_xp_levels 
  WHERE user_id = '[your-id]';

  SELECT daily_xp_earned, daily_xp_cap, current_tier 
  FROM user_xp_tiers 
  WHERE user_id = '[your-id]';
  ```

### Test Session 1: Basic XP Flow
- [ ] Award 100 XP via dev button → Verify instant UI update
- [ ] Log a winning trade → Verify base + ROI + notes XP
- [ ] Log a losing trade → Verify participation XP
- [ ] Complete a daily challenge → Verify challenge XP
- [ ] Check DailyMissionBar shows correct progress (e.g., 230/750 XP)

### Test Session 2: Daily Cap
- [ ] Use dev button to award XP until near cap (e.g., 700/750)
- [ ] Award 100 XP → Verify only 50 XP added
- [ ] Try to award more → Verify toast "Daily limit reached!"
- [ ] Check UpgradePrompt appears with "Upgrade for More" button
- [ ] Verify PostHog event: `daily_xp_cap_reached`

### Test Session 3: Tier Progression
- [ ] Reset account to 950 total XP
- [ ] Award 100 XP → Cross 1000 threshold
- [ ] Verify "🎉 Tier Unlocked: Silver!" toast
- [ ] Check DailyMissionBar now shows "(Silver)"
- [ ] Verify daily cap increased to 2000 in database
- [ ] Check PostHog event: `tier_unlocked` with tier: 1

### Test Session 4: Emotion Tagging
- [ ] Edit a trade → Open TradeTagSelector
- [ ] Add emotions: "Confident", "Patient"
- [ ] Save trade → Verify `emotion_tags` array in database
- [ ] View EmotionPerformanceCorrelation → Check chart shows data
- [ ] Create custom emotion tag → Verify saved to `custom_tags`

### Test Session 5: Tier 3 Preview
- [ ] Reset account to 1950 total XP
- [ ] Award 100 XP → Cross 2000 threshold
- [ ] Verify Tier3PreviewModal appears automatically
- [ ] Check locked widgets shown: AI Insights, Advanced Metrics, Heatmap
- [ ] Click "See Upgrade Options" → Verify navigate to `/pricing`
- [ ] Check database: `tier_preview_unlocks` has new row
- [ ] Award more XP → Verify modal does NOT appear again

### Test Session 6: Streak Mechanics
- [ ] Sign in daily for 3 days → Verify login streak increments
- [ ] Log trades 3 days in a row → Verify trade streak increments
- [ ] Check multiplier increases: Day 1 (1x) → Day 3 (1.2x) → Day 7 (1.6x)
- [ ] Reach 7-day streak → Verify 100 XP milestone bonus
- [ ] Maintain both streaks 7+ days → Verify 500 XP combo bonus

### Test Session 7: Edge Cases
- [ ] Sign in after 4+ days → Verify "comeback login" (streak reset to 1)
- [ ] Log trade with 0 PnL → Verify base 10 XP only
- [ ] Log trade with massive profit ($500) → Verify max 50 XP bonus cap
- [ ] Award XP at 749/750 daily → Award 10 XP → Verify only 1 XP added
- [ ] Check midnight reset: `user_xp_tiers.last_reset_at` updates

---

## Analytics Verification

### PostHog Events to Check
1. **xp_awarded**: Every XP gain
   - Properties: `xp_amount`, `activity_type`, `streak_multiplier`, `total_xp`, `current_level`

2. **tier_unlocked**: Tier progression
   - Properties: `tier`, `total_xp`, `previous_tier`

3. **daily_xp_cap_reached**: Cap enforcement
   - Properties: `daily_xp`, `cap_limit`, `plan_type`

4. **tier_3_preview_opened**: Modal trigger
   - Properties: `total_xp`, `current_tier`

5. **challenge_completed**: Daily challenges
   - Properties: `challenge_id`, `challenge_title`, `xp_reward`

6. **daily_login**: Login streaks
   - Properties: `streak_day`, `xp_earned`

7. **trade_logged**: Trade streaks
   - Properties: `streak_day`, `xp_earned`

---

## Database Queries for Verification

```sql
-- Check user XP status
SELECT * FROM user_xp_levels WHERE user_id = '[your-id]';
SELECT * FROM user_xp_tiers WHERE user_id = '[your-id]';

-- Check XP activity log
SELECT * FROM xp_activity_log 
WHERE user_id = '[your-id]' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check tier preview unlock
SELECT * FROM tier_preview_unlocks 
WHERE user_id = '[your-id]';

-- Check emotion tags on trades
SELECT id, symbol, emotion_tags, error_tags, pnl 
FROM trades 
WHERE user_id = '[your-id]' 
AND emotion_tags IS NOT NULL;

-- Check custom tags
SELECT * FROM custom_tags 
WHERE user_id = '[your-id]';

-- Check user progression (streaks)
SELECT * FROM user_progression 
WHERE user_id = '[your-id]';
```

---

## Known Issues to Watch For

1. **Streak Multiplier on Test Button**: 
   - Fixed: Dev button now uses `skipMultiplier: true`
   - Should always award exactly 100 XP

2. **Progress Bar Color**: 
   - Fixed: Uses `indicatorClassName` prop
   - Should show correct color based on progress %

3. **React Query Cache**: 
   - Fixed: `invalidateQueries` called after XP changes
   - DailyMissionBar should update immediately

4. **Daily Cap Sentinel Value**: 
   - Fixed: Uses calculated `getDailyXPCap(tierLevel)` not DB value
   - Should respect tier-based caps

---

## Success Criteria

✅ **All activity types award XP correctly**  
✅ **Daily cap enforced at correct thresholds**  
✅ **Tier progression works smoothly**  
✅ **UI updates in real-time via React Query**  
✅ **Emotion tags saved and displayed**  
✅ **Analytics events tracked correctly**  
✅ **Tier 3 preview triggers at 2K XP**  
✅ **Streak mechanics calculate properly**  
✅ **No XP exploits or bypasses**  

---

## Phase 2 Readiness

Once all tests pass, you're ready for:
- ✅ Stripe payment integration
- ✅ Upgrade prompts and pricing tiers
- ✅ Leaderboards (XP rankings)
- ✅ Weekly challenges system
- ✅ XP analytics dashboard

---

**Good luck with testing! Report any issues you find and we'll fix them before Phase 2.**
