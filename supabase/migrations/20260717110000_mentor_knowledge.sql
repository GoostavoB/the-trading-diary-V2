-- P2 do bot mentor: conhecimento que o usuário ensina ao mentor
-- (legenda do gráfico dele, setups, regras, lições) — injetado em toda análise.

CREATE TABLE IF NOT EXISTS public.mentor_knowledge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'chart_legend' = como ler o gráfico do usuário | 'setup' | 'rule' | 'lesson'
  kind        text NOT NULL DEFAULT 'lesson',
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentor_knowledge_user
  ON public.mentor_knowledge(user_id, created_at);

ALTER TABLE public.mentor_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mentor_knowledge_own_select" ON public.mentor_knowledge;
CREATE POLICY "mentor_knowledge_own_select" ON public.mentor_knowledge
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "mentor_knowledge_own_insert" ON public.mentor_knowledge;
CREATE POLICY "mentor_knowledge_own_insert" ON public.mentor_knowledge
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "mentor_knowledge_own_delete" ON public.mentor_knowledge;
CREATE POLICY "mentor_knowledge_own_delete" ON public.mentor_knowledge
  FOR DELETE USING (auth.uid() = user_id);
