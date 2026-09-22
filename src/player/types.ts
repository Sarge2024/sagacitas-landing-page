/**
 * Sagacitas Player - Domain Types (types.ts / domain.ts)
 */

export type OAState = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'REMEDIATION';

export type OAType = 'video' | 'lab' | 'quiz' | 'project' | 'simulator' | 'simulator_dre' | 'slide';

export interface LearningObject {
  id: string; // uc_id (Unidade Curricular / OA)
  title: string;
  description: string;
  type: OAType;
  duration: string;
  order: number;
  prerequisites: string[]; // List of uc_ids required before this OA
  code_snippet?: string;
  interactive_type?: 'simulator' | 'quiz' | 'video' | 'lab' | 'project' | 'slide';
  markdownContent?: string; // Raw markdown for 'slide' OAs, slides separated by '---' (from lessons.markdown_content)
  quiz_questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
  }>;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface ExecutionGraph {
  nodes: LearningObject[];
  edges: GraphEdge[];
}

export interface CourseSummary {
  gc_id: string;
  title: string;
  description: string;
  lessonCount: number;
}

export interface CourseManifest {
  gc_id: string; // Grupo Curricular / Course ID
  title: string;
  description: string;
  tenant_id: string;
  execution_graph: ExecutionGraph;
  cover_image?: string;
  module_name?: string;
}

export interface StudentProgress {
  id?: string;
  student_id: string;
  gc_id: string;
  uc_id: string;
  state: OAState;
  score: number | null;
  is_exempt_by_dnt: boolean;
  updated_at: string;
}

export interface MergedNodeProgress extends LearningObject {
  state: OAState;
  score: number | null;
  is_exempt_by_dnt: boolean;
  updated_at?: string;
  is_available: boolean;
  can_skip_by_dnt: boolean;
}

export interface DntRoutingInstruction {
  uc_id: string;
  is_exempt_by_dnt: boolean;
  skipToValidation: boolean;
  hiddenPhases: ('proposito' | 'conteudo' | 'validacao')[];
  activePhase: 'proposito' | 'conteudo' | 'validacao';
  message: string;
}

export interface TenantContract {
  tenant_id: string;
  company_name: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  valid_until: string;
  max_seats: number;
}

export interface DualAuthDetails {
  firebaseUid: string;
  firebaseToken: string;
  providerId: 'email' | 'google' | 'custom_jwt';
  tenantContract: TenantContract;
  authorizedAt: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    tenant_id: string;
  };
  authDetails?: DualAuthDetails;
  expires_at?: number;
}
