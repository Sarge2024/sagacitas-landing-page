-- ==============================================================================
-- SAGACITAS PLAYER - RASTREAMENTO DE SINCRONIA POR SLIDE (Class Studio)
-- ==============================================================================
-- Extensão de `lessons_sync_state` (nível-aula) para granularidade de slide,
-- implementando o protocolo `slide-id` definido em
-- gestor-de-obras/.ai/specs/slide_identification_protocol.md.
--
-- Tabela própria deste repositório — não faz parte do schema que o Works
-- Manager escreve, não altera `public.lessons` de forma alguma.
--
-- Chave composta (lesson_id, slide_id): o slide_id só precisa ser único
-- DENTRO de uma aula (mesmo escopo de identidade definido no protocolo).
--
-- Executar no SQL Editor do projeto Supabase de sagacitas.com.br.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.lessons_slide_sync_state (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  slide_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  slide_index INT NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lesson_id, slide_id)
);

ALTER TABLE public.lessons_slide_sync_state ENABLE ROW LEVEL SECURITY;

-- Mesma postura permissiva já em vigor pra `lessons_sync_state` — rastreador
-- interno, sem dado sensível.
DROP POLICY IF EXISTS "RLS_Lessons_Slide_Sync_State_All" ON public.lessons_slide_sync_state;
CREATE POLICY "RLS_Lessons_Slide_Sync_State_All"
ON public.lessons_slide_sync_state
FOR ALL
USING (true)
WITH CHECK (true);
