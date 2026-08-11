import { StudentProgress, OAState } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface ValidationResult {
  success: boolean;
  newState: OAState;
  score: number;
  is_exempt_by_dnt: boolean;
  remediationTriggered: boolean;
  message: string;
  updatedProgress: StudentProgress;
}

export class ValidationEngineService {
  /**
   * Submits student score for a Learning Object (uc_id) and computes DNT status.
   *
   * DNT Engine Logic:
   * - If score >= 70: State becomes COMPLETED.
   * - If score < 70 (Reprovação):
   *     State becomes REMEDIATION and is_exempt_by_dnt is forced to FALSE,
   *     revoking the DNT exemption the student originally received.
   *
   * @param gcId Course ID (Grupo Curricular)
   * @param ucId Learning Object ID (Unidade Curricular)
   * @param score Numerical score (0-100)
   * @param studentId Authenticated student ID
   * @param currentExemptStatus Existing DNT exemption status
   */
  public static async submitOAScore(
    gcId: string,
    ucId: string,
    score: number,
    studentId: string = 'std_892341',
    currentExemptStatus: boolean = false
  ): Promise<ValidationResult> {
    // Fail Fast: Validate required inputs
    if (!gcId || !ucId) {
      throw new Error('[ValidationEngineService Fail-Fast] Identificadores gcId e ucId são obrigatórios.');
    }

    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
      throw new Error('[ValidationEngineService Fail-Fast] A nota deve ser um valor numérico entre 0 e 100.');
    }

    const PASSING_THRESHOLD = 70;
    const isPassed = score >= PASSING_THRESHOLD;

    // DNT Motor logic computation
    let newState: OAState = isPassed ? 'COMPLETED' : 'REMEDIATION';

    // If score < 70, force is_exempt_by_dnt = false (Revoke DNT exemption!)
    let is_exempt_by_dnt = isPassed ? currentExemptStatus : false;
    const remediationTriggered = !isPassed;

    const message = isPassed
      ? `Aprovação confirmada! Nota: ${score}%. Objeto de Aprendizagem marcado como CONCLUÍDO.`
      : `Reprovação (Nota: ${score}% < 70%). Estado alterado para REMEDIAÇÃO. Isenção DNT REVOGADA (is_exempt_by_dnt = false).`;

    const updatedProgress: StudentProgress = {
      student_id: studentId,
      gc_id: gcId,
      uc_id: ucId,
      state: newState,
      score,
      is_exempt_by_dnt,
      updated_at: new Date().toISOString(),
    };

    // Attempt Supabase database update if client configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();

        // Upsert record into student_uc_progress table
        const { error } = await supabase
          .from('student_uc_progress')
          .upsert(
            {
              student_id: studentId,
              gc_id: gcId,
              uc_id: ucId,
              state: newState,
              score: score,
              is_exempt_by_dnt: is_exempt_by_dnt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'student_id,gc_id,uc_id' }
          );

        if (error) {
          console.warn(`[ValidationEngineService] Supabase upsert notice (${error.message}). Syncing locally...`);
        } else {
          console.log('[ValidationEngineService] Registro de nota sincronizado no Supabase via RLS!');
        }
      } catch (err) {
        console.warn('[ValidationEngineService] Erro na requisição Supabase:', err);
      }
    }

    return {
      success: true,
      newState,
      score,
      is_exempt_by_dnt,
      remediationTriggered,
      message,
      updatedProgress,
    };
  }
}
