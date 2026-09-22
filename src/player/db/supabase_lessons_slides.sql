-- ==============================================================================
-- SAGACITAS PLAYER - LESSONS (SLIDE PIPELINE) — ETAPA 1
-- ==============================================================================
-- Cria a tabela `lessons` (conteúdo de OAs vindo do pipeline Markdown do Works
-- Manager) e o bucket de Storage `course-assets` usado pelo editor de aulas.
-- Não existia tabela `lessons` neste projeto antes desta migração — segue o
-- mesmo padrão de isolamento por tenant usado em `course_manifests` e
-- `student_uc_progress` (ver supabase_rls_policies.sql).
--
-- Executar no SQL Editor do projeto Supabase de sagacitas.com.br.
-- Idempotente: pode ser executado mais de uma vez sem duplicar objetos.

-- ------------------------------------------------------------------------------
-- 1. TABELA DE AULAS (Conteúdo por Objeto de Aprendizagem, com isolamento por Tenant)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL REFERENCES public.tenant_contracts(tenant_id) ON DELETE CASCADE,
  gc_id VARCHAR(100) NOT NULL,       -- Grupo Curricular / Course ID
  module_id VARCHAR(100),            -- Módulo dentro do curso (frontmatter do .md)
  uc_id VARCHAR(100) NOT NULL,       -- Unidade Curricular / OA que esta aula preenche
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'slide'
    CONSTRAINT lessons_type_check CHECK (type IN ('video', 'lab', 'quiz', 'project', 'simulator', 'simulator_dre', 'slide')),
  "order" INT NOT NULL DEFAULT 0,
  markdown_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_lesson_tenant_gc_uc UNIQUE (tenant_id, gc_id, uc_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_tenant_gc ON public.lessons(tenant_id, gc_id);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: SELECT liberado para o tenant correspondente com contrato ATIVO
-- (mesma regra usada em RLS_Course_Manifests_Tenant_Isolation)
DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Isolation" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Isolation"
ON public.lessons
FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.tenant_contracts tc
    WHERE tc.tenant_id = lessons.tenant_id
      AND tc.status = 'ACTIVE'
      AND tc.valid_until >= NOW()
  )
);

-- POLÍTICA 2: INSERT/UPDATE liberado para o tenant correspondente
-- (usado pelo Admin Editor e pelo syncLessons.ts do Works Manager)
DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Write" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Write"
ON public.lessons
FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "RLS_Lessons_Tenant_Update" ON public.lessons;
CREATE POLICY "RLS_Lessons_Tenant_Update"
ON public.lessons
FOR UPDATE
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

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
DROP POLICY IF EXISTS "RLS_Course_Assets_Tenant_Upload" ON storage.objects;
CREATE POLICY "RLS_Course_Assets_Tenant_Upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets'
  AND (storage.foldername(name))[1] = public.get_current_tenant_id()
);
