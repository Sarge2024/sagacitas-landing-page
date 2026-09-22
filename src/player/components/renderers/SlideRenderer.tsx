import React, { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MergedNodeProgress } from '../../types';

interface SlideRendererProps {
  node: MergedNodeProgress;
  onComplete: () => void;
}

const DEFAULT_MARKDOWN = `# Conteúdo indisponível
Nenhum conteúdo de slide foi cadastrado para esta unidade ainda.
---
Utilize o Editor Admin para colar o Markdown desta aula.`;

function splitSlides(markdown: string): string[] {
  return markdown
    .split(/\r?\n[ \t]*---[ \t]*\r?\n/)
    .map(slide => slide.trim())
    .filter(Boolean);
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ node, onComplete }) => {
  const slides = useMemo(
    () => splitSlides(node.markdownContent?.trim() || DEFAULT_MARKDOWN),
    [node.markdownContent]
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [furthestSlideSeen, setFurthestSlideSeen] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
    setFurthestSlideSeen(0);
  }, [node.id]);

  const isLastSlide = currentSlide === slides.length - 1;
  const allSlidesSeen = furthestSlideSeen >= slides.length - 1;

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    setCurrentSlide(clamped);
    setFurthestSlideSeen(prev => Math.max(prev, clamped));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
      if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  const slideHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(slides[currentSlide] ?? '', { async: false }) as string),
    [slides, currentSlide]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header Progress */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">menu_book</span>
          <span className="text-sm font-semibold text-slate-800">
            Slide {currentSlide + 1} de {slides.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentSlide
                  ? 'bg-blue-600'
                  : i <= furthestSlideSeen
                  ? 'bg-slate-400'
                  : 'bg-slate-200'
              }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Slide Content */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-2xs min-h-[280px]">
        <div
          className="prose prose-slate prose-sm max-w-none prose-headings:font-semibold prose-img:rounded-md"
          dangerouslySetInnerHTML={{ __html: slideHtml }}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goToSlide(currentSlide - 1)}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Anterior
        </button>

        {!isLastSlide ? (
          <button
            onClick={() => goToSlide(currentSlide + 1)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
          >
            Próximo
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onComplete}
            disabled={!allSlidesSeen}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-2xs ${
              allSlidesSeen
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Concluir e continuar
          </button>
        )}
      </div>
    </div>
  );
};
