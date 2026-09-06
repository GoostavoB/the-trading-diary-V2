ALTER TABLE public.custom_tags DROP CONSTRAINT IF EXISTS custom_tags_tag_type_check;
ALTER TABLE public.custom_tags ADD CONSTRAINT custom_tags_tag_type_check CHECK (tag_type = ANY (ARRAY['emotion'::text,'error'::text,'setup'::text,'market'::text,'custom'::text]));
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS setup_tags text[];
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS market_tags text[];