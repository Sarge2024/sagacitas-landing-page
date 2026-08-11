import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface StudentInvite {
  id: string;
  tenant_id: string;
  contract_id?: string;
  invite_token: string;
  email_destination: string;
  status: 'PENDING' | 'USED';
  created_at?: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class InviteService {
  private static LOCAL_STORAGE_KEY = 'sagacitas_student_invites';

  /**
   * Obtém a lista de convites gerados para um tenant específico
   */
  public static async getInvites(tenantId: string): Promise<StudentInvite[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('student_invites')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }
        return data as StudentInvite[];
      } catch (err: any) {
        console.warn('[InviteService] Erro ao consultar Supabase, usando contingência local:', err);
      }
    }

    // Fallback de contingência local
    return this.getLocalInvites().filter(inv => inv.tenant_id === tenantId);
  }

  /**
   * Cria um novo convite de estudante, validando os limites de assentos do contrato ativo
   */
  public static async createInvite(
    tenantId: string,
    email: string,
    maxSeats: number,
    contractId?: string
  ): Promise<StudentInvite> {
    const emailNormalized = email.toLowerCase().trim();
    if (!emailNormalized) {
      throw new Error('E-mail do colaborador é obrigatório.');
    }

    // 1. Verificar assentos consumidos (PENDING + USED)
    const existingInvites = await this.getInvites(tenantId);
    const activeCount = existingInvites.filter(
      inv => inv.status === 'PENDING' || inv.status === 'USED'
    ).length;

    if (activeCount >= maxSeats) {
      throw new Error(
        `Limite de assentos atingido. Seu contrato permite no máximo ${maxSeats} assentos (atualmente ${activeCount} em uso/pendentes).`
      );
    }

    // 2. Criar objeto de convite
    const newInvite: StudentInvite = {
      id: generateUUID(),
      tenant_id: tenantId,
      contract_id: contractId || `contract_${tenantId}`,
      invite_token: generateUUID(),
      email_destination: emailNormalized,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    // 3. Persistir
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('student_invites')
        .insert(newInvite);

      if (error) {
        throw new Error(`Erro ao salvar convite no Supabase: ${error.message}`);
      }
    } else {
      const local = this.getLocalInvites();
      local.push(newInvite);
      this.saveLocalInvites(local);
    }

    return newInvite;
  }

  // --- Auxiliares para Armazenamento Local ---
  private static getLocalInvites(): StudentInvite[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalInvites(invites: StudentInvite[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(invites));
    } catch (e) {
      console.error('[InviteService] Falha ao persistir convites localmente:', e);
    }
  }
}
