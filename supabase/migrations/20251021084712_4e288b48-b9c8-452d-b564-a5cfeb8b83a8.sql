-- Enable realtime for XP system tables
alter table public.user_xp_levels replica identity full;
alter table public.xp_activity_log replica identity full;

alter publication supabase_realtime add table public.user_xp_levels;
alter publication supabase_realtime add table public.xp_activity_log;
