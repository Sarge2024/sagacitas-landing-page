import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TENANT_ID, isSupabaseConfigured } from '../services/supabaseClient';
import { isFirebaseAuthConfigured } from '../services/firebaseClient';

export const ServiceInspectorModal: React.FC = () => {
  const {
    showInspectorModal,
    toggleInspectorModal,
    logs,
    session,
    manifest,
    studentProgressList,
    navigationTree,
    resetDemoProgress,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'logs' | 'env' | 'manifest' | 'progress' | 'rls'>('logs');

  if (!showInspectorModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter']">
      <div className="bg-[#0b1c30] text-gray-200 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-gray-800 flex justify-between items-center bg-[#182a3f]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0075d5] text-2xl">developer_board</span>
            <div>
              <h2 className="font-['Hanken_Grotesk'] text-lg font-bold text-white">
                Sagacitas Player - SDK Inspector &amp; Services Audit
              </h2>
              <p className="font-mono text-xs text-gray-400">
                Dual-Auth Handshake (Firebase Auth + Supabase RLS Tenant Isolation)
              </p>
            </div>
          </div>
          <button
            onClick={toggleInspectorModal}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-gray-800 bg-[#0f2136] px-5 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? 'border-[#0075d5] text-[#0075d5] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            Logs ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'env'
                ? 'border-[#0075d5] text-[#0075d5] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">settings_suggest</span>
            Environment &amp; Auth Handshake
          </button>

          <button
            onClick={() => setActiveTab('rls')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'rls'
                ? 'border-[#0075d5] text-[#0075d5] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">shield</span>
            Políticas SQL (RLS)
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'manifest'
                ? 'border-[#0075d5] text-[#0075d5] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">data_object</span>
            Course Manifest JSON
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'progress'
                ? 'border-[#0075d5] text-[#0075d5] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">account_tree</span>
            DNT State Graph ({navigationTree.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed">
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum log gravado até o momento.</p>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded border text-xs flex items-start gap-3 ${
                      log.type === 'error'
                        ? 'bg-red-950/40 border-red-800 text-red-300'
                        : log.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : log.type === 'warning'
                        ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                    <span className="font-bold shrink-0 text-blue-400">[{log.service}]</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded border border-gray-800 space-y-2">
                <div className="text-sm font-bold text-blue-400 font-sans">Configurações Dual-Auth (.env.example)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-gray-500 block">VITE_TENANT_ID:</span>
                    <span className="text-emerald-400 font-bold">{TENANT_ID || 'tenant_sagacitas_corporate_01'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Firebase Auth Client:</span>
                    <span className={isFirebaseAuthConfigured() ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {isFirebaseAuthConfigured() ? 'Conectado a Projeto Firebase Live' : 'Modo Demonstrativo com JWT SDK'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Supabase Live Connection:</span>
                    <span className={isSupabaseConfigured() ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {isSupabaseConfigured() ? 'Conectado a projeto Supabase' : 'Modo Demonstrativo com Mock Client'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-900 rounded border border-gray-800 space-y-2">
                <div className="text-sm font-bold text-blue-400 font-sans">Sessão Autenticada (Dual-Auth Handshake)</div>
                <pre className="text-gray-300 bg-black/50 p-3 rounded overflow-x-auto text-[11px]">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-blue-400 font-sans flex items-center gap-2">
                <span className="material-symbols-outlined text-base">gavel</span>
                Políticas de Segurança SQL (Supabase RLS Script DDL)
              </div>
              <p className="text-gray-400 text-xs">
                Este script SQL (disponível em <code>/src/db/supabase_rls_policies.sql</code>) configura a leitura do JWT customizado do Firebase Auth e o isolamento por Tenant no Supabase:
              </p>
              <pre className="text-emerald-300 bg-black/70 p-4 rounded border border-gray-800 overflow-x-auto text-[11px] leading-relaxed">
{`-- 1. TABELA DE CONTRATOS DOS TENANTS
CREATE TABLE IF NOT EXISTS public.tenant_contracts (
  tenant_id VARCHAR(100) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'SUSPENDED'
  valid_until TIMESTAMPTZ NOT NULL,
  max_seats INT DEFAULT 1000
);

-- 2. FUNÇÃO AUXILIAR PARA LER TENANT DO JWT DO FIREBASE
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'tenant_sagacitas_corporate_01'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. POLÍTICA RLS PARA MANIFESTOS DOS CURSOS
CREATE POLICY "RLS_Course_Manifests_Tenant_Isolation"
ON public.course_manifests FOR SELECT USING (
  tenant_id = public.get_current_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.tenant_contracts tc
    WHERE tc.tenant_id = course_manifests.tenant_id
      AND tc.status = 'ACTIVE'
      AND tc.valid_until >= NOW()
  )
);`}
              </pre>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-blue-400 font-sans">
                Manifesto Carregado (Filtro por Tenant ID aplicado)
              </div>
              <pre className="text-emerald-300 bg-black/60 p-4 rounded border border-gray-800 overflow-x-auto text-[11px]">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-blue-400 font-sans">
                  Tabela student_uc_progress Fusionada com Grafo
                </div>
                <button
                  onClick={resetDemoProgress}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-sans text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Resetar Progresso Demo
                </button>
              </div>

              <div className="space-y-2">
                {navigationTree.map(node => (
                  <div
                    key={node.id}
                    className="p-3 bg-gray-900 rounded border border-gray-800 flex flex-wrap justify-between items-center gap-2"
                  >
                    <div>
                      <span className="font-bold text-white block">{node.title} ({node.id})</span>
                      <span className="text-gray-400 text-[11px]">Tipo: {node.type} • Ordem: {node.order}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">is_exempt_by_dnt:</span>
                      <span className={node.is_exempt_by_dnt ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                        {String(node.is_exempt_by_dnt)}
                      </span>

                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        node.state === 'COMPLETED'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          : node.state === 'IN_PROGRESS' || node.state === 'AVAILABLE'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          : node.state === 'REMEDIATION'
                          ? 'bg-red-900/60 text-red-300 border border-red-700'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {node.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-5 py-3 border-t border-gray-800 bg-[#0f2136] flex justify-between items-center">
          <span className="text-gray-400 text-[11px]">
            Sagacitas Player Headless LMS SDK v1.0.0
          </span>
          <button
            onClick={toggleInspectorModal}
            className="px-4 py-1.5 bg-[#0075d5] hover:bg-[#005daa] text-white rounded font-sans text-xs font-semibold transition-colors"
          >
            Fechar Inspector
          </button>
        </footer>
      </div>
    </div>
  );
};
