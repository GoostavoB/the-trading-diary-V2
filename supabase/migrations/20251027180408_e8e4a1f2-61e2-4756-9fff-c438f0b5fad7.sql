-- Update custom_dashboard_widgets table with new columns for AI-powered metrics
ALTER TABLE custom_dashboard_widgets
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'manual' CHECK (created_via IN ('ai_assistant', 'manual', 'template')),
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
ADD COLUMN IF NOT EXISTS data_snapshot JSONB;

-- Create metric_conversations table to store chat history
CREATE TABLE IF NOT EXISTS metric_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  resulting_widget_id UUID REFERENCES custom_dashboard_widgets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on metric_conversations
ALTER TABLE metric_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for metric_conversations
CREATE POLICY "Users can view their own conversations"
  ON metric_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON metric_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON metric_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON metric_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_metric_conversations_user_id ON metric_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboard_widgets_user_permanent ON custom_dashboard_widgets(user_id, is_permanent) WHERE is_permanent = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_metric_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metric_conversations_updated_at
  BEFORE UPDATE ON metric_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_metric_conversations_updated_at();