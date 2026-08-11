import { create } from 'zustand';
import {
  CourseManifest,
  StudentProgress,
  MergedNodeProgress,
  DntRoutingInstruction,
} from '../types';
import { CourseEngineService } from '../services/CourseEngineService';
import { TENANT_ID } from '../services/supabaseClient';

export interface CourseState {
  // Store State
  manifest: CourseManifest | null;
  studentProgress: StudentProgress[];
  currentActiveUc: string | null;
  activeNode: MergedNodeProgress | null;
  dntInstruction: DntRoutingInstruction | null;
  isLoading: boolean;
  errorMessage: string | null;
  statusMessage: string | null;

  // Actions & Selectors
  loadCourse: (gcId: string, studentId?: string, tenantId?: string) => Promise<void>;
  getAggregatedTrail: () => MergedNodeProgress[];
  evaluateDntRouting: (ucId: string) => DntRoutingInstruction;
  selectActiveUc: (ucId: string) => void;
  updateStudentProgress: (ucId: string, newState: StudentProgress['state'], score?: number | null) => Promise<void>;
  resetStore: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  manifest: null,
  studentProgress: [],
  currentActiveUc: null,
  activeNode: null,
  dntInstruction: null,
  isLoading: false,
  errorMessage: null,
  statusMessage: null,

  /**
   * Action: loadCourse(gcId)
   * Downloads the Course Manifest JSON and Student Progress, saving both in the Zustand store.
   * Calculates the aggregated course trail and sets the active UC.
   */
  loadCourse: async (gcId: string, studentId: string = 'std_892341', tenantId?: string) => {
    const activeTenant = tenantId || TENANT_ID || 'tenant_sagacitas_corporate_01';

    set({
      isLoading: true,
      errorMessage: null,
      statusMessage: `Carregando Manifesto e Progresso do Curso (${gcId})...`,
    });

    try {
      // Parallel fetch via CourseEngineService
      const [fetchedManifest, fetchedProgress] = await Promise.all([
        CourseEngineService.fetchManifest(gcId, activeTenant),
        CourseEngineService.fetchProgress(gcId, studentId),
      ]);

      set({
        manifest: fetchedManifest,
        studentProgress: fetchedProgress,
        isLoading: false,
        statusMessage: `Curso '${fetchedManifest.title}' carregado com sucesso.`,
      });

      // Compute aggregated trail
      const trail = get().getAggregatedTrail();

      // Automatically select first available or in-progress node if none selected
      if (trail.length > 0) {
        const currentSelected = get().currentActiveUc;
        const targetNode =
          trail.find(n => n.id === currentSelected) ||
          trail.find(n => n.state === 'IN_PROGRESS' || n.state === 'AVAILABLE') ||
          trail[0];

        if (targetNode) {
          get().selectActiveUc(targetNode.id);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Falha ao carregar dados do curso e progresso do aluno.';
      set({
        isLoading: false,
        errorMessage: msg,
        statusMessage: null,
      });
      console.error('[useCourseStore Fail-Fast Error]', msg);
    }
  },

  /**
   * Selector: getAggregatedTrail()
   * Computed function returning the course execution tree merging Manifesto JSON with Student Progress DB records.
   */
  getAggregatedTrail: (): MergedNodeProgress[] => {
    const { manifest, studentProgress } = get();
    return CourseEngineService.aggregateTrail(manifest, studentProgress);
  },

  /**
   * Action: evaluateDntRouting(ucId)
   * Evaluates `is_exempt_by_dnt` flag for the selected UC.
   * If true, returns instruction for UI to hide 'Propósito' and 'Conteúdo', activating 'Validação' directly.
   */
  evaluateDntRouting: (ucId: string): DntRoutingInstruction => {
    const { studentProgress, manifest } = get();
    const instruction = CourseEngineService.evaluateDntRouting(ucId, studentProgress, manifest);
    set({ dntInstruction: instruction });
    return instruction;
  },

  /**
   * Action: selectActiveUc(ucId)
   * Selects active UC in store and triggers DNT routing evaluation.
   */
  selectActiveUc: (ucId: string) => {
    const trail = get().getAggregatedTrail();
    const matchedNode = trail.find(n => n.id === ucId) || null;

    set({ currentActiveUc: ucId, activeNode: matchedNode });
    get().evaluateDntRouting(ucId);
  },

  /**
   * Action: updateStudentProgress(ucId, newState, score)
   * Updates progress for a UC in store and re-evaluates DNT routing.
   */
  updateStudentProgress: async (ucId: string, newState: StudentProgress['state'], score: number | null = null) => {
    const { studentProgress, manifest } = get();
    const gcId = manifest?.gc_id || 'gc_logica_01';
    const studentId = 'std_892341';

    const existingIndex = studentProgress.findIndex(p => p.uc_id === ucId);
    let updatedProgress = [...studentProgress];

    if (existingIndex >= 0) {
      updatedProgress[existingIndex] = {
        ...updatedProgress[existingIndex],
        state: newState,
        score: score !== undefined ? score : updatedProgress[existingIndex].score,
        updated_at: new Date().toISOString(),
      };
    } else {
      updatedProgress.push({
        student_id: studentId,
        gc_id: gcId,
        uc_id: ucId,
        state: newState,
        score,
        is_exempt_by_dnt: false,
        updated_at: new Date().toISOString(),
      });
    }

    set({ studentProgress: updatedProgress });

    // Re-evaluate current selected node
    if (get().currentActiveUc === ucId) {
      get().selectActiveUc(ucId);
    }
  },

  /**
   * Action: resetStore()
   * Resets course store state.
   */
  resetStore: () => {
    set({
      manifest: null,
      studentProgress: [],
      currentActiveUc: null,
      activeNode: null,
      dntInstruction: null,
      isLoading: false,
      errorMessage: null,
      statusMessage: null,
    });
  },
}));
