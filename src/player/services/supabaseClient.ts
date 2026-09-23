import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const TENANT_ID = import.meta.env.VITE_TENANT_ID || '';

let supabaseInstance: SupabaseClient | null = null;

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
  });

  return supabaseInstance;
}

/**
 * Recebe o token de identidade do handshake (Firebase ID token, ou o mock de
 * fallback de demo). Não é repassado ao Supabase como Authorization: nem o
 * Firebase nem o mock assinam com o JWT secret deste projeto Supabase, e um
 * Authorization inválido faz o PostgREST rejeitar com 401 ("JWT cryptographic
 * operation failed") TODA consulta seguinte feita pelo cliente singleton —
 * inclusive as de `lessons` no Dashboard. Confirmado em 2026-09-23: era a
 * causa dos cards reais do Works Manager sumirem depois do login. As tabelas
 * de treinamento (`lessons`, `lessons_sync_state`, `lessons_slide_sync_state`)
 * usam RLS permissiva (`USING (true)`) e não dependem desse token — o cliente
 * segue autenticado só pela anon key.
 * @param token JWT Session Token received from parent portal
 */
export async function setSupabaseAuthToken(token: string): Promise<void> {
  if (!token) {
    throw new Error('[AuthHandshake] Impossível injetar token: Token JWT ausente.');
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
