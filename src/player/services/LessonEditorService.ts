import { getSupabaseClient, isSupabaseConfigured, TENANT_ID } from './supabaseClient';

export interface LessonRecord {
  id: string;
  tenant_id: string;
  gc_id: string;
  module_id: string | null;
  uc_id: string;
  title: string;
  type: string;
  order: number;
  markdown_content: string | null;
  updated_at: string;
}

const LOCAL_STORAGE_PREFIX = 'sagacitas_lesson_draft_';
const ASSETS_BUCKET = 'course-assets';

export class LessonEditorService {
  /**
   * Busca uma aula (lessons.id) para edição no Admin Editor.
   */
  public static async fetchLesson(lessonId: string): Promise<LessonRecord | null> {
    if (!lessonId) {
      throw new Error('[LessonEditorService Fail-Fast] Identificador da aula (lessonId) é obrigatório.');
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        console.warn(`[LessonEditorService] Aula não encontrada no Supabase (${error.message}). Usando rascunho local.`);
        return this.getLocalLesson(lessonId);
      }
      return data as LessonRecord;
    }

    console.log('[LessonEditorService] Modo Local/Demo. Carregando rascunho local.');
    return this.getLocalLesson(lessonId);
  }

  /**
   * Lista todas as aulas (para a tela de índice do Class Studio), ordenadas
   * por curso/módulo/ordem. Sem paginação — o acervo hoje é pequeno (~28 linhas).
   */
  public static async listLessons(): Promise<LessonRecord[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('gc_id', { ascending: true })
        .order('module_id', { ascending: true })
        .order('order', { ascending: true });

      if (error) {
        console.warn('[LessonEditorService] Erro ao listar aulas:', error.message);
        return [];
      }
      return (data ?? []) as LessonRecord[];
    } catch (err) {
      console.warn('[LessonEditorService] Erro de rede ao listar aulas:', err);
      return [];
    }
  }

  /**
   * Persiste o Markdown editado na coluna `markdown_content` da tabela `lessons`.
   */
  public static async saveLessonMarkdown(lessonId: string, markdownContent: string): Promise<void> {
    if (!lessonId) {
      throw new Error('[LessonEditorService Fail-Fast] Identificador da aula (lessonId) é obrigatório.');
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('lessons')
        .update({ markdown_content: markdownContent, updated_at: new Date().toISOString() })
        .eq('id', lessonId);

      if (error) {
        throw new Error(`[LessonEditorService] Erro ao salvar conteúdo no Supabase: ${error.message}`);
      }
      return;
    }

    console.log('[LessonEditorService] Modo Local/Demo. Rascunho salvo apenas no navegador.');
    this.saveLocalLesson(lessonId, markdownContent);
  }

  /**
   * Envia uma imagem para o bucket público `course-assets` (path: <tenant_id>/<timestamp>-<nome>)
   * e retorna a URL pública para inserção no Markdown.
   */
  public static async uploadImage(file: File): Promise<string> {
    const tenantId = TENANT_ID || 'tenant_sagacitas_corporate_01';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${tenantId}/${Date.now()}-${safeName}`;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.storage.from(ASSETS_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw new Error(`[LessonEditorService] Falha no upload da imagem: ${error.message}`);
      }

      const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    }

    console.log('[LessonEditorService] Modo Local/Demo. Upload simulado via Data URL.');
    return this.fileToDataUrl(file);
  }

  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // --- Fallback Local/Demo (quando Supabase não está configurado) ---

  private static getLocalLesson(lessonId: string): LessonRecord {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_PREFIX + lessonId) : null;
    return {
      id: lessonId,
      tenant_id: TENANT_ID || 'tenant_sagacitas_corporate_01',
      gc_id: 'gc_logica_01',
      module_id: null,
      uc_id: lessonId,
      title: 'Aula (Modo Demo)',
      type: 'slide',
      order: 0,
      markdown_content: stored ?? '# Nova Aula\n\nEscreva o conteúdo desta aula em Markdown. Use uma linha só com `---` para separar os slides.',
      updated_at: new Date().toISOString(),
    };
  }

  private static saveLocalLesson(lessonId: string, markdownContent: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + lessonId, markdownContent);
    } catch (e) {
      console.error('[LessonEditorService] Falha ao persistir rascunho localmente:', e);
    }
  }
}
