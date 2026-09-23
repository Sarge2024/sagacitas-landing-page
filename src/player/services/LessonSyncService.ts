import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export type SyncStatus = 'new' | 'changed' | 'synced';

/**
 * Rastreamento de sincronia entre o que o Works Manager escreve em
 * `lessons.markdown_content` e a última versão que um instrutor revisou aqui
 * no Class Studio. Guarda só um hash (`public.lessons_sync_state`, tabela
 * própria deste repo — não altera `lessons`).
 *
 * Resolve: ao receber uma nova leva de dados do Works Manager, como saber
 * quais aulas são novas, quais mudaram (precisam de atenção/reformatação) e
 * quais continuam exatamente iguais (não mexer)? Sem isso, já aconteceu de
 * uma aula pronta ser reformatada por engano e perder conteúdo (ver
 * .ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md).
 */
export class LessonSyncService {
  public static async computeHash(content: string): Promise<string> {
    const data = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Busca todos os snapshots conhecidos de uma vez (mapa lesson_id -> hash),
   * pra não fazer uma consulta por aula na lista do Class Studio.
   */
  public static async fetchSnapshots(): Promise<Record<string, string>> {
    if (!isSupabaseConfigured()) return {};
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('lessons_sync_state').select('lesson_id, content_hash');
      if (error || !data) return {};
      return Object.fromEntries(data.map((r: { lesson_id: string; content_hash: string }) => [r.lesson_id, r.content_hash]));
    } catch {
      return {};
    }
  }

  /**
   * Deriva o status a partir de um mapa de snapshots já carregado (síncrono,
   * sem chamada de rede — use fetchSnapshots() uma vez para a lista inteira).
   */
  public static getStatus(currentHash: string, knownHash: string | undefined): SyncStatus {
    if (!knownHash) return 'new';
    return knownHash === currentHash ? 'synced' : 'changed';
  }

  /**
   * Marca uma aula como revisada: grava o hash do conteúdo atual como o
   * "último estado conhecido". Chamar após salvar uma edição, ou quando o
   * instrutor aceita explicitamente uma aula que já chegou pronta.
   */
  public static async markReviewed(lessonId: string, content: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const hash = await this.computeHash(content);
    const supabase = getSupabaseClient();
    await supabase
      .from('lessons_sync_state')
      .upsert({ lesson_id: lessonId, content_hash: hash, reviewed_at: new Date().toISOString() });
  }
}
