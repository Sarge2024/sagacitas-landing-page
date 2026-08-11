-- Criação da tabela de convites de estudantes
CREATE TABLE IF NOT EXISTS student_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  contract_id VARCHAR(255),
  invite_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  email_destination VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'USED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para otimização de consultas por tenant_id e por token de acesso
CREATE INDEX IF NOT EXISTS idx_student_invites_tenant_id ON student_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_invites_token ON student_invites(invite_token);

-- Habilitação do Row Level Security (RLS) para isolamento B2B
ALTER TABLE student_invites ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para o Tenant Admin e serviços integrados
-- (Os tokens JWT gerados via Dual-Auth injetam o tenant_id nas claims do Supabase)

CREATE POLICY "Permitir leitura de convites pelo tenant correspondente"
  ON student_invites
  FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant_sagacitas_corporate_01');

CREATE POLICY "Permitir geração de convites pelo tenant correspondente"
  ON student_invites
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant_sagacitas_corporate_01');
