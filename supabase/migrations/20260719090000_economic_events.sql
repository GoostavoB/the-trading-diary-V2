-- Calendário econômico sincronizado do Apify (investing.com scraper).
-- Lido pelo mentor do Telegram em toda análise; escrito só pela função
-- economic-calendar-sync (service role) — sem policies de usuário.

CREATE TABLE IF NOT EXISTS public.economic_events (
  id            text PRIMARY KEY,
  event         text NOT NULL,
  event_time    timestamptz,
  all_day_date  date,
  importance    text,
  currency      text,
  zone          text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_economic_events_time
  ON public.economic_events(event_time);

ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;
