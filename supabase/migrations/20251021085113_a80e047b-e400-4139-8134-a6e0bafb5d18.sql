-- Phase 3 & 7: Badge Tiers + Leaderboard/Social Recognition tables

-- 1) badge_tiers - Multi-tier badge progression system
create table if not exists public.badge_tiers (
  id uuid primary key default gen_random_uuid(),
  badge_id text not null,
  tier text not null, -- 'bronze', 'silver', 'gold', 'platinum'
  requirement_multiplier numeric not null default 1.0,
  xp_reward integer not null default 25,
  created_at timestamptz not null default now(),
  unique(badge_id, tier)
);

-- 2) seasonal_competitions - Leaderboard seasons
create table if not exists public.seasonal_competitions (
  id uuid primary key default gen_random_uuid(),
  season_name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3) leaderboard_entries - User rankings per season
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  season_id uuid not null references public.seasonal_competitions(id) on delete cascade,
  performance_score numeric not null default 0,
  rank integer not null default 0,
  roi numeric not null default 0,
  win_rate numeric not null default 0,
  consistency_index numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, season_id)
);

-- 4) achievement_showcase - Pinned top 3 achievements
create table if not exists public.achievement_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_id text not null,
  display_order integer not null check (display_order between 1 and 3),
  created_at timestamptz not null default now(),
  unique(user_id, display_order)
);

-- 5) Update unlocked_badges table with tier progression
alter table public.unlocked_badges 
add column if not exists tier text not null default 'bronze',
add column if not exists progress_to_next_tier numeric not null default 0,
add column if not exists unlock_animation_seen boolean not null default false;

-- Triggers
create trigger trg_leaderboard_entries_updated_at
before update on public.leaderboard_entries
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.badge_tiers enable row level security;
alter table public.seasonal_competitions enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.achievement_showcase enable row level security;

-- Policies: badge_tiers (everyone can view)
create policy "Anyone can view badge tiers" on public.badge_tiers
for select to authenticated using (true);

-- Policies: seasonal_competitions (everyone can view active seasons)
create policy "Anyone can view seasons" on public.seasonal_competitions
for select to authenticated using (true);

-- Policies: leaderboard_entries (everyone can view, users can update own)
create policy "Anyone can view leaderboard" on public.leaderboard_entries
for select to authenticated using (true);

create policy "Users can insert own leaderboard entry" on public.leaderboard_entries
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own leaderboard entry" on public.leaderboard_entries
for update to authenticated using (auth.uid() = user_id);

-- Policies: achievement_showcase
create policy "Anyone can view achievement showcase" on public.achievement_showcase
for select to authenticated using (true);

create policy "Users can manage own showcase" on public.achievement_showcase
for all to authenticated using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_badge_tiers_badge on public.badge_tiers(badge_id);
create index if not exists idx_seasonal_competitions_active on public.seasonal_competitions(is_active) where is_active = true;
create index if not exists idx_leaderboard_season_rank on public.leaderboard_entries(season_id, rank);
create index if not exists idx_leaderboard_user_season on public.leaderboard_entries(user_id, season_id);
create index if not exists idx_achievement_showcase_user on public.achievement_showcase(user_id, display_order);

-- Seed badge tiers for existing achievements
insert into public.badge_tiers (badge_id, tier, requirement_multiplier, xp_reward) values
-- First Trade
('first-trade', 'bronze', 1.0, 50),
-- Consistent Trader
('consistent-trader', 'bronze', 1.0, 25),
('consistent-trader', 'silver', 5.0, 50),
('consistent-trader', 'gold', 10.0, 100),
('consistent-trader', 'platinum', 50.0, 250),
-- ROI Master
('roi-master', 'bronze', 1.0, 30),
('roi-master', 'silver', 3.0, 60),
('roi-master', 'gold', 5.0, 120),
('roi-master', 'platinum', 10.0, 300),
-- Win Rate Champion
('win-rate', 'bronze', 1.0, 30),
('win-rate', 'silver', 1.5, 60),
('win-rate', 'gold', 2.0, 120),
('win-rate', 'platinum', 3.0, 300)
on conflict do nothing;

-- Create first season
insert into public.seasonal_competitions (season_name, start_date, end_date, is_active) values
('Season 1 - Launch', current_date, current_date + interval '90 days', true)
on conflict do nothing;
