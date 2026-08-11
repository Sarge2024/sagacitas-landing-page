import { CourseManifest, StudentProgress, MergedNodeProgress, DntRoutingInstruction, OAState } from '../types';
import { getSupabaseClient, isSupabaseConfigured, TENANT_ID } from './supabaseClient';
import { CourseManifestService } from './CourseManifestService';
import { StudentProgressService } from './StudentProgressService';

export class CourseEngineService {
  /**
   * Fetches the Course Manifest JSON for a given course (gcId) and tenant (tenantId).
   * Queries Supabase `courses` or `course_manifests` table with fail-fast validations.
   */
  public static async fetchManifest(gcId: string, tenantId?: string): Promise<CourseManifest> {
    const activeTenant = tenantId || TENANT_ID || 'tenant_sagacitas_corporate_01';

    if (!gcId) {
      throw new Error('[CourseEngineService Fail-Fast] Identificador do curso (gcId) é obrigatório.');
    }

    if (!activeTenant) {
      throw new Error('[CourseEngineService Fail-Fast] Tenant ID ausente. Impossível carregar manifesto B2B.');
    }

    // Direct Supabase fetch attempt
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        
        // Try `course_manifests` or fallback to `courses`
        const { data, error } = await supabase
          .from('course_manifests')
          .select('*')
          .eq('gc_id', gcId)
          .eq('tenant_id', activeTenant)
          .single();

        if (!error && data && data.manifest) {
          return data.manifest as CourseManifest;
        }

        // Try `courses` table if `course_manifests` did not return
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('gc_id', gcId)
          .eq('tenant_id', activeTenant)
          .single();

        if (!courseError && courseData && courseData.manifest) {
          return courseData.manifest as CourseManifest;
        }
      } catch (err) {
        console.warn('[CourseEngineService] Falha na rede ao consultar Supabase, ativando fallback resiliente:', err);
      }
    }

    // Delegate to CourseManifestService fallback
    return CourseManifestService.fetchManifest(gcId);
  }

  /**
   * Fetches the student's progress for a given course (gcId) and student (studentId).
   * Queries Supabase `student_uc_progress` table with fail-fast validations.
   */
  public static async fetchProgress(gcId: string, studentId: string): Promise<StudentProgress[]> {
    if (!gcId) {
      throw new Error('[CourseEngineService Fail-Fast] Identificador do curso (gcId) é obrigatório.');
    }

    if (!studentId) {
      throw new Error('[CourseEngineService Fail-Fast] Identificador do aluno (studentId) é obrigatório.');
    }

    // Direct Supabase fetch attempt
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('student_uc_progress')
          .select('*')
          .eq('gc_id', gcId)
          .eq('student_id', studentId);

        if (!error && data && data.length > 0) {
          return data as StudentProgress[];
        }
      } catch (err) {
        console.warn('[CourseEngineService] Falha na rede ao consultar progresso no Supabase, usando fallback local:', err);
      }
    }

    // Delegate to StudentProgressService fallback
    return StudentProgressService.fetchStudentProgress(gcId, studentId);
  }

  /**
   * Pure Helper: Merges the Course Manifest JSON execution graph with student progress records.
   * Calculates prerequisite resolution (DAG traversal) and node states.
   */
  public static aggregateTrail(
    manifest: CourseManifest | null,
    progressList: StudentProgress[]
  ): MergedNodeProgress[] {
    if (!manifest || !manifest.execution_graph || !manifest.execution_graph.nodes) {
      return [];
    }

    return StudentProgressService.syncStateWithManifest(manifest, progressList);
  }

  /**
   * Pure Helper: Evaluates DNT (Diagnostic & Acceleration Engine) routing for a given UC.
   * If `is_exempt_by_dnt === true`, returns instruction to hide "Propósito" and "Conteúdo"
   * and navigate straight to "Validação".
   */
  public static evaluateDntRouting(
    ucId: string,
    progressList: StudentProgress[],
    manifest?: CourseManifest | null
  ): DntRoutingInstruction {
    if (!ucId) {
      return {
        uc_id: '',
        is_exempt_by_dnt: false,
        skipToValidation: false,
        hiddenPhases: [],
        activePhase: 'proposito',
        message: 'UC não especificada. Rota padrão mantida.',
      };
    }

    const progressRecord = progressList.find(p => p.uc_id === ucId);
    
    // Check if the student is exempt by DNT (and not currently under REMEDIATION)
    const isExempt = Boolean(
      progressRecord &&
      progressRecord.is_exempt_by_dnt &&
      progressRecord.state !== 'REMEDIATION'
    );

    if (isExempt) {
      return {
        uc_id: ucId,
        is_exempt_by_dnt: true,
        skipToValidation: true,
        hiddenPhases: ['proposito', 'conteudo'],
        activePhase: 'validacao',
        message: `[DNT Engine] Isenção por Diagnóstico Ativa para ${ucId}. OAs de Propósito e Conteúdo ocultados. Rota Acelerada ativada para 'Validação'.`,
      };
    }

    const isRemediation = progressRecord?.state === 'REMEDIATION';

    return {
      uc_id: ucId,
      is_exempt_by_dnt: false,
      skipToValidation: false,
      hiddenPhases: [],
      activePhase: 'proposito',
      message: isRemediation
        ? `[DNT Engine] Modulo sob Remedição após nota insuficiente. Rota completa reativada a partir de 'Propósito'.`
        : `[DNT Engine] Trilha padrão ativa. Iniciando por 'Propósito'.`,
    };
  }
}
