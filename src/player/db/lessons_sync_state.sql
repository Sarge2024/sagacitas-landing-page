-- ==============================================================================
-- SAGACITAS PLAYER - RASTREAMENTO DE SINCRONIA DE AULAS (Class Studio)
-- ==============================================================================
-- Tabela própria deste repositório — NÃO faz parte do schema compartilhado com
-- o Works Manager (não altera `public.lessons` de forma alguma). Guarda só o
-- hash do `markdown_content` na última vez que um instrutor revisou/aceitou
-- aquela aula, para o Class Studio conseguir distinguir:
--   - NOVA: aula sem snapshot (nunca revisada aqui).
--   - ALTERADA: existe snapshot, mas o hash atual de `markdown_content` é
--     diferente — o Works Manager mudou o conteúdo desde a última revisão.
--   - SINCRONIZADA: hash atual bate com o snapshot — nada a fazer.
--
-- Resolve o problema real de "reformatar por engano uma aula que já estava
-- pronta" (ver .ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md).
--
-- Executar no SQL Editor do projeto Supabase de sagacitas.com.br.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.lessons_sync_state (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons_sync_state ENABLE ROW LEVEL SECURITY;

-- Rastreador interno, sem dado sensível (só hash + timestamp) — mesma postura
-- permissiva já em vigor para o conteúdo de `lessons` neste projeto.
DROP POLICY IF EXISTS "RLS_Lessons_Sync_State_All" ON public.lessons_sync_state;
CREATE POLICY "RLS_Lessons_Sync_State_All"
ON public.lessons_sync_state
FOR ALL
USING (true)
WITH CHECK (true);
