# 🎮 Complete Gamification System

## Overview
A comprehensive gamification system that drives user engagement through XP, levels, badges, challenges, leaderboards, and retention mechanics.

---

## 🗄️ Database Schema (12 Tables)

### Core Progression
1. **user_xp_levels** - Tracks user level and total XP (realtime enabled)
2. **xp_activity_log** - Historical record of all XP gains (realtime enabled)
3. **user_progression** - Centralized tracking: streaks, rank, freeze tokens
4. **unlocked_badges** - Badge inventory with tier progression
5. **badge_tiers** - Multi-tier badge system (bronze → diamond)

### Engagement Mechanics
6. **daily_challenges** - Daily refreshing challenges with XP rewards
7. **mystery_rewards** - Variable reward system with rarity tiers
8. **dopamine_events** - Logs all micro-feedback triggers
9. **streak_freeze_inventory** - Streak protection tokens

### Social & Competition
10. **leaderboard_entries** - Seasonal rankings by performance score
11. **seasonal_competitions** - Competition periods and metadata
12. **achievement_showcase** - User-curated badge displays

### Customization
13. **user_customization_preferences** - Calm mode, sound, animation speed

---

## ⚡ Core Systems

### XP System
- **Base XP per trade**: 10 XP
- **Win bonus**: +5 XP
- **Streak multipliers**: Up to 2x for 7+ day streaks
- **Mystery rewards**: 1 in 20 chance (10-500 XP)
- **Realtime sync**: Instant updates across dashboard widgets

### Level Progression
- **Formula**: XP needed = 100 * (level ^ 1.5)
- **Level titles**:
  - 1-9: Novice Trader
  - 10-19: Skilled Trader
  - 20-29: Advanced Trader
  - 30-39: Expert Trader
  - 40-49: Master Trader
  - 50+: Monstro

### Badge Tiers
Each badge has 5 tiers with increasing requirements:
- **Bronze** (1x multiplier, 25 XP)
- **Silver** (2x multiplier, 50 XP)
- **Gold** (3x multiplier, 100 XP)
- **Platinum** (5x multiplier, 200 XP)
- **Diamond** (10x multiplier, 500 XP)

### Streak Mechanics
- **Current streak**: Consecutive days with trades
- **Streak freeze tokens**: Protect streaks (earned at level milestones)
- **Warning modal**: Appears when streak is at risk
- **Comeback bonus**: 50 XP when returning after 7+ days
- **Max streak tracking**: Personal best record

### Daily Challenges (8 Types)
1. **Trade 3 times** - Basic activity (50 XP)
2. **Win 2 trades** - Performance goal (75 XP)
3. **Achieve 60% win rate** - Quality metric (100 XP)
4. **Reach 5% ROI** - Profit target (100 XP)
5. **Trade 5 different assets** - Diversification (80 XP)
6. **Complete 2 setups** - Strategy focus (60 XP)
7. **Maintain 3 day streak** - Consistency (75 XP)
8. **Trade before 12 PM** - Early bird bonus (50 XP)

### Leaderboard System
**Ranking formula**:
```
performance_score = (ROI * 0.4) + (win_rate * 0.3) + (consistency_index * 0.3)
```

**Seasonal competitions**:
- Each season has start/end dates
- Top 3 get podium display with special colors
- Traders ranked by performance score
- Real-time rank updates

---

## 🎨 UI Components

### Micro-Feedback System
- **MicroFeedbackOverlay**: Floating +XP notifications on trades
- **PulseGlow**: Win/loss visual effects
- **StreakVisualizer**: Animated fire with urgency colors
- **ShimmerEffect**: Subtle animations for rewards

### Modals & Panels
- **LevelUpModal**: Celebration animation on level up
- **MysteryRewardModal**: Suspense + reveal animation
- **StreakWarningModal**: Loss aversion prompt with freeze token option
- **BadgeProgressionPanel**: Track progress to next tier
- **DailyChallengesPanel**: Challenge list with progress bars
- **WeeklySummaryRecap**: Weekly performance digest

### Dashboard Widgets
- **XPProgressBar**: Current level + XP to next level
- **GamificationSidebar**: Compact XP display in sidebar
- **WelcomeMessage**: Personalized greetings based on time/progress
- **AnticipationMeter**: Progress bars with glow effects

---

## 🛠️ Hooks & Utilities

### Hooks
- **useXPSystem**: XP tracking, leveling, and progression
- **useDopamineFeedback**: Trigger micro-feedback (throttled)
- **useMysteryRewards**: Handle mystery reward logic
- **useRetentionMechanics**: Streak warnings, comeback bonus
- **useDailyChallenges**: Challenge initialization and updates
- **useThemeUnlocks**: Theme progression based on level/rank
- **useTradeXPRewards**: Auto-award XP on trade upload

### Context
- **CalmModeContext**: User preference for reduced animations/sound
  - `calmModeEnabled`: Toggle animations
  - `soundEnabled`: Toggle sound effects
  - `animationSpeed`: slow | normal | fast

### Utilities
- **soundManager.ts**: Placeholder for future sound system
- **triggerMicroFeedback()**: Dispatch floating notifications
- **insightCalculations.ts**: Leaderboard score calculations

---

## 🔄 Edge Functions (Auto-scheduled)

