ALTER TABLE public.user_setups
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS timeframe text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS entry_rules text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS indicators text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pitfalls text,
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

CREATE POLICY "Setup images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'setup-images');

CREATE POLICY "Users can upload their own setup images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'setup-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own setup images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'setup-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own setup images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'setup-images' AND auth.uid()::text = (storage.foldername(name))[1]);