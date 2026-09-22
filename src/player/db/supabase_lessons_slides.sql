-- ==============================================================================
-- SAGACITAS PLAYER - LESSONS (SLIDE PIPELINE) — ETAPA 1
-- ==============================================================================
-- Estende a tabela `lessons` já existente (conteúdo de OAs vindo do pipeline
-- Markdown do Works Manager) e cria o bucket de Storage `course-assets` usado
-- pelo editor de aulas.
--
-- CORRIGIDO em 2026-09-22: a versão original deste arquivo (`CREATE TABLE IF
-- NOT EXISTS public.lessons`) nunca rodou de verdade — a tabela `lessons` já
-- existe neste mesmo projeto Supabase, criada por outro produto que
-- compartilha o banco (Sagacitas E-Learning / Mosaico de Conhecimento,
-- courses→knowledge_units→learning_objects→lessons), com um formato mais
-- simples: `id (uuid), title (text), created_at, updated_at, tenant_id
-- (uuid)`. `CREATE TABLE IF NOT EXISTS` ficava em silêncio (a tabela já
-- existia) e as colunas que este player precisa (gc_id, module_id, uc_id,
-- type, "order", markdown_content) nunca existiram de verdade — por isso o
-- SlideRenderer.tsx sempre caía no DEFAULT_MARKDOWN ("Conteúdo indisponível").
-- Também corrigido: a função é `current_tenant_id()` (retorna `uuid`), não
-- `get_current_tenant_id()`; e `tenant_contracts.tenant_id` é `uuid`, não
-- `VARCHAR(100)` como este arquivo assumia — por isso a versão original nem
-- teria criado a FK corretamente se a tabela não existisse.
--
-- Executar no SQL Editor do projeto Supabase de sagacitas.com.br.
-- Idempotente: pode ser executado mais de uma vez sem duplicar objetos.

-- ------------------------------------------------------------------------------
-- 1. ESTENDE A TABELA DE AULAS (Conteúdo por Objeto de Aprendizagem)
-- ------------------------------------------------------------------------------
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS gc_id VARCHAR(100),        -- Grupo Curricular / Course ID
  ADD COLUMN IF NOT EXISTS module_id VARCHAR(100),    -- Módulo dentro do curso (frontmatter do .md)
  ADD COLUMN IF NOT EXISTS uc_id VARCHAR(100),        -- Unidade Curricular / OA que esta aula preenche
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'slide',
  ADD COLUMN IF NOT EXISTS "order" INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markdown_content TEXT;

DO $$ BEGIN
  ALTER TABLE public.lessons
    ADD CONSTRAINT lessons_type_check CHECK (type IN ('video', 'lab', 'quiz', 'project', 'simulator', 'simulator_dre', 'slide'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lessons
    ADD CONSTRAINT unique_lesson_tenant_gc_uc UNIQUE (tenant_id, gc_id, uc_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_tenant_gc ON public.lessons(tenant_id, gc_id);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- NOTA: a policy original deste projeto ("Authenticated users can view lessons"
-- ... USING (true), de courses_tables.sql) já libera SELECT irrestrito pra
-- qualquer usuário autenticado. Policies permissivas do mesmo comando (SELECT)
-- se somam com OR — a policy abaixo, mais estrita, NÃO restringe nada sozinha
-- enquanto aquela existir. Mantido aqui documentado; apertar isso é uma
-- decisão de segurança separada, fora do escopo desta extensão pontual.
DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Isolation" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Isolation"
ON public.lessons
FOR SELECT
USING (
  tenant_id IS NULL -- acervo do Marketplace Global (aulas do Works Manager, sem tenant específico)
  OR (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_contracts tc
      WHERE tc.tenant_id = lessons.tenant_id
        AND tc.active = true
    )
  )
);

-- POLÍTICA 2: INSERT/UPDATE liberado para o tenant correspondente, OU para
-- linhas sem tenant (acervo global) — usado pelo Admin Editor e pelo
-- syncLessons.ts do Works Manager (que hoje usa a service_role key, que
-- ignora RLS de qualquer forma; esta policy cobre o caso de um cliente
-- autenticado sem service_role, ex. o Admin Editor no navegador).
DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Write" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Write"
ON public.lessons
FOR INSERT
WITH CHECK (tenant_id IS NULL OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Update" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Update"
ON public.lessons
FOR UPDATE
USING (tenant_id IS NULL OR tenant_id = public.current_tenant_id())
WITH CHECK (tenant_id IS NULL OR tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 2. STORAGE: BUCKET PÚBLICO `course-assets` (imagens inseridas no Markdown)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública dos arquivos do bucket (necessário para exibir imagens no Player)
DROP POLICY IF EXISTS "RLS_Course_Assets_Public_Read" ON storage.objects;
CREATE POLICY "RLS_Course_Assets_Public_Read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-assets');

-- Upload restrito ao tenant autenticado, exigindo path course-assets/<tenant_id>/...
-- (mantém o mesmo isolamento B2B usado no restante do schema)
-- current_tenant_id() retorna uuid — cast ::text pra comparar com o segmento
-- de path (storage.foldername retorna text[]).
DROP POLICY IF EXISTS "RLS_Course_Assets_Tenant_Upload" ON storage.objects;
CREATE POLICY "RLS_Course_Assets_Tenant_Upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::text
);
