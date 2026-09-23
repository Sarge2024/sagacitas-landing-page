import React, { useEffect, useState } from 'react';
import { LessonEditorService, LessonRecord } from '../services/LessonEditorService';
import { LessonSyncService, SyncStatus } from '../services/LessonSyncService';
import { SlideSyncService } from '../services/SlideSyncService';
import { formatLessonWithHF } from '../../services/hfService';

function isSlideFormatted(markdown: string | null): boolean {
  if (!markdown) return false;
  return /\n[ \t]*---[ \t]*\n/.test(markdown);
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  new: 'Nova',
  changed: 'Alterada',
  synced: 'Sincronizada',
};

export const ClassStudioIndex: React.FC = () => {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [slideChangeCounts, setSlideChangeCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formattingId, setFormattingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [records, snapshots] = await Promise.all([
        LessonEditorService.listLessons(),
        LessonSyncService.fetchSnapshots(),
      ]);
      if (cancelled) return;

      const statuses: Record<string, SyncStatus> = {};
      for (const lesson of records) {
        const hash = await LessonSyncService.computeHash(lesson.markdown_content ?? '');
        statuses[lesson.id] = LessonSyncService.getStatus(hash, snapshots[lesson.id]);
      }
      if (cancelled) return;

      setLessons(records);
      setSyncStatus(statuses);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Contagem de slides que precisam de atenção (protocolo slide-id), só pras
  // aulas "Alteradas" — evita reparsear/hashear todas as 33 aulas à toa; o
  // instrutor só precisa dessa granularidade quando já sabe que algo mudou.
  useEffect(() => {
    let cancelled = false;
    const changedLessons = lessons.filter(l => syncStatus[l.id] === 'changed');
    if (changedLessons.length === 0) return;

    (async () => {
      const counts: Record<string, number> = {};
      for (const lesson of changedLessons) {
        const slides = await SlideSyncService.classifyAll(lesson.id, lesson.markdown_content ?? '');
        counts[lesson.id] = slides.filter(s => s.status === 'new' || s.status === 'moved' || s.status === 'changed').length;
      }
      if (!cancelled) setSlideChangeCounts(prev => ({ ...prev, ...counts }));
    })();

    return () => {
      cancelled = true;
    };
  }, [lessons, syncStatus]);

  const handleFormat = async (lesson: LessonRecord, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lesson.markdown_content?.trim()) {
      setErrorMsg(`"${lesson.title}" não tem conteúdo para formatar.`);
      return;
    }
    setFormattingId(lesson.id);
    setErrorMsg(null);
    try {
      const formatted = await formatLessonWithHF(lesson.markdown_content);
      await LessonEditorService.saveLessonMarkdown(lesson.id, formatted);
      await LessonSyncService.markReviewed(lesson.id, formatted);
      setLessons(prev => prev.map(l => (l.id === lesson.id ? { ...l, markdown_content: formatted } : l)));
      setSyncStatus(prev => ({ ...prev, [lesson.id]: 'synced' }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setFormattingId(null);
    }
  };

  const handleMarkReviewed = async (lesson: LessonRecord, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReviewingId(lesson.id);
    setErrorMsg(null);
    try {
      await LessonSyncService.markReviewed(lesson.id, lesson.markdown_content ?? '');
      setSyncStatus(prev => ({ ...prev, [lesson.id]: 'synced' }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewingId(null);
    }
  };

  const groups = new Map<string, LessonRecord[]>();
  for (const lesson of lessons) {
    const key = lesson.gc_id || '(sem curso)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(lesson);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Inter']">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <a
          href="/"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mb-2 w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar ao Console de Treinamentos
        </a>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">edit_note</span>
          Class Studio
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Ambiente de edição das aulas de treinamento.</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando aulas…</p>
        ) : lessons.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma aula encontrada.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {Array.from(groups.entries()).map(([gcId, group]) => (
              <section key={gcId}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {gcId} <span className="font-normal normal-case text-slate-400">({group.length} aulas)</span>
                </h2>
                <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
                  {group.map(lesson => {
                    const formatted = isSlideFormatted(lesson.markdown_content);
                    const isFormatting = formattingId === lesson.id;
                    const isReviewing = reviewingId === lesson.id;
                    const status = syncStatus[lesson.id] ?? 'synced';
                    const needsAttention = status !== 'synced';
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <a href={`/class-studio/${lesson.id}`} className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{lesson.title}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">
                            {lesson.module_id || '—'} / {lesson.uc_id || '—'}
                          </p>
                        </a>
                        <div className="flex items-center gap-2 shrink-0">
                          {needsAttention && (
                            <span
                              className={`text-[11px] font-medium px-2 py-1 rounded-full border ${
                                status === 'new'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                              title="O Works Manager publicou/alterou este conteúdo — revise antes de considerar pronto."
                            >
                              {SYNC_LABEL[status]}
                              {status === 'changed' && slideChangeCounts[lesson.id] !== undefined && (
                                <> · {slideChangeCounts[lesson.id]} slide{slideChangeCounts[lesson.id] === 1 ? '' : 's'}</>
                              )}
                            </span>
                          )}
                          {needsAttention && (
                            <button
                              onClick={e => handleMarkReviewed(lesson, e)}
                              disabled={isReviewing}
                              className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 rounded-full text-[11px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                              title="Marca esta versão como revisada, sem alterar o conteúdo."
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              {isReviewing ? 'Marcando…' : 'Marcar como revisada'}
                            </button>
                          )}
                          {!formatted && (
                            <button
                              onClick={e => handleFormat(lesson, e)}
                              disabled={isFormatting}
                              className="flex items-center gap-1.5 px-2.5 py-1 border border-purple-200 bg-purple-50 rounded-full text-[11px] font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">auto_awesome</span>
                              {isFormatting ? 'Formatando…' : 'Formatar com IA'}
                            </button>
                          )}
                          <span
                            className={`text-[11px] font-medium px-2 py-1 rounded-full ${
                              formatted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {formatted ? 'Formatado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
