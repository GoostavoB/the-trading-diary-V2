-- Create psychology_logs table for emotional state tracking
CREATE TABLE public.psychology_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotional_state TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.psychology_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own psychology logs" 
ON public.psychology_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own psychology logs" 
ON public.psychology_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own psychology logs" 
ON public.psychology_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own psychology logs" 
ON public.psychology_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_psychology_logs_user_id ON public.psychology_logs(user_id);
CREATE INDEX idx_psychology_logs_logged_at ON public.psychology_logs(logged_at DESC);