### calculate-leaderboard
- **Schedule**: Daily at midnight UTC
- **Purpose**: Recalculate rankings for active season
- **Logic**: Fetch trades, calculate performance score, update leaderboard

### update-challenges
- **Schedule**: Daily at midnight UTC
- **Purpose**: Reset daily challenges
- **Logic**: Archive completed challenges, create new ones

### check-user-activity
- **Schedule**: Every 6 hours
- **Purpose**: Detect inactive users, trigger retention mechanics
- **Logic**: 
  - Check last trade timestamp
  - Send streak warnings (24h before loss)
  - Award comeback bonus (7+ days absence)

---

## 🎯 Retention Mechanics

### Streak Protection
- **Freeze tokens**: Earned every 5 levels
- **Warning system**: Modal appears 24h before streak loss
- **Auto-apply**: Option to use token when streak breaks

### Variable Rewards
- **Mystery chance**: 1 in 20 trades
- **Rarity distribution**:
  - Common (70%): 10-50 XP
  - Rare (20%): 51-150 XP
  - Epic (8%): 151-300 XP
  - Legendary (2%): 301-500 XP

### Comeback Incentive
- After 7+ days absence: +50 XP welcome back bonus
- Streak reset, but encouragement to restart

---

## 📍 Navigation & Access

### Sidebar Links
- **Progress & XP** → `/gamification`
- **Leaderboard** → `/leaderboard`
- **Achievements** → `/achievements`

### Settings Page
- **Appearance Tab**: Theme selector + Calm mode toggles
- **Trading Tab**: Capital management
- **Notifications Tab**: Email preferences

### Pages
1. **/gamification**: Level display, challenges, badge progression
2. **/leaderboard**: Seasonal rankings with podium
3. **/achievements**: Badge showcase (existing)

---

## 🚀 Performance Optimizations

### Realtime Sync
- XP tables have realtime enabled
- Dashboard widgets auto-refresh on XP gain
- No page reload needed

### Throttling
- Micro-feedback throttled to 500ms
- Prevents feedback overload on rapid actions

### Caching
- Badge tiers loaded once at startup
- Theme unlocks cached per user
- Challenge data refreshed daily

---

## 🎨 Design Tokens (index.css)

All gamification UI uses semantic tokens:
- `--primary`: XP bars, level badges
- `--gradient-primary`: Level cards, podium
- `--shadow-elegant`: Modal effects
- `--transition-smooth`: All animations

---

## 📊 Analytics Tracked

### Dopamine Events Table
Logs every engagement trigger:
- `event_type`: trade_win, xp_gain, level_up, etc.
- `xp_awarded`: Amount of XP given
- `sound_type`: Audio feedback (future)
- `animation_type`: Visual effect used

### XP Activity Log
Complete history of XP gains:
- `activity_type`: trade, challenge, mystery, streak_bonus
- `xp_earned`: Amount
- `context`: JSON metadata (trade_id, challenge_type, etc.)

---

## 🔮 Future Enhancements

1. **Sound Effects**: Integrate soundManager.ts with actual audio files
2. **Profile Frames**: Cosmetic unlocks for leaderboard profiles
3. **Weekly Tournaments**: Short competitive events
4. **Guild System**: Team-based competition
5. **Achievement Chains**: Multi-step badge progressions
6. **Custom Widgets**: AI-generated personalized dashboards
7. **Trade Replays**: Animated trade history visualization

---

## ✅ System Status

### ✓ Implemented
- [x] Complete database schema with RLS policies
- [x] XP system with real-time sync
- [x] Multi-tier badge progression
- [x] Daily challenges (8 types)
- [x] Leaderboard with seasonal rankings
- [x] Streak mechanics with freeze tokens
- [x] Mystery reward system
- [x] Dopamine feedback with micro-animations
- [x] Calm mode for accessibility
- [x] Edge function CRON jobs
- [x] Theme unlocking system
- [x] Settings integration
- [x] Sidebar navigation

### 🔧 Configuration Files
- `supabase/config.toml`: CRON schedules configured
- `src/App.tsx`: CalmModeProvider wrapping app
- `src/components/layout/AppSidebar.tsx`: Leaderboard link added
- `src/pages/Settings.tsx`: Appearance tab with calm mode

---

## 📚 Key Files Reference

**Core Logic:**
- `src/hooks/useXPSystem.ts`
- `src/hooks/useDopamineFeedback.ts`
- `src/hooks/useDailyChallenges.ts`

**UI Components:**
- `src/components/gamification/` (11 components)
- `src/components/animations/` (4 components)

**Pages:**
- `src/pages/Gamification.tsx`
- `src/pages/Leaderboard.tsx`
- `src/pages/Settings.tsx`

**Edge Functions:**
- `supabase/functions/calculate-leaderboard/`
- `supabase/functions/update-challenges/`
- `supabase/functions/check-user-activity/`

---

## 🎉 Ready to Use!

The complete gamification system is now live. Users can:
1. Upload trades to earn XP and level up
2. Complete daily challenges for bonus rewards
3. Compete on the leaderboard
4. Unlock badges across 5 tiers
5. Maintain streaks with protection tokens
6. Get instant micro-feedback on every action
7. Customize experience with calm mode
8. Unlock themes as they progress

**Test it out**: Upload a few trades and watch the XP flow! 🚀
