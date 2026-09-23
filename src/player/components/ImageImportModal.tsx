import React, { useRef, useState } from 'react';
import { LessonEditorService } from '../services/LessonEditorService';
import { ImageAnnotatorModal } from './ImageAnnotatorModal';

// Casa tanto `![texto simples](url)` quanto o padrão usado pelo Works Manager
// nos placeholders de print, com colchete duplo: `![[PRINT: Título]](url)`.
const IMAGE_REGEX = /!\[((?:\[[^\]]*\])|[^\]]*)\]\(([^)]+)\)/g;

export interface ImageSlot {
  fullMatch: string;
  altRaw: string;
  url: string;
}

// "Real" = já aponta pro Vercel Blob: uma URL absoluta http(s), ou o proxy
// interno /api/blob-serve?pathname=... usado pelos blobs privados
// (LessonEditorService.uploadImage). Qualquer outra coisa (caminho relativo
// tipo ../imagens/x.png, ou a descrição-como-url que o Auto-Formatar IA gera)
// ainda não foi importada.
export function isRealUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('/api/blob-serve');
}

export function extractImageSlots(markdown: string): ImageSlot[] {
  return Array.from(markdown.matchAll(IMAGE_REGEX)).map(m => ({
    fullMatch: m[0],
    altRaw: m[1],
    url: m[2],
  }));
}

interface ImageImportModalProps {
  markdown: string;
  onReplace: (oldFullMatch: string, newFullMatch: string) => void;
  onClose: () => void;
}

interface SlotRowProps {
  slot: ImageSlot;
  onReplace: (oldFullMatch: string, newFullMatch: string) => void;
}

const SlotRow: React.FC<SlotRowProps> = ({ slot, onReplace }) => {
  const [currentSlot, setCurrentSlot] = useState(slot);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imported = isRealUrl(currentSlot.url);

  const handleAnnotationSaved = (newUrl: string) => {
    const newFullMatch = `![${currentSlot.altRaw}](${newUrl})`;
    onReplace(currentSlot.fullMatch, newFullMatch);
    setCurrentSlot({ ...currentSlot, url: newUrl, fullMatch: newFullMatch });
    setIsAnnotating(false);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const newUrl = await LessonEditorService.uploadImage(file);
      const newFullMatch = `![${currentSlot.altRaw}](${newUrl})`;
      onReplace(currentSlot.fullMatch, newFullMatch);
      setCurrentSlot({ ...currentSlot, url: newUrl, fullMatch: newFullMatch });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
        {imported ? (
          <img src={currentSlot.url} alt={currentSlot.altRaw} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-slate-400">image</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{currentSlot.altRaw}</p>
        {errorMsg ? (
          <p className="text-xs text-red-600 truncate">{errorMsg}</p>
        ) : (
          <p className={`text-xs font-mono truncate ${imported ? 'text-emerald-600' : 'text-slate-400'}`}>
            {currentSlot.url}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {imported && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Importada
          </span>
        )}
        {imported && (
          <button
            onClick={() => setIsAnnotating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 bg-purple-50 rounded-md text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">draw</span>
            Anotar
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">upload</span>
          {isUploading ? 'Enviando…' : imported ? 'Substituir' : 'Selecionar imagem'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
      </div>

      {isAnnotating && (
        <ImageAnnotatorModal
          imageUrl={currentSlot.url}
          onSave={handleAnnotationSaved}
          onClose={() => setIsAnnotating(false)}
        />
      )}
    </div>
  );
};

export const ImageImportModal: React.FC<ImageImportModalProps> = ({ markdown, onReplace, onClose }) => {
  const slots = extractImageSlots(markdown);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Importar Imagens</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O título de cada imagem já vem do Markdown da aula — só selecione o arquivo correspondente do seu computador.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {slots.length === 0 ? (
            <p className="text-sm text-slate-500 p-5">Nenhuma referência de imagem encontrada neste Markdown.</p>
          ) : (
            slots.map((slot, i) => <SlotRow key={`${slot.fullMatch}-${i}`} slot={slot} onReplace={onReplace} />)
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Concluído
          </button>
        </footer>
      </div>
    </div>
  );
};
