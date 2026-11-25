import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

/**
 * CSS customizado por aula (`public.lesson_slide_styles`), independente do
 * schema do Works Manager. Formatação visual dos slides é responsabilidade
 * de manutenção deste repositório — ver src/player/db/lesson_slide_styles.sql.
 */
export class LessonStyleService {
  public static async fetchStyle(lessonId: string): Promise<string> {
    if (!isSupabaseConfigured() || !lessonId) return '';

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lesson_slide_styles')
        .select('custom_css')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        console.warn('[LessonStyleService] Falha ao buscar CSS da aula:', error.message);
        return '';
      }
      return data?.custom_css ?? '';
    } catch (err) {
      console.warn('[LessonStyleService] Erro de rede ao buscar CSS da aula:', err);
      return '';
    }
  }

  /**
   * Busca o CSS de várias aulas de uma vez (evita N+1 ao montar o manifesto
   * de um curso inteiro em CourseManifestService.buildManifestFromLessons).
   */
  public static async fetchStylesForLessons(lessonIds: string[]): Promise<Record<string, string>> {
    if (!isSupabaseConfigured() || lessonIds.length === 0) return {};

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lesson_slide_styles')
        .select('lesson_id, custom_css')
        .in('lesson_id', lessonIds);

      if (error || !data) {
        if (error) console.warn('[LessonStyleService] Falha ao buscar CSS em lote:', error.message);
        return {};
      }

      const result: Record<string, string> = {};
      for (const row of data as Array<{ lesson_id: string; custom_css: string | null }>) {
        if (row.custom_css) result[row.lesson_id] = row.custom_css;
      }
      return result;
    } catch (err) {
      console.warn('[LessonStyleService] Erro de rede ao buscar CSS em lote:', err);
      return {};
    }
  }

  public static async saveStyle(lessonId: string, customCss: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    const trimmed = customCss.trim();

    if (!trimmed) {
      const { error } = await supabase.from('lesson_slide_styles').delete().eq('lesson_id', lessonId);
      if (error) throw new Error(`Falha ao limpar CSS da aula: ${error.message}`);
      return;
    }

    const { error } = await supabase
      .from('lesson_slide_styles')
      .upsert({ lesson_id: lessonId, custom_css: trimmed, updated_at: new Date().toISOString() });

    if (error) throw new Error(`Falha ao salvar CSS da aula: ${error.message}`);
  }
}
