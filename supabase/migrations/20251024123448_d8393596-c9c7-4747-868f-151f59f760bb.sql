-- Create AI extraction feedback table for learning system
CREATE TABLE IF NOT EXISTS ai_extraction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for querying feedback
  CONSTRAINT feedback_type_check CHECK (feedback_type IN ('positive', 'negative'))
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_extraction_feedback_user_id ON ai_extraction_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_extraction_feedback_created_at ON ai_extraction_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_extraction_feedback_type ON ai_extraction_feedback(feedback_type);

-- Enable RLS
ALTER TABLE ai_extraction_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feedback"
  ON ai_extraction_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON ai_extraction_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);