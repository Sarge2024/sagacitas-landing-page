import { CourseManifest, CourseSummary, LearningObject } from '../types';
import { getSupabaseClient, TENANT_ID, isSupabaseConfigured } from './supabaseClient';

// Nomes amigáveis para gc_id conhecidos, publicados via lessons pelo Works Manager.
// Sem tabela de metadados de curso real ainda — cai no slug "humanizado" para gc_id desconhecidos.
// Desde 2026-09-23 o Works Manager publica em 4 cursos por plano comercial em vez de um
// curso único — 'works-manager-basic' fica mantido aqui por segurança (nenhuma linha nova
// nasce com esse gc_id, mas não custa manter o nome amigável caso alguma linha antiga reste).
const FRIENDLY_COURSE_NAMES: Record<string, string> = {
  'works-manager-basic': 'Gestor de Obras — Treinamento Essencial',
  'works-manager-essencial': 'Gestor de Obras — Plano Essencial',
  'works-manager-professional': 'Gestor de Obras — Plano Professional',
  'works-manager-enterprise': 'Gestor de Obras — Plano Enterprise',
  'works-manager-budgetpro': 'Gestor de Obras — Budget Pro (Orçamento por Produtividade)',
};

function humanizeGcId(gcId: string): string {
  return FRIENDLY_COURSE_NAMES[gcId] ?? gcId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export class CourseManifestService {
  /**
   * Busca os cursos reais publicados em `lessons` (agrupados por gc_id), para
   * exibição de cards no Dashboard. Não depende de `course_manifests` (que
   * não existe no banco real) — lê direto do acervo de aulas do Works Manager.
   */
  public static async fetchAvailableCourseSummaries(): Promise<CourseSummary[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('gc_id')
        .not('gc_id', 'is', null);

      if (error || !data) {
        console.warn('[CourseManifestService] Falha ao buscar cursos reais de `lessons`:', error?.message);
        return [];
      }

      const counts = new Map<string, number>();
      for (const row of data as Array<{ gc_id: string | null }>) {
        if (!row.gc_id) continue;
        counts.set(row.gc_id, (counts.get(row.gc_id) ?? 0) + 1);
      }

      return Array.from(counts.entries()).map(([gc_id, lessonCount]) => ({
        gc_id,
        title: humanizeGcId(gc_id),
        description: `${lessonCount} aula${lessonCount === 1 ? '' : 's'} publicadas pelo Works Manager.`,
        lessonCount,
      }));
    } catch (err) {
      console.warn('[CourseManifestService] Erro de rede ao buscar cursos reais:', err);
      return [];
    }
  }

  /**
   * Fetches the CourseManifest JSON.
   * MUST include VITE_TENANT_ID in the query filter to enforce B2B licensing rules.
   * @param gcId Course / Grupo Curricular ID
   */
  public static async fetchManifest(gcId: string): Promise<CourseManifest> {
    const activeTenantId = TENANT_ID || 'tenant_sagacitas_corporate_01';

    // Fail Fast: Enforce Tenant ID requirement
    if (!activeTenantId) {
      throw new Error('[CourseManifestService Fail-Fast] Tenant ID ausente. Impossível carregar catálogo licenciado.');
    }

    // Fail Fast: Validate parameter
    if (!gcId) {
      throw new Error('[CourseManifestService Fail-Fast] Identificador de curso (gcId) é obrigatório.');
    }

    // Attempt real Supabase query if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('course_manifests')
          .select('*')
          .eq('gc_id', gcId)
          .eq('tenant_id', activeTenantId) // Critical B2B licensing filter
          .single();

        if (error) {
          console.warn(`[CourseManifestService] 'course_manifests' indisponível (${error.message}). Tentando montar manifesto real a partir de 'lessons'...`);
        } else if (data && data.manifest) {
          return data.manifest as CourseManifest;
        }
      } catch (err) {
        console.warn('[CourseManifestService] Falha na rede ao consultar course_manifests, tentando lessons:', err);
      }

      // `course_manifests` não existe no banco real (ver WORKS_MANAGER_HANDOFF.md) — o
      // acervo publicado pelo Works Manager mora em `lessons`. Monta o manifesto ao vivo
      // a partir dele antes de recorrer ao catálogo mock.
      const liveManifest = await this.buildManifestFromLessons(gcId, activeTenantId);
      if (liveManifest) return liveManifest;
    }

    // Default / Mock Manifest fallback for demonstration & offline resilience
    return this.getMockManifest(gcId, activeTenantId);
  }

  /**
   * Monta um CourseManifest ao vivo a partir de `lessons` (filtrando por
   * gc_id), para cursos publicados pelo Works Manager que não têm entrada em
   * `course_manifests`. Retorna null se não houver aulas ou se a consulta falhar,
   * deixando `fetchManifest` cair no mock como último recurso.
   */
  private static async buildManifestFromLessons(gcId: string, tenantId: string): Promise<CourseManifest | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('uc_id, title, module_id, order, markdown_content, type')
        .eq('gc_id', gcId)
        .not('uc_id', 'is', null)
        .order('module_id', { ascending: true })
        .order('order', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn(`[CourseManifestService] Falha ao montar manifesto real de 'lessons' para ${gcId}:`, error.message);
        }
        return null;
      }

      const rows = data as Array<{
        uc_id: string;
        title: string;
        module_id: string | null;
        order: number | null;
        markdown_content: string | null;
        type: string | null;
      }>;

      const nodes: LearningObject[] = rows.map((row, index) => ({
        id: row.uc_id,
        title: row.title,
        description: row.module_id ? `Módulo: ${row.module_id}` : '',
        type: (row.type as LearningObject['type']) ?? 'slide',
        duration: '',
        order: row.order ?? index + 1,
        prerequisites: [],
        interactive_type: row.type === 'slide' ? 'slide' : undefined,
        markdownContent: row.markdown_content ?? undefined,
      }));

      return {
        gc_id: gcId,
        title: humanizeGcId(gcId),
        description: `${nodes.length} aula${nodes.length === 1 ? '' : 's'} publicadas pelo Works Manager.`,
        tenant_id: tenantId,
        execution_graph: { nodes, edges: [] },
      };
    } catch (err) {
      console.warn(`[CourseManifestService] Erro de rede ao montar manifesto real de 'lessons' para ${gcId}:`, err);
      return null;
    }
  }

  /**
   * Mock manifest data representing courses shown in screenshots:
   * - Module 3: Lógica Avançada (Fundamentos de Lógica)
   * - Arquitetura de Sistemas
   * - UX Design
   */
  public static getMockManifest(gcId: string, tenantId: string = 'tenant_sagacitas_corporate_01'): CourseManifest {
    if (gcId === 'logica-avancada' || gcId === 'gc_logica_01') {
      return {
        gc_id: 'gc_logica_01',
        title: 'Fundamentos de Lógica',
        description: 'Aprenda os blocos de construção fundamentais da programação e do pensamento computacional estruturado.',
        tenant_id: tenantId,
        module_name: 'Módulo 3: Lógica Avançada',
        cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        execution_graph: {
          nodes: [
            {
              id: 'uc_01_booleana',
              title: 'Fundamentos de Álgebra Booleana',
              description: 'Entenda os princípios fundamentais das operações AND, OR e NOT.',
              type: 'video',
              duration: '15m',
              order: 1,
              prerequisites: [],
              interactive_type: 'video',
            },
            {
              id: 'uc_02_condicionais',
              title: 'Estruturas Condicionais Complexas',
              description: 'Aprenda a encadear condições logicamente para resolver problemas complexos...',
              type: 'lab',
              duration: '45m',
              order: 2,
              prerequisites: ['uc_01_booleana'],
              interactive_type: 'simulator',
              code_snippet: `// Normalização de Dados & Regras Condicionais
function processDataset(rawInput, threshold = 70) {
  if (!rawInput || rawInput.length === 0) {
    throw new Error("Dataset vazio");
  }
  return rawInput.map(val => (val / 100) * threshold);
}`,
            },
            {
              id: 'uc_03_eficiencia',
              title: 'Eficiência Algorítmica',
              description: 'Analise a notação Big O e otimize caminhos lógicos.',
              type: 'quiz',
              duration: '30m',
              order: 3,
              prerequisites: ['uc_02_condicionais'],
              interactive_type: 'quiz',
              quiz_questions: [
                {
                  id: 'q1',
                  question: 'Qual a complexidade de tempo de uma busca binária em um vetor ordenado?',
                  options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
                  correctIndex: 2,
                },
                {
                  id: 'q2',
                  question: 'Qual operação lógica retorna verdadeiro se pelo menos uma das entradas for verdadeira?',
                  options: ['AND', 'OR', 'XOR', 'NAND'],
                  correctIndex: 1,
                },
              ],
            },
            {
              id: 'uc_04_projeto_final',
              title: 'Projeto Final do Módulo',
              description: 'Aplique lógica condicional complexa a um cenário do mundo real.',
              type: 'project',
              duration: '1h 30m',
              order: 4,
              prerequisites: ['uc_03_eficiencia'],
              interactive_type: 'lab',
            },
          ],
          edges: [
            { from: 'uc_01_booleana', to: 'uc_02_condicionais' },
            { from: 'uc_02_condicionais', to: 'uc_03_eficiencia' },
            { from: 'uc_03_eficiencia', to: 'uc_04_projeto_final' },
          ],
        },
      };
    }

    if (gcId === 'arquitetura-sistemas' || gcId === 'gc_arq_02') {
      return {
        gc_id: 'gc_arq_02',
        title: 'Arquitetura de Sistemas',
        description: 'Design e estruturação de aplicações escaláveis para ambientes corporativos modernos.',
        tenant_id: tenantId,
        module_name: 'Módulo 1: Visão Geral e Microserviços',
        cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        execution_graph: {
          nodes: [
            {
              id: 'uc_arq_01',
              title: 'Padrões de Integração B2B',
              description: 'Arquiteturas REST vs gRPC e mensageria distribuída.',
              type: 'video',
              duration: '25m',
              order: 1,
              prerequisites: [],
            },
          ],
          edges: [],
        },
      };
    }

    if (gcId === 'gc_works_manager_01' || gcId === 'works-manager-basic') {
      return {
        gc_id: 'gc_works_manager_01',
        title: 'Gestor de Obras — Treinamento Essencial',
        description: 'Aprenda a utilizar o sistema Gestor de Obras: orçamentos, planejamento e gestão de ativos e pessoas.',
        tenant_id: tenantId,
        module_name: 'Módulo Único: Fundamentos',
        cover_image: '/works-manager-cover.png',
        execution_graph: {
          nodes: [
            {
              id: 'uc_wm_01',
              title: 'Visão Geral do Gestor de Obras',
              description: 'Apresentação da interface, navegação e conceitos principais do sistema dual IdP.',
              type: 'video',
              duration: '15m',
              order: 1,
              prerequisites: [],
              interactive_type: 'video',
            },
            {
              id: 'uc_wm_02',
              title: 'Painel de Custos e Orçamentos',
              description: 'Como criar, revisar e aprovar relatórios e orçamentos industriais.',
              type: 'slide',
              duration: '25m',
              order: 2,
              prerequisites: ['uc_wm_01'],
              interactive_type: 'slide',
            }
          ],
          edges: [
            { from: 'uc_wm_01', to: 'uc_wm_02' }
          ],
        },
      };
    }

    // Default return
    return {
      gc_id: gcId,
      title: 'UX Design',
      description: 'Princípios avançados de usabilidade e design centrado no usuário.',
      tenant_id: tenantId,
      module_name: 'Módulo 1: Pesquisa com Usuários',
      cover_image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
      execution_graph: {
        nodes: [
          {
            id: 'uc_ux_01',
            title: 'Wireframing e Prototipagem',
            description: 'Construção de protótipos navegáveis de alta fidelidade.',
            type: 'video',
            duration: '35m',
            order: 1,
            prerequisites: [],
          },
        ],
        edges: [],
      },
    };
  }
}
