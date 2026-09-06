CREATE TABLE public.risk_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_account_id uuid,
  name text NOT NULL,
  period_type text NOT NULL DEFAULT 'monthly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_goals TO authenticated;
GRANT ALL ON public.risk_goals TO service_role;

ALTER TABLE public.risk_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own risk goals"
ON public.risk_goals FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_risk_goals_user_sub ON public.risk_goals (user_id, sub_account_id);

CREATE TRIGGER update_risk_goals_updated_at
BEFORE UPDATE ON public.risk_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();