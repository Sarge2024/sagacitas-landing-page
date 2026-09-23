import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { LessonSyncService } from './LessonSyncService';
import { parseSlides, ensureSlideIds, type ParsedSlideBase } from '../../lib/slideId';

/**
 * Consumo do protocolo `slide-id` (ver contrato técnico completo em
 * gestor-de-obras/.ai/specs/slide_identification_protocol.md). O Works
 * Manager garante que todo slide carrega, logo após o separador `---`, um
 * comentário HTML estável: `<!-- slide-id: <slug> -->` — invisível na
 * renderização (marked/DOMPurify passam por cima de comentários HTML sem
 * efeito visual, confirmado por teste real em 2026-09-23).
 *
 * `LessonSyncService` (nível-aula) já resolve "essa aula mudou desde a
 * última revisão?" — mas não diz QUAL slide mudou. Este serviço resolve
 * exatamente essa granularidade: Novo / Movido / Alterado / Inalterado por
 * slide, usando `public.lessons_slide_sync_state` (tabela própria, não
 * altera `lessons`).
 *
 * A lógica pura de parsing/slugify vive em `src/lib/slideId.ts` (sem
 * dependência de browser/Supabase) porque `api/format-lesson.ts` — uma
 * Vercel Function em Node puro — também precisa dela (pra atribuir
 * slide-id a slides novos de forma determinística, sem depender da IA
 * fazer isso certo).
 */

export type SlideStatus = 'new' | 'moved' | 'changed' | 'unchanged' | 'missing-id';

export type ParsedSlide = ParsedSlideBase;

export interface SlideSnapshotRow {
  slide_id: string;
  content_hash: string;
  slide_index: number;
}

export class SlideSyncService {
  public static parseSlides = parseSlides;
  public static ensureSlideIds = ensureSlideIds;

  /** Busca os snapshots conhecidos de uma aula (mapa slide_id -> snapshot). */
  public static async fetchSnapshots(lessonId: string): Promise<Map<string, SlideSnapshotRow>> {
    if (!isSupabaseConfigured()) return new Map();
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons_slide_sync_state')
        .select('slide_id, content_hash, slide_index')
        .eq('lesson_id', lessonId);
      if (error || !data) return new Map();
      return new Map(data.map((r: SlideSnapshotRow) => [r.slide_id, r]));
    } catch {
      return new Map();
    }
  }

  /** Classifica um slide já parseado contra o mapa de snapshots conhecidos. */
  public static async classify(slide: ParsedSlide, snapshots: Map<string, SlideSnapshotRow>): Promise<SlideStatus> {
    if (!slide.slideId) return 'missing-id';
    const known = snapshots.get(slide.slideId);
    if (!known) return 'new';
    const hash = await LessonSyncService.computeHash(slide.contentWithoutId);
    if (known.content_hash !== hash) return 'changed';
    if (known.slide_index !== slide.index) return 'moved';
    return 'unchanged';
  }

  /** Classifica todos os slides de uma aula de uma vez (1 busca de snapshots). */
  public static async classifyAll(lessonId: string, markdown: string): Promise<Array<ParsedSlide & { status: SlideStatus }>> {
    const [slides, snapshots] = await Promise.all([
      Promise.resolve(this.parseSlides(markdown)),
      this.fetchSnapshots(lessonId),
    ]);
    const out: Array<ParsedSlide & { status: SlideStatus }> = [];
    for (const slide of slides) {
      const status = await this.classify(slide, snapshots);
      out.push({ ...slide, status });
    }
    return out;
  }

  /** Marca um slide individual como revisado (grava hash + índice atuais). */
  public static async markSlideReviewed(lessonId: string, slide: ParsedSlide): Promise<void> {
    if (!isSupabaseConfigured() || !slide.slideId) return;
    const hash = await LessonSyncService.computeHash(slide.contentWithoutId);
    const supabase = getSupabaseClient();
    await supabase.from('lessons_slide_sync_state').upsert({
      lesson_id: lessonId,
      slide_id: slide.slideId,
      content_hash: hash,
      slide_index: slide.index,
      reviewed_at: new Date().toISOString(),
    });
  }

  /** Marca todos os slides identificados de uma aula como revisados de uma vez. */
  public static async markAllReviewed(lessonId: string, markdown: string): Promise<void> {
    const slides = this.parseSlides(markdown);
    for (const slide of slides) {
      await this.markSlideReviewed(lessonId, slide);
    }
  }
}
