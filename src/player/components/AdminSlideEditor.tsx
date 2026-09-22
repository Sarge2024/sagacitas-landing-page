import React, { useEffect, useRef, useState } from 'react';
import { LessonEditorService, LessonRecord } from '../services/LessonEditorService';
import { MergedNodeProgress } from '../types';
import { SlideRenderer } from './renderers/SlideRenderer';
import { formatLessonWithHF } from '../../services/hfService';
import { ImageImportModal, extractImageSlots, isRealUrl } from './ImageImportModal';

interface AdminSlideEditorProps {
  lessonId: string;
}

export const AdminSlideEditor: React.FC<AdminSlideEditorProps> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    LessonEditorService.fetchLesson(lessonId)
      .then(record => {
        if (cancelled) return;
        setLesson(record);
        setDraft(record?.markdown_content ?? '');
      })
      .catch(err => {
        if (cancelled) return;
        setStatusMsg({ text: err instanceof Error ? err.message : String(err), isError: true });
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const insertAtCursor = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDraft(prev => `${prev}\n${snippet}`);
      return;
    }
    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${snippet}${draft.slice(end)}`;
    setDraft(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setStatusMsg(null);
    try {
      const url = await LessonEditorService.uploadImage(file);
      const altText = file.name.replace(/\.[^.]+$/, '');
      insertAtCursor(`![${altText}](${url})`);
      setStatusMsg({ text: 'Imagem enviada e inserida no editor.', isError: false });
    } catch (err) {
      setStatusMsg({ text: err instanceof Error ? err.message : String(err), isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await LessonEditorService.saveLessonMarkdown(lessonId, draft);
      setStatusMsg({ text: 'Conteúdo salvo com sucesso.', isError: false });
    } catch (err) {
      setStatusMsg({ text: err instanceof Error ? err.message : String(err), isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = async () => {
    if (!draft.trim()) {
      setStatusMsg({ text: 'Adicione algum conteúdo antes de formatar.', isError: true });
      return;
    }
    setIsFormatting(true);
    setStatusMsg({ text: 'A IA está formatando o conteúdo. Isso pode levar alguns segundos...', isError: false });
    try {
      const formatted = await formatLessonWithHF(draft);
      setDraft(formatted);
      setStatusMsg({ text: 'Conteúdo formatado com sucesso! Revise e clique em Salvar.', isError: false });
    } catch (err) {
      setStatusMsg({ text: err instanceof Error ? err.message : String(err), isError: true });
    } finally {
      setIsFormatting(false);
    }
  };

  const pendingImageCount = extractImageSlots(draft).filter(slot => !isRealUrl(slot.url)).length;

  const previewNode: MergedNodeProgress = {
    id: lesson?.uc_id || lessonId,
    title: lesson?.title || 'Pré-visualização',
    description: '',
    type: 'slide',
    duration: '',
    order: lesson?.order ?? 0,
    prerequisites: [],
    markdownContent: draft,
    state: 'AVAILABLE',
    score: null,
    is_exempt_by_dnt: false,
    is_available: true,
    can_skip_by_dnt: false,
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500 text-sm font-['Inter']">
        Carregando aula...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-['Inter']">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <a
            href="/class-studio"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mb-1 w-fit"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Class Studio
          </a>
          <h1 className="text-base font-semibold text-slate-800">
            {lesson?.title || 'Editor de Aula'}
          </h1>
          <p className="text-xs text-slate-400 font-mono">lessonId: {lessonId}</p>
        </div>
        <div className="flex items-center gap-3">
          {statusMsg && (
            <span className={`text-xs ${statusMsg.isError ? 'text-red-600' : 'text-emerald-600'}`}>
              {statusMsg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Editor + Preview (side by side) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Markdown Editor */}
        <div className="flex flex-col border-r border-slate-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Markdown</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFormat}
                disabled={isFormatting || isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 bg-purple-50 rounded-md text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {isFormatting ? 'Formatando…' : 'Auto-Formatar (IA)'}
              </button>
              <button
                onClick={handleImageButtonClick}
                disabled={isUploading || isFormatting}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">image</span>
                {isUploading ? 'Enviando…' : 'Inserir imagem'}
              </button>
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                Importar Imagens{pendingImageCount > 0 ? ` (${pendingImageCount})` : ''}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck={false}
            placeholder={'# Título do slide\nConteúdo...\n\n---\n\n## Próximo slide'}
            className="flex-1 p-4 font-mono text-sm text-slate-800 resize-none focus:outline-none overflow-y-auto"
          />
        </div>

        {/* Live Preview */}
        <div className="flex flex-col overflow-hidden bg-slate-100">
          <div className="px-4 py-2 border-b border-slate-200 bg-white shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pré-visualização</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SlideRenderer node={previewNode} onComplete={() => {}} />
          </div>
        </div>
      </div>

      {isImageModalOpen && (
        <ImageImportModal
          markdown={draft}
          onReplace={(oldFullMatch, newFullMatch) =>
            setDraft(prev => prev.replace(oldFullMatch, newFullMatch))
          }
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
};
