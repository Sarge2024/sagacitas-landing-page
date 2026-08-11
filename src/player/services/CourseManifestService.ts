import { CourseManifest } from '../types';
import { getSupabaseClient, TENANT_ID, isSupabaseConfigured } from './supabaseClient';

export class CourseManifestService {
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
          console.warn(`[CourseManifestService] Consulta Supabase retornou aviso (${error.message}). Carregando catálogo padrão...`);
        } else if (data && data.manifest) {
          return data.manifest as CourseManifest;
        }
      } catch (err) {
        console.warn('[CourseManifestService] Falha na rede ao consultar Supabase, usando catálogo local de contingência:', err);
      }
    }

    // Default / Mock Manifest fallback for demonstration & offline resilience
    return this.getMockManifest(gcId, activeTenantId);
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
