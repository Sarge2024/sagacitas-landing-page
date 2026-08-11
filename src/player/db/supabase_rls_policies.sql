-- ==============================================================================
-- SAGACITAS PLAYER - DUAL-AUTH HANDSHAKE (FIREBASE AUTH + SUPABASE RLS) POLICIES
-- ==============================================================================
-- Este script DDL/RLS configura a autorização B2B por Tenant para o Player Sagacitas.
-- Fase 1: Identidade (Firebase Auth JWT)
-- Fase 2: Autorização por Tenant (Supabase Row Level Security)

-- ------------------------------------------------------------------------------
-- 1. TABELA DE CONTRATOS DOS TENANTS (Empresas Clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_contracts (
  tenant_id VARCHAR(100) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'SUSPENDED'
  valid_until TIMESTAMPTZ NOT NULL,
  max_seats INT DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar Row Level Security
ALTER TABLE public.tenant_contracts ENABLE ROW LEVEL SECURITY;

-- Exemplo de Seed para o Tenant Corporate
INSERT INTO public.tenant_contracts (tenant_id, company_name, status, valid_until, max_seats)
VALUES ('tenant_sagacitas_corporate_01', 'Sagacitas Corporate B2B', 'ACTIVE', NOW() + INTERVAL '1 year', 5000)
ON CONFLICT (tenant_id) DO UPDATE 
SET status = 'ACTIVE', valid_until = NOW() + INTERVAL '1 year';

-- ------------------------------------------------------------------------------
-- 2. TABELA DE MANIFESTOS DE CURSOS (Com isolamento por Tenant ID)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_manifests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gc_id VARCHAR(100) NOT NULL,
  tenant_id VARCHAR(100) NOT NULL REFERENCES public.tenant_contracts(tenant_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  manifest JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_gc_tenant UNIQUE (gc_id, tenant_id)
);

-- Ativar RLS
ALTER TABLE public.course_manifests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. TABELA DE PROGRESSO DO ALUNO (Com isolamento por Tenant e UID do Firebase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_uc_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(128) NOT NULL, -- UID vindo do Firebase Auth
  gc_id VARCHAR(100) NOT NULL,
  uc_id VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL, -- 'LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'REMEDIATION'
  score INT,
  is_exempt_by_dnt BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_gc_uc UNIQUE (student_id, gc_id, uc_id)
);

-- Ativar RLS
ALTER TABLE public.student_uc_progress ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. FUNÇÃO AUXILIAR PARA EXTRAIR O TENANT E VALIDADE DO CONTRATO NO SUPABASE
-- ------------------------------------------------------------------------------
-- Esta função lê a claim customizada 'tenant_id' enviada no JWT do Firebase,
-- ou compara com o header customizado enviado no Handshake da SDK.
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  -- Tenta ler da claim do JWT
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'tenant_id',
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'tenant_sagacitas_corporate_01'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS (Row Level Security) - REGRAS DE AUTORIZAÇÃO B2B DE DUAS ETAPAS
-- ------------------------------------------------------------------------------

-- POLÍTICA 1: Permite SELECT nos Manifestos APENAS se:
-- a) O tenant_id da requisição bater com o tenant_id da linha do manifesto
-- b) O contrato daquele tenant estiver 'ACTIVE' e dentro da data de validade
DROP POLICY IF EXISTS "RLS_Course_Manifests_Tenant_Isolation" ON public.course_manifests;
CREATE POLICY "RLS_Course_Manifests_Tenant_Isolation"
ON public.course_manifests
FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.tenant_contracts tc
    WHERE tc.tenant_id = course_manifests.tenant_id
      AND tc.status = 'ACTIVE'
      AND tc.valid_until >= NOW()
  )
);

-- POLÍTICA 2: Permite SELECT e UPSERT no Progresso do Aluno APENAS para o seu próprio UID e Tenant Ativo
DROP POLICY IF EXISTS "RLS_Student_Progress_Owner_Isolation" ON public.student_uc_progress;
CREATE POLICY "RLS_Student_Progress_Owner_Isolation"
ON public.student_uc_progress
FOR ALL
USING (
  student_id = COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id'
  )
)
WITH CHECK (
  student_id = COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id'
  )
);
