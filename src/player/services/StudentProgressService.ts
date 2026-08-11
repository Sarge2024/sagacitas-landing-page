import { CourseManifest, StudentProgress, MergedNodeProgress, OAState } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export class StudentProgressService {
  /**
   * Fetches the student's progress for a specific course (gc_id) from Supabase.
   * Table: `student_uc_progress`
   */
  public static async fetchStudentProgress(gcId: string, studentId: string): Promise<StudentProgress[]> {
    if (!gcId) {
      throw new Error('[StudentProgressService Fail-Fast] Identificador do curso (gcId) é obrigatório.');
    }

    if (isSupabaseConfigured() && studentId) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('student_uc_progress')
          .select('*')
          .eq('gc_id', gcId)
          .eq('student_id', studentId);

        if (error) {
          console.warn(`[StudentProgressService] Supabase query warning (${error.message}). Utilizando progresso local...`);
        } else if (data && data.length > 0) {
          return data as StudentProgress[];
        }
      } catch (err) {
        console.warn('[StudentProgressService] Falha na rede ao consultar progresso, usando local:', err);
      }
    }

    // Default mock progress setup matching Screen 3 design:
    // Node 1 (uc_01_booleana): COMPLETED (Score 95, DNT exempt)
    // Node 2 (uc_02_condicionais): IN_PROGRESS (Score null)
    // Node 3 (uc_03_eficiencia): LOCKED
    // Node 4 (uc_04_projeto_final): LOCKED
    return [
      {
        student_id: studentId || 'std_892341',
        gc_id: gcId,
        uc_id: 'uc_01_booleana',
        state: 'COMPLETED',
        score: 95,
        is_exempt_by_dnt: true,
        updated_at: new Date().toISOString(),
      },
      {
        student_id: studentId || 'std_892341',
        gc_id: gcId,
        uc_id: 'uc_02_condicionais',
        state: 'IN_PROGRESS',
        score: null,
        is_exempt_by_dnt: false,
        updated_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Fuses the CourseManifest JSON execution graph with the Student Progress DB records.
   * Calculates the exact state for each node: LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, REMEDIATION.
   *
   * Rules:
   * 1. If DB progress record exists for node, use its `state`, `score`, `is_exempt_by_dnt`.
   * 2. If node is marked `COMPLETED` or `is_exempt_by_dnt === true` (without remediation), it is COMPLETED.
   * 3. A node is AVAILABLE if ALL its prerequisites (from nodes/edges) are COMPLETED or is_exempt_by_dnt.
   * 4. Otherwise, node is LOCKED.
   */
  public static syncStateWithManifest(
    manifest: CourseManifest,
    progressList: StudentProgress[]
  ): MergedNodeProgress[] {
    if (!manifest || !manifest.execution_graph || !manifest.execution_graph.nodes) {
      return [];
    }

    const nodes = manifest.execution_graph.nodes;
    const progressMap = new Map<string, StudentProgress>();
    progressList.forEach(p => progressMap.set(p.uc_id, p));

    // Sort nodes by order
    const sortedNodes = [...nodes].sort((a, b) => a.order - b.order);

    // Track completed set for graph prerequisite resolution
    const completedOrExemptSet = new Set<string>();

    // Initial pass: populate completed set
    sortedNodes.forEach(node => {
      const prog = progressMap.get(node.id);
      if (prog) {
        if (prog.state === 'COMPLETED' || (prog.is_exempt_by_dnt && prog.state !== 'REMEDIATION')) {
          completedOrExemptSet.add(node.id);
        }
      }
    });

    // Secondary pass: compute merged states
    return sortedNodes.map((node, index) => {
      const prog = progressMap.get(node.id);

      // Check graph prerequisites
      const prerequisitesMet = node.prerequisites.every(prereqId =>
        completedOrExemptSet.has(prereqId)
      );

      // Node order 1 with no prerequisites is automatically available
      const isFirstNode = index === 0;
      const isAvailableByGraph = prerequisitesMet || isFirstNode;

      let computedState: OAState = 'LOCKED';
      let score: number | null = null;
      let isExempt = false;

      if (prog) {
        score = prog.score;
        isExempt = prog.is_exempt_by_dnt;
        computedState = prog.state;

        // If in DB it was set to AVAILABLE but prerequisites are lost, fallback
        if (computedState === 'AVAILABLE' && !isAvailableByGraph) {
          computedState = 'LOCKED';
        }
      } else {
        // No DB record yet
        computedState = isAvailableByGraph ? 'AVAILABLE' : 'LOCKED';
      }

      return {
        ...node,
        state: computedState,
        score,
        is_exempt_by_dnt: isExempt,
        is_available: computedState !== 'LOCKED',
        can_skip_by_dnt: isExempt && computedState !== 'REMEDIATION',
      };
    });
  }
}
