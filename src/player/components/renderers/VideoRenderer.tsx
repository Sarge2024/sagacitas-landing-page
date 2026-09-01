import React, { useState } from 'react';
import { MergedNodeProgress } from '../../types';

interface VideoRendererProps {
  node: MergedNodeProgress;
  onComplete: () => void;
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({ node, onComplete }) => {
  const [watched, setWatched] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateWatch = () => {
    if (watched) return;
    let pct = 0;
    const interval = setInterval(() => {
      pct += 5;
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setWatched(true);
      }
    }, 120);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Simulated Video Player */}
      <div className="relative bg-slate-900 rounded-md overflow-hidden aspect-video shadow-md flex items-center justify-center">
        {!watched ? (
          <button
            onClick={simulateWatch}
            className="flex flex-col items-center gap-3 text-white/80 hover:text-white transition-colors group"
            aria-label="Iniciar vídeo"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/80 flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </div>
            <span className="text-sm font-medium">Clique para iniciar o vídeo</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 text-emerald-400">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="text-sm font-medium">Vídeo concluído!</span>
          </div>
        )}

        {/* Progress Bar Overlay */}
        {progress > 0 && progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-slate-700">
              <div
                className="h-1 bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-mono">
          {node.duration || '08:30'}
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-blue-600">info</span>
          Sobre este conteúdo
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {node.description || 'Assista ao vídeo completo para compreender os conceitos fundamentais desta unidade curricular antes de avançar para a validação.'}
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={!watched}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all shadow-2xs ${
            watched
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          {watched ? 'Continuar para próximo passo' : 'Assista ao vídeo completo para continuar'}
        </button>
      </div>
    </div>
  );
};
