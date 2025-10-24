-- Create exchange_rates_cache table
CREATE TABLE IF NOT EXISTS public.exchange_rates_cache (
  id TEXT PRIMARY KEY,
  rates JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exchange_rates_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (rates are public data)
CREATE POLICY "Anyone can read exchange rates" ON public.exchange_rates_cache
  FOR SELECT
  USING (true);

-- Create policy to allow service role to update rates
CREATE POLICY "Service role can update rates" ON public.exchange_rates_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_cache_updated_at 
  ON public.exchange_rates_cache(updated_at DESC);