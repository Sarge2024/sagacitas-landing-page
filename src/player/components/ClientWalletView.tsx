import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { HeaderNav } from './HeaderNav';
import { SidebarNav } from './SidebarNav';
import { MobileNav } from './MobileNav';
import { InviteService, StudentInvite } from '../services/InviteService';

export const ClientWalletView: React.FC = () => {
  const { session } = usePlayerStore();
  const [invites, setInvites] = useState<StudentInvite[]>([]);
  const [emailInput, setEmailInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // 1. Obter informações de Tenant e Contrato do usuário logado
  const tenantId = session?.user.tenant_id || 'tenant_sagacitas_corporate_01';
  const contract = session?.authDetails?.tenantContract || {
    tenant_id: tenantId,
    company_name: 'Sagacitas Corporate B2B (Licenciado)',
    status: 'ACTIVE',
    valid_until: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
    max_seats: 10, // Menor limite para facilitar teste visual de estouro de limite
  };

  const maxSeats = contract.max_seats;

  // 2. Carregar lista de convites existentes
  const fetchInvites = async () => {
    try {
      const data = await InviteService.getInvites(tenantId);
      setInvites(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao carregar a lista de convites.');
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [tenantId]);

  // 3. Cálculos de assentos consumidos
  const activeInvitesCount = invites.filter(
    inv => inv.status === 'PENDING' || inv.status === 'USED'
  ).length;
  const availableSeats = Math.max(0, maxSeats - activeInvitesCount);
  const usagePercentage = Math.min(100, (activeInvitesCount / maxSeats) * 100);

  // 4. Submeter convite
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = emailInput.trim();
    if (!email) {
      setErrorMsg('Por favor, informe o e-mail do colaborador.');
      return;
    }

    setIsLoading(true);

    try {
      const newInvite = await InviteService.createInvite(
        tenantId,
        email,
        maxSeats,
        contract.tenant_id
      );

      setEmailInput('');
      setSuccessMsg(`Convite gerado com sucesso para ${email}!`);
      await fetchInvites();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao gerar o convite.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Copiar Link de Onboarding
  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = `${origin}/onboarding?token=${token}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } else {
      // Fallback para navegadores sem API de clipboard
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] h-full overflow-y-auto font-['Inter']">
      <HeaderNav />
      <SidebarNav />

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-[280px] w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pt-24 md:pb-12 transition-all">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-bold text-[#0b1c30] mb-2 tracking-tight">
            Gerenciamento de Acessos B2B
          </h1>
          <p className="text-base text-[#404753] max-w-2xl leading-relaxed">
            Administre os convites de acesso e as licenças do seu contrato corporativo. As inscrições ocorrem exclusivamente por envio de link com token criptográfico de uso único.
          </p>
        </div>

        {/* Contract & Seats Status Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Seat Statistics Card */}
          <div className="bg-white border border-[#c0c7d6] rounded-xl p-6 shadow-xs flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono text-[#005daa] bg-[#d3e4fe] px-2.5 py-1 rounded-full">
                  Licenciamento Ativo
                </span>
                <span className="text-xs text-[#707785] font-mono">
                  Validade: {new Date(contract.valid_until).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#0b1c30] mb-1">
                {contract.company_name}
              </h3>
              <p className="text-xs text-[#707785] mb-4">
                ID do Tenant: <code className="bg-[#eff4ff] px-1 py-0.5 rounded font-mono">{tenantId}</code>
              </p>
            </div>

            {/* Progress Bar & Seat Counts */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm font-semibold text-[#0b1c30]">
                <span>Assentos Utilizados</span>
                <span>{activeInvitesCount} / {maxSeats} Licenças</span>
              </div>
              <div className="w-full bg-[#eff4ff] h-3.5 rounded-full overflow-hidden border border-[#c0c7d6]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    usagePercentage >= 90
                      ? 'bg-[#ba1a1a]'
                      : usagePercentage >= 70
                      ? 'bg-amber-500'
                      : 'bg-[#006c49]'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#707785]">
                <span>{availableSeats} assentos restantes</span>
                <span>{usagePercentage.toFixed(0)}% ocupado</span>
              </div>
            </div>
          </div>

          {/* New Invite Form Card */}
          <div className="bg-white border border-[#c0c7d6] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#0b1c30] mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg text-[#005daa]">group_add</span>
                Convidar Colaborador
              </h4>
              <p className="text-xs text-[#404753] leading-relaxed">
                Informe o e-mail corporativo. O link gerado expirará automaticamente ao ser utilizado.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#707785] uppercase tracking-wider mb-1">
                  E-MAIL DE DESTINO
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  disabled={isLoading || availableSeats === 0}
                  className="w-full border border-[#c0c7d6] rounded-lg p-2.5 text-xs text-[#0b1c30] focus:ring-1 focus:ring-[#005daa] focus:outline-hidden bg-[#eff4ff]/30 placeholder-[#707785]"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || availableSeats === 0}
                className="w-full py-2.5 px-4 bg-[#005daa] text-white text-xs font-semibold rounded-lg hover:bg-[#0075d5] disabled:bg-[#eff4ff] disabled:text-[#707785] disabled:cursor-not-allowed transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                    <span>Gerando...</span>
                  </>
                ) : availableSeats === 0 ? (
                  <span>Limite Excedido</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Emitir Convite</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Invites List Section */}
        <div className="bg-white border border-[#c0c7d6] rounded-xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#c0c7d6] flex justify-between items-center bg-[#f8f9ff]">
            <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#0b1c30]">
              Histórico de Convites Emitidos
            </h4>
            <span className="text-xs font-mono font-bold text-[#005daa] bg-[#d3e4fe] px-2.5 py-1 rounded-full">
              {invites.length} convite(s) total
            </span>
          </div>

          <div className="overflow-x-auto">
            {invites.length === 0 ? (
              <div className="p-12 text-center text-[#707785] space-y-2">
                <span className="material-symbols-outlined text-4xl text-[#c0c7d6]">drafts</span>
                <p className="text-sm font-medium">Nenhum convite emitido para este tenant.</p>
                <p className="text-xs">Digite um e-mail acima para gerar o primeiro token de convite.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-[#eff4ff] text-[#404753] font-bold border-b border-[#c0c7d6]">
                    <th className="p-4">E-mail do Colaborador</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Criado em</th>
                    <th className="p-4">Ações / Token de Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c7d6] text-[#0b1c30]">
                  {invites.map((invite) => {
                    const isPending = invite.status === 'PENDING';
                    return (
                      <tr key={invite.id} className="hover:bg-[#f8f9ff] transition-colors">
                        <td className="p-4 font-semibold">{invite.email_destination}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {invite.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#707785]">
                          {invite.created_at
                            ? new Date(invite.created_at).toLocaleString('pt-BR')
                            : 'N/A'}
                        </td>
                        <td className="p-4 flex items-center gap-2">
                          {isPending ? (
                            <button
                              onClick={() => handleCopyLink(invite.invite_token)}
                              className="px-3 py-1.5 bg-[#005daa] text-white hover:bg-[#0075d5] rounded font-medium transition-colors flex items-center gap-1 shrink-0"
                            >
                              <span className="material-symbols-outlined text-xs">
                                {copiedToken === invite.invite_token ? 'check' : 'content_copy'}
                              </span>
                              <span>
                                {copiedToken === invite.invite_token ? 'Copiado!' : 'Copiar Link'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[#707785] italic flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">done_all</span>
                              Inscrição Concluída
                            </span>
                          )}
                          <span className="font-mono text-[#707785] text-[10px] truncate max-w-[120px] bg-[#eff4ff] px-1.5 py-0.5 rounded ml-2 border border-[#c0c7d6]/30">
                            {invite.invite_token}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
      <MobileNav />
    </div>
  );
};
