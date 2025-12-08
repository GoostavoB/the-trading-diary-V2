-- Add missing columns to ai_cost_log for idempotency support
ALTER TABLE public.ai_cost_log 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Add index for idempotency lookups
CREATE INDEX IF NOT EXISTS idx_ai_cost_log_idempotency_key 
ON public.ai_cost_log(idempotency_key) 
WHERE idempotency_key IS NOT NULL;