-- Add onboarding_completed column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;