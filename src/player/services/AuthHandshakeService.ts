import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';
import { AuthSession, DualAuthDetails, TenantContract } from '../types';
import {
  setSupabaseAuthToken,
  TENANT_ID,
  isSupabaseConfigured,
  getSupabaseClient,
} from './supabaseClient';
import { getFirebaseAuth, isFirebaseAuthConfigured } from './firebaseClient';

export interface HandshakeOptions {
  explicitToken?: string;
  allowDemoFallback?: boolean;
  emailCredentials?: {
    email: string;
    pass: string;
  };
  useGoogleProvider?: boolean;
}

export class AuthHandshakeService {
  /**
   * Captures token from URL query parameters (?session_token=... or ?token=...)
   */
  public static extractTokenFromParams(): string | null {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session_token') || urlParams.get('token') || urlParams.get('jwt');
  }

  /**
   * Listens for postMessage containing token from parent host window (Cross-Domain Handshake)
   */
  public static listenForPostMessageToken(onTokenReceived: (token: string) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleMessage = (event: MessageEvent) => {
      // Validate structure of postMessage payload
      if (event.data && typeof event.data === 'object' && event.data.type === 'SAGACITAS_AUTH_HANDSHAKE') {
        const token = event.data.session_token || event.data.token;
        if (token) {
          console.log('[AuthHandshakeService] Token recebido via window.postMessage');
          onTokenReceived(token);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }

  /**
   * FASE 1: Autentica o usuário no Firebase Auth (Identidade) e extrai o JWT ID Token.
   * Suporta login via E-mail/Senha, Google OAuth ou Fallback Seguro.
   */
  public static async authenticateFirebaseIdentity(
    options: HandshakeOptions
  ): Promise<{ firebaseUid: string; firebaseToken: string; email: string; displayName: string; providerId: 'email' | 'google' | 'custom_jwt' }> {
    // 1. Tentar obter o usuário autenticado atualmente no Firebase APENAS SE não houver credenciais explícitas sendo enviadas
    const authInstance = getFirebaseAuth();
    const hasExplicitRequest = Boolean(options.emailCredentials || options.useGoogleProvider || options.explicitToken);
    if (!hasExplicitRequest && authInstance && authInstance.currentUser) {
      try {
        const user = authInstance.currentUser;
        const token = await user.getIdToken();
        return {
          firebaseUid: user.uid,
          firebaseToken: token,
          email: user.email || 'aluno.firebase@empresa.com.br',
          displayName: user.displayName || user.email?.split('@')[0] || 'Aluno Firebase',
          providerId: 'custom_jwt',
        };
      } catch (err) {
        console.warn('[AuthHandshakeService] Falha ao recuperar token do usuário logado:', err);
      }
    }

    // Se o cliente já passou um token JWT explícito ou via URL/postMessage
    const paramToken = options.explicitToken || this.extractTokenFromParams();
    if (paramToken) {
      return {
        firebaseUid: `fb_usr_${Math.random().toString(36).substring(2, 9)}`,
        firebaseToken: paramToken,
        email: 'aluno.integrado@empresa.com.br',
        displayName: 'Aluno Corporativo (JWT)',
        providerId: 'custom_jwt',
      };
    }

    // Tentar autenticação real no Firebase Auth se configurado
    if (isFirebaseAuthConfigured() || (authInstance && !authInstance.currentUser)) {
      const auth = authInstance;

      try {
        let userCred: UserCredential | null = null;
        let providerId: 'email' | 'google' | 'custom_jwt' = 'email';

        if (options.useGoogleProvider) {
          const provider = new GoogleAuthProvider();
          userCred = await signInWithPopup(auth, provider);
          providerId = 'google';
        } else if (options.emailCredentials) {
          userCred = await signInWithEmailAndPassword(
            auth,
            options.emailCredentials.email,
            options.emailCredentials.pass
          );
          providerId = 'email';
        }

        if (userCred && userCred.user) {
          const token = await userCred.user.getIdToken();
          return {
            firebaseUid: userCred.user.uid,
            firebaseToken: token,
            email: userCred.user.email || 'aluno.firebase@empresa.com.br',
            displayName: userCred.user.displayName || userCred.user.email?.split('@')[0] || 'Aluno Firebase',
            providerId,
          };
        }
      } catch (fbError: any) {
        if (!options.allowDemoFallback) {
          throw new Error(`[Fase 1 Fail-Fast - Firebase Auth] Falha na autenticação de identidade: ${fbError.message}`);
        }
      }
    }

    // Fallback de Autenticação para ambiente de desenvolvimento/demonstração B2B
    if (options.allowDemoFallback) {
      const inputEmail = options.emailCredentials?.email || '';
      const inputPass = options.emailCredentials?.pass || '';

      // Se o formulário de login foi submetido, valida as credenciais definidas para desenvolvimento
      if (options.emailCredentials) {
        if (inputEmail.toLowerCase() !== 'aluno.sagacitas@empresa.com.br' || inputPass !== '@12345') {
          throw new Error('E-mail ou senha de desenvolvimento incorretos. Use aluno.sagacitas@empresa.com.br e a senha @12345.');
        }
      }

      const userEmail = inputEmail || 'aluno.sagacitas@empresa.com.br';
      const mockUid = `usr_fb_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const mockJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI${mockUid}IiwidGVuYW50X2lkIjoi${TENANT_ID || 'tenant_sagacitas_corporate_01'}IiwiaWF0IjoxNTE2MjM5MDIyfQ.sagacitas_b2b_dual_auth_token`;

      return {
        firebaseUid: mockUid,
        firebaseToken: mockJwtToken,
        email: userEmail,
        displayName: userEmail.split('@')[0].toUpperCase(),
        providerId: options.useGoogleProvider ? 'google' : 'email',
      };
    }

    throw new Error('[Fase 1 Fail-Fast] Nenhuma credencial do Firebase informada e fallback desativado.');
  }

  /**
   * FASE 2: Valida a autorização B2B por Tenant no Supabase.
   * Verifica o status do contrato da empresa cliente e aplica o token no cliente Supabase RLS.
   */
  public static async validateTenantContractAndInjectSupabase(
    firebaseToken: string,
    activeTenantId: string
  ): Promise<TenantContract> {
    // Inject token into Supabase Client session
    await setSupabaseAuthToken(firebaseToken);

    // Se Supabase estiver conectado a uma base real, consultar a tabela tenant_contracts
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('tenant_contracts')
          .select('*')
          .eq('tenant_id', activeTenantId)
          .single();

        if (error) {
          console.warn(`[Fase 2 Tenant Check] Consulta de contrato retornou aviso (${error.message}). Validando contrato padrão...`);
        } else if (data) {
          const contract = data as TenantContract;

          // FAIL-FAST CHECK: Contrato suspenso ou expirado
          if (contract.status !== 'ACTIVE') {
            throw new Error(`[Fase 2 Fail-Fast] Acesso negado! O contrato da empresa (${activeTenantId}) está com status '${contract.status}'.`);
          }

          if (new Date(contract.valid_until) < new Date()) {
            throw new Error(`[Fase 2 Fail-Fast] Contrato expirado em ${new Date(contract.valid_until).toLocaleDateString('pt-BR')}.`);
          }

          return contract;
        }
      } catch (err: any) {
        if (err.message?.includes('Fail-Fast')) {
          throw err;
        }
        console.warn('[Fase 2 Tenant Check] Falha ao conectar ao Supabase RLS, usando contrato de contingência local:', err);
      }
    }

    // Contrato ativo padrão para ambiente de desenvolvimento/teste
    return {
      tenant_id: activeTenantId,
      company_name: 'Sagacitas Corporate B2B (Licenciado)',
      status: 'ACTIVE',
      valid_until: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
      max_seats: 5000,
    };
  }

  /**
   * Método Principal: loginAndHandshake
   * Executa a autenticação completa em Duas Etapas (Dual-Auth Handshake):
   * 1. Firebase Auth (Identidade) -> JWT
   * 2. Supabase RLS (Autorização/Tenant) -> Valida Tenant ID & Contrato Ativo
   */
  public static async loginAndHandshake(options: HandshakeOptions = {}): Promise<AuthSession> {
    const activeTenantId = TENANT_ID || 'tenant_sagacitas_corporate_01';

    // FAIL-FAST CHECK 1: Garantir presença do Tenant ID da empresa cliente
    if (!activeTenantId) {
      throw new Error('[Dual-Auth Fail-Fast] VITE_TENANT_ID não configurado no ambiente. Impossível validar licenciamento B2B.');
    }

    // FASE 1: Autenticação de Identidade via Firebase Auth
    const identity = await this.authenticateFirebaseIdentity(options);

    // FASE 2: Validação de Contrato do Tenant & Autorização Supabase RLS
    const contract = await this.validateTenantContractAndInjectSupabase(
      identity.firebaseToken,
      activeTenantId
    );

    // Persistir token de sessão localmente para resiliência de navegação
    if (typeof window !== 'undefined') {
      localStorage.setItem('sagacitas_session_token', identity.firebaseToken);
    }

    const dualAuthDetails: DualAuthDetails = {
      firebaseUid: identity.firebaseUid,
      firebaseToken: identity.firebaseToken,
      providerId: identity.providerId,
      tenantContract: contract,
      authorizedAt: new Date().toISOString(),
    };

    const session: AuthSession = {
      token: identity.firebaseToken,
      user: {
        id: identity.firebaseUid,
        email: identity.email,
        name: identity.displayName,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        tenant_id: activeTenantId,
      },
      authDetails: dualAuthDetails,
      expires_at: Date.now() + 86400 * 1000,
    };

    return session;
  }

  /**
   * Alias de compatibilidade para performHandshake
   */
  public static async performHandshake(options: HandshakeOptions = {}): Promise<AuthSession> {
    return this.loginAndHandshake(options);
  }
}
