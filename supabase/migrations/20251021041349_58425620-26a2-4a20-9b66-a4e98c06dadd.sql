-- Add color column to user_setups table
ALTER TABLE public.user_setups
ADD COLUMN color TEXT DEFAULT '#A18CFF';