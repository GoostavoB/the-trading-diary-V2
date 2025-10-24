-- Add language preference to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add check constraint to ensure only valid languages
ALTER TABLE public.user_settings 
ADD CONSTRAINT user_settings_language_check 
CHECK (language IN ('en', 'pt', 'es', 'ar', 'vi'));

-- Add index for language queries
CREATE INDEX IF NOT EXISTS idx_user_settings_language 
ON public.user_settings(language);

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.language IS 'User preferred language (en, pt, es, ar, vi)';