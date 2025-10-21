-- Phase 1 (continued): Mystery Rewards & User Progression tables

-- 1) user_progression - Centralized progression tracking
create table if not exists public.user_progression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  xp integer not null default 0,
  level integer not null default 1,
  rank text not null default 'rookie_trader',
  total_badges_unlocked integer not null default 0,
  customization_count integer not null default 0,
  daily_streak integer not null default 0,
  weekly_streak integer not null default 0,
  last_active_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) mystery_rewards - Random reward pool
create table if not exists public.mystery_rewards (
  id uuid primary key default gen_random_uuid(),
  reward_type text not null, -- 'xp_boost', 'badge_unlock', 'theme_unlock', 'freeze_token', 'profile_frame'
  reward_value integer not null,
  rarity text not null default 'common', -- 'common', 'rare', 'epic', 'legendary'
  trigger_condition jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) dopamine_events - Track all micro-feedback events
create table if not exists public.dopamine_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  xp_awarded integer not null default 0,
  triggered_at timestamptz not null default now(),
  animation_type text,
  sound_type text
);

-- 4) streak_freeze_inventory - Streak protection tokens
create table if not exists public.streak_freeze_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  freeze_tokens integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5) user_customization_preferences - Theme and sensory settings
create table if not exists public.user_customization_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  calm_mode_enabled boolean not null default false,
  sound_enabled boolean not null default true,
  animation_speed text not null default 'normal', -- 'slow', 'normal', 'fast'
  haptic_feedback_enabled boolean not null default false,
  unlocked_themes text[] not null default array[]::text[],
  active_theme text not null default 'default',
  profile_frame text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers for updated_at
create trigger trg_user_progression_updated_at
before update on public.user_progression
for each row execute function public.set_updated_at();

create trigger trg_user_customization_prefs_updated_at
before update on public.user_customization_preferences
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.user_progression enable row level security;
alter table public.mystery_rewards enable row level security;
alter table public.dopamine_events enable row level security;
alter table public.streak_freeze_inventory enable row level security;
alter table public.user_customization_preferences enable row level security;

-- Policies: user_progression
create policy "Users can view own progression" on public.user_progression
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own progression" on public.user_progression
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own progression" on public.user_progression
for update to authenticated using (auth.uid() = user_id);

-- Policies: mystery_rewards (all users can view active rewards)
create policy "Anyone can view active mystery rewards" on public.mystery_rewards
for select to authenticated using (is_active = true);

-- Policies: dopamine_events
create policy "Users can view own dopamine events" on public.dopamine_events
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own dopamine events" on public.dopamine_events
for insert to authenticated with check (auth.uid() = user_id);

-- Policies: streak_freeze_inventory
create policy "Users can view own freeze inventory" on public.streak_freeze_inventory
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own freeze inventory" on public.streak_freeze_inventory
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own freeze inventory" on public.streak_freeze_inventory
for update to authenticated using (auth.uid() = user_id);

-- Policies: user_customization_preferences
create policy "Users can view own customization prefs" on public.user_customization_preferences
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own customization prefs" on public.user_customization_preferences
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own customization prefs" on public.user_customization_preferences
for update to authenticated using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_user_progression_user on public.user_progression(user_id);
create index if not exists idx_dopamine_events_user_triggered on public.dopamine_events(user_id, triggered_at desc);
create index if not exists idx_mystery_rewards_active on public.mystery_rewards(is_active) where is_active = true;
create index if not exists idx_streak_freeze_user on public.streak_freeze_inventory(user_id);
create index if not exists idx_user_customization_user on public.user_customization_preferences(user_id);

-- Seed some mystery rewards
insert into public.mystery_rewards (reward_type, reward_value, rarity, trigger_condition) values
('xp_boost', 25, 'common', '{"min_trades": 5}'::jsonb),
('xp_boost', 50, 'rare', '{"min_trades": 10}'::jsonb),
('xp_boost', 100, 'epic', '{"min_trades": 20}'::jsonb),
('theme_unlock', 1, 'rare', '{"min_level": 5}'::jsonb),
('freeze_token', 1, 'epic', '{"min_streak": 7}'::jsonb),
('badge_unlock', 1, 'legendary', '{"min_level": 10}'::jsonb)
on conflict do nothing;
