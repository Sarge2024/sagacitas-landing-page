import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { AuthHandshakeService } from '../services/AuthHandshakeService';
import { AlertCircle } from 'lucide-react';

export const HandshakeView: React.FC = () => {
  const { runDualAuthHandshake, isLoading, errorMessage, statusMessage, session } = usePlayerStore();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState<string>('aluno.sagacitas@empresa.com.br');
  const [passwordInput, setPasswordInput] = useState<string>('@12345');

  useEffect(() => {
    // Apenas executa handshake automático se houver um token explícito na URL
    const token = AuthHandshakeService.extractTokenFromParams();
    if (token) {
      runDualAuthHandshake({ customToken: token });
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runDualAuthHandshake({
      email: emailInput.trim(),
      pass: passwordInput.trim(),
    });
  };

  const handleGoogleSubmit = () => {
    runDualAuthHandshake({
      useGoogle: true,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafb]/90 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <main className="bg-[#162125] border border-slate-800 shadow-2xl rounded-lg max-w-[440px] w-full overflow-hidden flex flex-col relative">
        {/* Header - White Theme resembling Screenshot */}
        <div className="bg-[#f8fafb] flex justify-between items-center p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-[#002630] font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            Player de Treinamentos
          </h3>
          <span className="text-xs text-[#002630]/60 font-mono font-semibold">Sagacitas LMS</span>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50 p-6 text-center">
            <div className="w-10 h-10 border-4 border-[#79f7ea]/20 border-t-[#79f7ea] rounded-full animate-spin" />
            <h4 className="text-white font-headline font-bold text-sm">
              {statusMessage || 'Processando Handshake...'}
            </h4>
            <p className="text-xs text-slate-400 font-mono">Validação de Acesso Corporativo</p>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 bg-red-950/50 border border-red-800 text-red-200 p-4 rounded text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-bold block mb-1">Erro de Validação</span>
                <span className="font-mono">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Handshake/Session success banner */}
          {session && !isLoading && (
            <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-200 p-4 rounded text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">verified</span>
                Acesso Autorizado!
              </p>
              <p className="text-[11px] font-mono text-slate-300">
                Conectado como: {session.user.email}
              </p>
            </div>
          )}

          {/* Navigation tabs */}
          <div className="flex border-b border-slate-800 text-sm font-headline">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 pb-3 text-center border-b-2 font-bold tracking-tight transition-all ${
                authMode === 'login'
                  ? 'border-[#79f7ea] text-[#79f7ea]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 pb-3 text-center border-b-2 font-bold tracking-tight transition-all ${
                authMode === 'signup'
                  ? 'border-[#79f7ea] text-[#79f7ea]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {authMode === 'login' ? (
            <div className="space-y-6">
              {/* Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleSubmit}
                className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-slate-50 text-[#002630] rounded font-bold text-sm transition-all shadow-md active:scale-98"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Entrar com Google
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Email credentials form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">mail</span> E-MAIL
                  </label>
                  <input
                    required
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded p-3 focus:outline-none focus:border-[#79f7ea] transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> SENHA
                  </label>
                  <input
                    required
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded p-3 focus:outline-none focus:border-[#79f7ea] transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#002630] border border-[#79f7ea]/30 text-white hover:bg-[#002630]/80 py-3 font-bold rounded shadow-md hover:border-[#79f7ea]/50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 mt-6"
                >
                  Entrar
                </button>
              </form>
            </div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-[#79f7ea]/40">
                admin_panel_settings
              </span>
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-white text-sm">Contas Gerenciadas</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  As contas de estudantes e acessos licenciados aos cursos corporativos são gerenciadas pelos administradores da empresa contratante.
                </p>
                <p className="text-xs text-[#79f7ea] font-medium pt-2">
                  Use as credenciais fornecidas pelo seu gestor para entrar.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
