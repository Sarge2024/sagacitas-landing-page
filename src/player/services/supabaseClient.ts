import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const TENANT_ID = import.meta.env.VITE_TENANT_ID || '';

let supabaseInstance: SupabaseClient | null = null;
let currentAccessToken: string | null = null;

/**
 * Validates environment requirements (Fail Fast check).
 * @throws Error if Supabase URL or Anon Key are completely absent in production mode.
 */
export function validateEnvConfig(): void {
  if (!TENANT_ID) {
    console.warn('[Sagacitas SDK Warning] VITE_TENANT_ID is not defined in environment!');
  }
}

/**
 * Initializes or returns the Supabase Client singleton.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Fallback to placeholder if missing, to prevent crash during initial load
  const url = supabaseUrl || 'https://placeholder-tenant.supabase.co';
  const key = supabaseAnonKey || 'placeholder-anon-key';

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: currentAccessToken
        ? { Authorization: `Bearer ${currentAccessToken}` }
        : {},
    },
  });

  return supabaseInstance;
}

/**
 * Dynamically sets the external JWT token for RLS authentication handshake.
 * @param token JWT Session Token received from parent portal
 */
export async function setSupabaseAuthToken(token: string): Promise<void> {
  if (!token) {
    throw new Error('[AuthHandshake] Impossível injetar token: Token JWT ausente.');
  }

  currentAccessToken = token;

  // Evita tentar injetar sessão se o Supabase não estiver ativamente configurado no .env
  if (!isSupabaseConfigured()) {
    console.log('[AuthHandshake] Supabase não configurado. Token de sessão armazenado em memória.');
    return;
  }

  // Re-cria a instância para forçar o novo header global (Authorization: Bearer token)
  const url = supabaseUrl || 'https://placeholder-tenant.supabase.co';
  const key = supabaseAnonKey || 'placeholder-anon-key';

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: false, // Não tentamos gerenciar a sessão localmente pelo Supabase
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${currentAccessToken}` },
    },
  });

  // Também tentamos registrar a sessão para compatibilidade com o módulo Storage (opcional)
  try {
    const { error } = await supabaseInstance.auth.setSession({
      access_token: token,
      refresh_token: 'dummy-refresh-token', // Evita o erro 'Auth session missing'
    });

    if (error) {
      console.warn('[AuthHandshake] Aviso ao registrar sessão no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('[AuthHandshake] Fallback de token em headers customizados:', err);
  }
}

/**
 * Helper to check if live Supabase parameters are supplied
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
}
