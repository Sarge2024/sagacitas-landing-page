-- ==============================================================================
-- SAGACITAS PLAYER - CSS CUSTOMIZADO POR AULA (Class Studio)
-- ==============================================================================
-- Formatação visual dos slides hoje é 100% genérica (Tailwind Typography
-- `prose`, igual pra toda aula — ver src/player/components/renderers/SlideRenderer.tsx).
-- Esta tabela permite que uma aula específica sobrescreva/complemente esse
-- estilo com CSS próprio, escrito no Class Studio (AdminSlideEditor).
--
-- Tabela própria deste repositório — não faz parte do schema que o Works
-- Manager escreve, não altera `public.lessons` de forma alguma. Formatação é
-- responsabilidade de manutenção do Landing Page, não do Works Manager.
--
-- O CSS é aplicado com escopo (nesting nativo, `.slide-css-scope-<uc_id> { ... }`
-- injetado num <style> só de texto — ver SlideRenderer.tsx), nunca solto no
-- documento inteiro.
--
-- Executar no SQL Editor do projeto Supabase de sagacitas.com.br.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.lesson_slide_styles (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  custom_css TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lesson_slide_styles ENABLE ROW LEVEL SECURITY;

-- Mesma postura permissiva já em vigor pras outras tabelas de apoio do Class
-- Studio (`lessons_sync_state`, `lessons_slide_sync_state`) — rastreador
-- interno, sem dado sensível.
DROP POLICY IF EXISTS "RLS_Lesson_Slide_Styles_All" ON public.lesson_slide_styles;
CREATE POLICY "RLS_Lesson_Slide_Styles_All"
ON public.lesson_slide_styles
FOR ALL
USING (true)
WITH CHECK (true);
