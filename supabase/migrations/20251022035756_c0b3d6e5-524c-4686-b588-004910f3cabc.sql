-- Phase 1: AI Cost Optimization Database Schema

-- 1. AI Image Cache (for OCR and vision deduplication)
CREATE TABLE IF NOT EXISTS ai_image_cache (
  image_hash TEXT PRIMARY KEY,
  perceptual_hash TEXT,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  preprocessing_version TEXT NOT NULL DEFAULT 'v1',
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  ocr_text TEXT,
  ocr_confidence NUMERIC(5,2),
  ocr_quality_score NUMERIC(5,2),
  parsed_json JSONB NOT NULL,
  route_used TEXT NOT NULL CHECK (route_used IN ('ocr_lite', 'vision_deep')),
  tokens_saved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_image_hash ON ai_image_cache(image_hash);
CREATE INDEX idx_perceptual_hash ON ai_image_cache(perceptual_hash);
CREATE INDEX idx_image_cache_expires ON ai_image_cache(expires_at);

-- 2. AI Trade Cache (for analysis results)
CREATE TABLE IF NOT EXISTS ai_trade_cache (
  user_id UUID NOT NULL,
  trade_id UUID,
  trade_hash TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  parsed_json JSONB NOT NULL,
  ttl_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cache_key)
);

CREATE INDEX idx_trade_cache_user ON ai_trade_cache(user_id);
CREATE INDEX idx_trade_cache_expires ON ai_trade_cache(ttl_expires_at);

-- 3. User AI Budget (monthly spending limits)
CREATE TABLE IF NOT EXISTS user_ai_budget (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'elite')),
  month_start DATE NOT NULL,
  spend_cents INTEGER DEFAULT 0 CHECK (spend_cents >= 0),
  budget_cents INTEGER NOT NULL CHECK (budget_cents > 0),
  force_lite_at_80_percent BOOLEAN DEFAULT FALSE,
  blocked_at_100_percent BOOLEAN DEFAULT FALSE,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_user_month ON user_ai_budget(user_id, month_start);

-- 4. User AI Usage (feature usage tracking)
CREATE TABLE IF NOT EXISTS user_ai_usage (
  user_id UUID NOT NULL,
  month_start DATE NOT NULL,
  images_used INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  analyses_run INTEGER DEFAULT 0,
  reports_run INTEGER DEFAULT 0,
  psychology_run INTEGER DEFAULT 0,
  predictions_run INTEGER DEFAULT 0,
  widgets_run INTEGER DEFAULT 0,
  clarifications_run INTEGER DEFAULT 0,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);

-- 5. AI Cost Log (detailed cost tracking)
CREATE TABLE IF NOT EXISTS ai_cost_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('lite', 'deep', 'cached')),
  model_id TEXT NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  canary BOOLEAN DEFAULT FALSE,
  ocr_quality_score NUMERIC(5,2),
  complexity TEXT CHECK (complexity IN ('simple', 'complex')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_log_user_date ON ai_cost_log(user_id, created_at);
CREATE INDEX idx_cost_log_endpoint ON ai_cost_log(endpoint);
CREATE INDEX idx_cost_log_canary ON ai_cost_log(canary) WHERE canary = TRUE;

-- 6. Function to atomically increment AI spend
CREATE OR REPLACE FUNCTION increment_ai_spend(
  p_user_id UUID,
  p_month_start DATE,
  p_cost_cents INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_ai_budget (user_id, month_start, spend_cents, budget_cents, plan)
  VALUES (p_user_id, p_month_start, p_cost_cents, 75, 'starter')
  ON CONFLICT (user_id)
  DO UPDATE SET
    spend_cents = user_ai_budget.spend_cents + p_cost_cents,
    force_lite_at_80_percent = (user_ai_budget.spend_cents + p_cost_cents) >= (user_ai_budget.budget_cents * 0.8),
    blocked_at_100_percent = (user_ai_budget.spend_cents + p_cost_cents) >= user_ai_budget.budget_cents,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE ai_image_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trade_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_image_cache (accessible by all authenticated users for reading, service role for writing)
CREATE POLICY "Anyone can read image cache"
  ON ai_image_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage image cache"
  ON ai_image_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_trade_cache
CREATE POLICY "Users can read their own trade cache"
  ON ai_trade_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage trade cache"
  ON ai_trade_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_ai_budget
CREATE POLICY "Users can read their own budget"
  ON user_ai_budget FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage budgets"
  ON user_ai_budget FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_ai_usage
CREATE POLICY "Users can read their own usage"
  ON user_ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON user_ai_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_cost_log
CREATE POLICY "Users can read their own cost logs"
  ON ai_cost_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage cost logs"
  ON ai_cost_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);