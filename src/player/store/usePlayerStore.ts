import { create } from 'zustand';
import {
  AuthSession,
  CourseManifest,
  StudentProgress,
  MergedNodeProgress,
} from '../types';
import { AuthHandshakeService } from '../services/AuthHandshakeService';
import { CourseManifestService } from '../services/CourseManifestService';
import { StudentProgressService } from '../services/StudentProgressService';
import { CourseEngineService } from '../services/CourseEngineService';
import { ValidationEngineService, ValidationResult } from '../services/ValidationEngineService';
import { TENANT_ID } from '../services/supabaseClient';
import { useCourseStore } from './useCourseStore';

export type ViewScreen = 'handshake' | 'dashboard' | 'trail' | 'player';

interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  service: 'AuthHandshakeService' | 'CourseManifestService' | 'StudentProgressService' | 'CourseEngineService' | 'ValidationEngineService' | 'SupabaseRLS';
  message: string;
}

interface PlayerState {
  // Navigation & Screen View
  currentView: ViewScreen;
  activeGcId: string;
  activeUcId: string | null;

  // Domain Data
  session: AuthSession | null;
  manifest: CourseManifest | null;
  studentProgressList: StudentProgress[];
  navigationTree: MergedNodeProgress[];
  activeNode: MergedNodeProgress | null;

  // UI & Loading States
  isLoading: boolean;
  statusMessage: string;
  errorMessage: string | null;
  logs: SystemLog[];
  showInspectorModal: boolean;
  searchQuery: string;

  // Actions & Service Drivers
  setCurrentView: (view: ViewScreen) => void;
  setSearchQuery: (query: string) => void;
  toggleInspectorModal: () => void;
  addLog: (service: SystemLog['service'], message: string, type?: SystemLog['type']) => void;

  // SDK Engine Core Methods
  runHandshake: (customToken?: string) => Promise<void>;
  runDualAuthHandshake: (options?: { email?: string; pass?: string; useGoogle?: boolean; customToken?: string }) => Promise<void>;
  loadCourse: (gcId: string) => Promise<void>;
  selectLearningObject: (ucId: string) => void;
  submitScore: (score: number) => Promise<ValidationResult | null>;
  resetDemoProgress: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentView: 'handshake',
  activeGcId: 'gc_logica_01',
  activeUcId: null,

  session: null,
  manifest: null,
  studentProgressList: [],
  navigationTree: [],
  activeNode: null,

  isLoading: false,
  statusMessage: 'Iniciando Sagacitas Player...',
  errorMessage: null,
  logs: [],
  showInspectorModal: false,
  searchQuery: '',

  setCurrentView: (view: ViewScreen) => set({ currentView: view }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  toggleInspectorModal: () => set(state => ({ showInspectorModal: !state.showInspectorModal })),

  addLog: (service, message, type = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      type,
      service,
      message,
    };
    set(state => ({ logs: [newLog, ...state.logs.slice(0, 49)] }));
  },

  /**
   * Runs the Dual-Auth Handshake flow (Fase 1: Firebase Auth -> Fase 2: Supabase RLS)
   */
  runDualAuthHandshake: async (options = {}) => {
    set({ isLoading: true, errorMessage: null, statusMessage: 'Fase 1: Autenticando no Firebase Auth (Identidade)...' });
    get().addLog('AuthHandshakeService', `[Dual-Auth] Iniciando Fase 1 (Firebase Auth) & Fase 2 (Supabase RLS Tenant Isolation)`);

    try {
      const session = await AuthHandshakeService.loginAndHandshake({
        explicitToken: options.customToken,
        emailCredentials: options.email && options.pass ? { email: options.email, pass: options.pass } : undefined,
        useGoogleProvider: options.useGoogle,
        allowDemoFallback: true,
      });

      set({ session, isLoading: false });
      get().addLog(
        'AuthHandshakeService',
        `✓ [Fase 1 OK] Firebase UID: ${session.user.id} | [Fase 2 OK] Tenant RLS: ${session.user.tenant_id}`,
        'success'
      );

      // Automatically load primary course catalog after handshake
      await get().loadCourse(get().activeGcId);
      set({ currentView: 'dashboard' });
    } catch (err: any) {
      const msg = err.message || 'Falha na autenticação em duas etapas.';
      set({ isLoading: false, errorMessage: msg });
      get().addLog('AuthHandshakeService', `[Dual-Auth] [Error] ${msg}`, 'error');
    }
  },

  /**
   * Runs the AuthHandshakeService flow
   */
  runHandshake: async (customToken?: string) => {
    return get().runDualAuthHandshake({ customToken });
  },

