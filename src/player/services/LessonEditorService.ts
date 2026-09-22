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
   * Envia uma imagem para o Vercel Blob via /api/blob-upload (store privado).
   * Retorna a URL proxy /api/blob-serve?pathname=... para inserção no Markdown.
   *
   * ⚠️  Limite do Vercel server upload: 4.5 MB.
   * Comprime automaticamente via Canvas (JPEG 85%) se o arquivo original
   * ultrapassar 3 MB, mantendo uma margem segura abaixo do limite.
   * Arquivos > 4.4 MB mesmo após compressão lançam erro com instrução clara.
   *
   * Requer api/blob-upload.ts (vercel dev / produção).
   * Em caso de falha de rede cai no fallback Base64 (Data URL inline).
   */
  public static async uploadImage(file: File): Promise<string> {
    const VERCEL_LIMIT_BYTES = 4.4 * 1024 * 1024; // 4.4 MB — margem de segurança
    const COMPRESS_THRESHOLD_BYTES = 3 * 1024 * 1024; // comprime acima de 3 MB

    // Comprime se necessário antes de enviar
    let uploadFile = file;
    if (file.size > COMPRESS_THRESHOLD_BYTES) {
      console.info(`[LessonEditorService] Arquivo (${(file.size / 1024 / 1024).toFixed(1)} MB) acima de 3 MB — comprimindo via Canvas...`);
      uploadFile = await this.compressImageFile(file);
      console.info(`[LessonEditorService] Comprimido para ${(uploadFile.size / 1024 / 1024).toFixed(1)} MB.`);
    }

    if (uploadFile.size > VERCEL_LIMIT_BYTES) {
      throw new Error(
        `Imagem muito grande (${(uploadFile.size / 1024 / 1024).toFixed(1)} MB mesmo após compressão). ` +
        `Reduza a resolução para menos de 4.4 MB e tente novamente.`
      );
    }

    const tenantId = TENANT_ID || 'tenant_sagacitas_corporate_01';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `${ASSETS_BUCKET}/${tenantId}/${Date.now()}-${safeName}`;

    try {
      const response = await fetch(
        `/api/blob-upload?pathname=${encodeURIComponent(pathname)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': uploadFile.type },
          body: uploadFile,
        }
      );

      // Lê o body UMA única vez (evita "body already disturbed" se lido duas vezes)
      const json = await response.json() as { url?: string; pathname?: string; error?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? `Erro HTTP ${response.status}`);
      }

      return json.url;
    } catch (err) {
      console.warn('[LessonEditorService] Falha no upload ao Vercel Blob, usando fallback Data URL local:', err);
      return this.fileToDataUrl(file);
    }
  }

  /**
   * Comprime uma imagem via Canvas API (sem dependências externas).
   * Converte para JPEG a 85% de qualidade, preservando as dimensões originais.
   * Usado para manter o arquivo dentro do limite de 4.5 MB do server upload.
   */
  private static compressImageFile(file: File, quality = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context indisponível'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao compactar imagem via Canvas'));
              return;
            }
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao carregar imagem para compressão'));
      };

      img.src = url;
    });
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
