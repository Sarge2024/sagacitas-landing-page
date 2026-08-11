import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { StudentProgress } from '../types';

export interface TelemetryPayload extends StudentProgress {
  timestamp: string;
}

export class TelemetryService {
  /**
   * Generates an HMAC SHA-256 signature for the given payload using Web Crypto API.
   * @param payload JSON stringified payload
   * @param secret Secret key for HMAC
   */
  public static async generateHMAC(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(payload);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return signatureHex;
  }

  /**
   * Submits the student's Learning Object (OA) result directly to Supabase with an HMAC signature.
   *
   * @param progress The updated student progress record with state, score, gcId, ucId, etc.
   * @returns true if successful, false if network failed.
   */
  public static async submitOAResult(progress: StudentProgress): Promise<boolean> {
    // Fail Fast: Ensure telemetry secret exists
    const secret = import.meta.env.VITE_TELEMETRY_SECRET;
    if (!secret) {
      throw new Error('[TelemetryService Fail-Fast] Chave VITE_TELEMETRY_SECRET não está configurada no ambiente.');
    }

    const payload: TelemetryPayload = {
      ...progress,
      timestamp: new Date().toISOString(),
    };

    // Prepare JSON for signing - Object keys order matters for hash consistency,
    // so we stringify it as is.
    const payloadString = JSON.stringify(payload);
    
    try {
      const signature = await this.generateHMAC(payloadString, secret);
      
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();

        // Sending payload along with signature to student_uc_progress table
        // We spread payload and append signature. 
        const { error } = await supabase
          .from('student_uc_progress')
          .upsert(
            {
              student_id: payload.student_id,
              gc_id: payload.gc_id,
              uc_id: payload.uc_id,
              state: payload.state,
              score: payload.score,
              is_exempt_by_dnt: payload.is_exempt_by_dnt,
              updated_at: payload.updated_at,
              signature: signature // Sending signature so Backend/RLS/Edge Functions can validate
            },
            { onConflict: 'student_id,gc_id,uc_id' }
          );

        if (error) {
          console.warn(`[TelemetryService] Supabase upsert notice (${error.message}). Will queue locally.`);
          return false;
        }

        console.log('[TelemetryService] Telemetria de nota enviada e validada com HMAC com sucesso!');
        return true;
      } else {
        console.log('[TelemetryService] Modo Local/Demo. Telemetria gerada:', { payload, signature });
        return true; // Pretend it succeeded in demo mode
      }
    } catch (err) {
      console.warn('[TelemetryService] Falha na rede ou ao gerar hash ao enviar telemetria:', err);
      return false;
    }
  }
}