  /**
   * Loads Course Manifest and Student Progress using CourseEngineService
   */
  loadCourse: async (gcId: string) => {
    set({ isLoading: true, activeGcId: gcId, statusMessage: 'Buscando manifesto e progresso...' });
    get().addLog('CourseEngineService', `Carregando manifesto do curso gcId: "${gcId}" com Tenant ID query filter.`);

    try {
      const { session } = get();
      const studentId = session?.user.id || 'std_892341';

      // 1. Fetch manifest & progress via CourseEngineService
      const manifest = await CourseEngineService.fetchManifest(gcId, session?.user.tenant_id);
      get().addLog('CourseEngineService', `Manifesto retornado com sucesso. Título: "${manifest.title}".`, 'success');

      get().addLog('CourseEngineService', `Consultando tabela student_uc_progress para aluno ${studentId}.`);
      const studentProgressList = await CourseEngineService.fetchProgress(gcId, studentId);

      // 2. Aggregate trail using pure graph traversal helper
      const navigationTree = CourseEngineService.aggregateTrail(manifest, studentProgressList);
      get().addLog('CourseEngineService', `Navegação fusionada. ${navigationTree.length} Objetos de Aprendizagem mapeados.`, 'info');

      // Select first available or active node if present
      const inProgressNode = navigationTree.find(n => n.state === 'IN_PROGRESS') ||
                             navigationTree.find(n => n.state === 'AVAILABLE') ||
                             navigationTree[0];

      set({
        manifest,
        studentProgressList,
        navigationTree,
        activeNode: inProgressNode || null,
        activeUcId: inProgressNode ? inProgressNode.id : null,
        isLoading: false,
      });

      // Synchronize with useCourseStore
      useCourseStore.getState().loadCourse(gcId, studentId, session?.user.tenant_id);
    } catch (err: any) {
      const msg = err.message || 'Erro ao carregar curso.';
      set({ isLoading: false, errorMessage: msg });
      get().addLog('CourseEngineService', `[Error] ${msg}`, 'error');
    }
  },

  /**
   * Selects a learning object (uc_id) for the OAPlayer
   */
  selectLearningObject: (ucId: string) => {
    const { navigationTree, studentProgressList, manifest } = get();
    const target = navigationTree.find(n => n.id === ucId);
    if (!target) return;

    if (target.state === 'LOCKED') {
      get().addLog('CourseEngineService', `Acesso negado: OA "${target.title}" está BLOQUEADO por pré-requisitos.`, 'warning');
      return;
    }

    // Evaluate DNT Routing for the selected UC
    const dntInstruction = CourseEngineService.evaluateDntRouting(ucId, studentProgressList, manifest);
    get().addLog('CourseEngineService', dntInstruction.message, dntInstruction.is_exempt_by_dnt ? 'success' : 'info');

    set({ activeNode: target, activeUcId: ucId, currentView: 'player' });
    useCourseStore.getState().selectActiveUc(ucId);
  },

  /**
   * Submits student score to ValidationEngineService (Motor DNT)
   */
  submitScore: async (score: number) => {
    const { activeGcId, activeNode, session, studentProgressList, manifest } = get();
    if (!activeNode) return null;

    set({ isLoading: true, statusMessage: 'Submetendo avaliação ao Motor DNT...' });
    get().addLog('ValidationEngineService', `Submetendo nota ${score}% para OA "${activeNode.title}" (${activeNode.id})`);

    try {
      const result = await ValidationEngineService.submitOAScore(
        activeGcId,
        activeNode.id,
        score,
        session?.user.id || 'std_892341',
        activeNode.is_exempt_by_dnt
      );

      // Update local progress list
      const updatedList = [...studentProgressList];
      const existingIdx = updatedList.findIndex(p => p.uc_id === activeNode.id);
      if (existingIdx >= 0) {
        updatedList[existingIdx] = result.updatedProgress;
      } else {
        updatedList.push(result.updatedProgress);
      }

      // Re-sync navigation tree with new progress
      const newNavTree = manifest
        ? StudentProgressService.syncStateWithManifest(manifest, updatedList)
        : [];

      const updatedActiveNode = newNavTree.find(n => n.id === activeNode.id) || activeNode;

      set({
        studentProgressList: updatedList,
        navigationTree: newNavTree,
        activeNode: updatedActiveNode,
        isLoading: false,
      });

      if (result.remediationTriggered) {
        get().addLog(
          'ValidationEngineService',
          `⚠️ REPROVAÇÃO (${score}% < 70%). Estado alterado para REMEDIAÇÃO. Isenção DNT revogada!`,
          'error'
        );
      } else {
        get().addLog(
          'ValidationEngineService',
          `🎉 APROVAÇÃO (${score}% >= 70%). Objeto concluído com sucesso!`,
          'success'
        );
      }

      return result;
    } catch (err: any) {
      const msg = err.message || 'Erro ao submeter avaliação.';
      set({ isLoading: false, errorMessage: msg });
      get().addLog('ValidationEngineService', `[Fail-Fast Error] ${msg}`, 'error');
      return null;
    }
  },

  resetDemoProgress: () => {
    const { manifest, session } = get();
    if (!manifest) return;
    const initialProgress: StudentProgress[] = [
      {
        student_id: session?.user.id || 'std_892341',
        gc_id: manifest.gc_id,
        uc_id: 'uc_01_booleana',
        state: 'COMPLETED',
        score: 95,
        is_exempt_by_dnt: true,
        updated_at: new Date().toISOString(),
      },
      {
        student_id: session?.user.id || 'std_892341',
        gc_id: manifest.gc_id,
        uc_id: 'uc_02_condicionais',
        state: 'IN_PROGRESS',
        score: null,
        is_exempt_by_dnt: false,
        updated_at: new Date().toISOString(),
      },
    ];

    const newNavTree = StudentProgressService.syncStateWithManifest(manifest, initialProgress);
    set({
      studentProgressList: initialProgress,
      navigationTree: newNavTree,
      activeNode: newNavTree[1] || newNavTree[0],
    });

    get().addLog('StudentProgressService', 'Progresso resetado para o estado inicial da demonstração.', 'info');
  },
}));
