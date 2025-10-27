-- Create broker CSV templates table for intelligent mapping
CREATE TABLE public.broker_csv_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  column_mappings JSONB NOT NULL,
  sample_headers TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usage_count INTEGER NOT NULL DEFAULT 1,
  is_global BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT unique_user_broker UNIQUE(user_id, broker_name)
);

-- Enable RLS
ALTER TABLE public.broker_csv_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own and global templates"
ON public.broker_csv_templates FOR SELECT
USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Users can create own templates"
ON public.broker_csv_templates FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
ON public.broker_csv_templates FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
ON public.broker_csv_templates FOR DELETE
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_broker_templates_user ON public.broker_csv_templates(user_id);
CREATE INDEX idx_broker_templates_broker ON public.broker_csv_templates(broker_name);
CREATE INDEX idx_broker_templates_global ON public.broker_csv_templates(is_global) WHERE is_global = true;

-- Function to update last_used_at and increment usage_count
CREATE OR REPLACE FUNCTION public.increment_template_usage(p_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.broker_csv_templates
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$;