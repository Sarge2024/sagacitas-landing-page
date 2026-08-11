import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { HeaderNav } from './HeaderNav';
import { SidebarNav } from './SidebarNav';
import { MobileNav } from './MobileNav';

export const CourseTrailView: React.FC = () => {
  const { manifest, navigationTree, selectLearningObject } = usePlayerStore();

  const handleCardClick = (ucId: string, state: string) => {
    if (state !== 'LOCKED') {
      selectLearningObject(ucId);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] h-full overflow-y-auto font-['Inter']">
      <HeaderNav />
      <SidebarNav />

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-[280px] w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pt-24 md:pb-12 transition-all">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-bold text-[#0b1c30] mb-2 tracking-tight">
            {manifest?.module_name || 'Módulo 3: Lógica Avançada'}
          </h1>
          <p className="text-base text-[#404753] max-w-2xl leading-relaxed">
            Siga a trilha de aprendizagem para dominar estruturas condicionais complexas e pensamento algorítmico.
            Complete cada objeto para desbloquear o próximo.
          </p>
        </div>

        {/* Course Trail Vertical Flow Path */}
        <div className="relative max-w-3xl mx-auto flex flex-col items-center py-4">
          {/* Timeline Connector Line Background */}
          <div className="absolute left-6 sm:left-1/2 top-10 bottom-10 w-[2px] bg-[#c0c7d6] sm:-translate-x-1/2 z-0" />

          {/* Render Learning Objects */}
          {navigationTree.map((node, index) => {
            const isEven = index % 2 === 0;
            const isCompleted = node.state === 'COMPLETED' || node.can_skip_by_dnt;
            const isInProgress = node.state === 'IN_PROGRESS' || node.state === 'AVAILABLE';
            const isRemediation = node.state === 'REMEDIATION';
            const isLocked = node.state === 'LOCKED';

            return (
              <div
                key={node.id}
                className={`relative z-10 w-full flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between mb-10 group ${
                  isEven ? '' : 'sm:flex-row-reverse'
                }`}
              >
                {/* Timeline Status Node Icon */}
                <div
                  className={`absolute left-1 sm:left-1/2 sm:-translate-x-1/2 top-4 sm:top-auto z-20 flex items-center justify-center w-10 h-10 rounded-full shadow-sm ring-4 ring-[#f8f9ff] transition-transform group-hover:scale-110 ${
                    isCompleted
                      ? 'bg-[#006c49] text-white'
                      : isInProgress
                      ? 'bg-[#005daa] text-white animate-pulse'
                      : isRemediation
                      ? 'bg-[#ba1a1a] text-white'
                      : 'bg-[#dce9ff] text-[#707785]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isCompleted
                      ? 'check_circle'
                      : isInProgress
                      ? 'play_arrow'
                      : isRemediation
                      ? 'warning'
                      : 'lock'}
                  </span>
                </div>

                {/* Card Content (Alternates sides on desktop) */}
                <div
                  className={`w-full sm:w-[calc(50%-40px)] pl-14 sm:pl-0 ${
                    isEven ? 'sm:pr-8 sm:text-right' : 'sm:pl-8 sm:text-left'
                  }`}
                >
                  <div
                    onClick={() => handleCardClick(node.id, node.state)}
                    className={`bg-white border shadow-xs rounded-md p-6 relative overflow-hidden transition-all duration-300 ${
                      isLocked
                        ? 'border-[#c0c7d6] bg-[#eff4ff]/60 opacity-60 cursor-not-allowed'
                        : isInProgress
                        ? 'border-[#005daa] ring-1 ring-[#005daa] cursor-pointer hover:-translate-y-1 shadow-md'
                        : isRemediation
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a] cursor-pointer bg-[#ffdad6]/20'
                        : 'border-[#c0c7d6] cursor-pointer hover:-translate-y-1 hover:shadow-md'
                    }`}
                  >
                    {/* Status Left Accent Strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isCompleted
                          ? 'bg-[#006c49]'
                          : isInProgress
                          ? 'bg-[#005daa]'
                          : isRemediation
                          ? 'bg-[#ba1a1a]'
                          : 'bg-[#c0c7d6]'
                      }`}
                    />

                    {/* Card Header Status Badge */}
                    <div
                      className={`flex items-center gap-2 mb-2 ${
                        isEven ? 'sm:justify-end' : 'sm:justify-start'
                      }`}
                    >
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-[#006c49] font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-wider">
                          <span>CONCLUÍDO</span>
                          {node.is_exempt_by_dnt && (
                            <span className="bg-[#6cf8bb]/30 text-[#00714d] text-[10px] px-1.5 py-0.2 rounded font-mono">
                              DNT
                            </span>
                          )}
                          <span className="material-symbols-outlined text-sm">task_alt</span>
                        </div>
                      )}

                      {isInProgress && (
                        <div className="flex items-center gap-1.5 text-[#005daa] font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-wider">
                          <span>EM ANDAMENTO</span>
                          <span className="w-2 h-2 rounded-full bg-[#005daa] animate-ping" />
                        </div>
                      )}

                      {isRemediation && (
                        <div className="flex items-center gap-1.5 text-[#ba1a1a] font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-wider">
                          <span>REMEDIAÇÃO DNT</span>
                          <span className="material-symbols-outlined text-sm">error</span>
                        </div>
                      )}

                      {isLocked && (
                        <div className="flex items-center gap-1 text-[#707785] font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-wider">
                          <span>BLOQUEADO</span>
                        </div>
                      )}
                    </div>

                    {/* Card Title & Description */}
                    <h3 className="font-['Hanken_Grotesk'] text-lg font-semibold text-[#0b1c30] mb-2">
                      {node.title}
                    </h3>
                    <p className="text-sm text-[#404753] line-clamp-2 mb-4 leading-relaxed">
                      {node.description}
                    </p>

                    {/* Card Footer Metrics & Action Button */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 mt-4 ${
                        isEven ? 'sm:flex-row-reverse' : 'sm:flex-row'
                      }`}
                    >
                      <div className="flex items-center gap-4 text-[#707785] font-['JetBrains_Mono'] text-xs">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {node.duration}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <span className="material-symbols-outlined text-sm">
                            {node.type === 'video'
                              ? 'movie'
                              : node.type === 'lab'
                              ? 'science'
                              : node.type === 'quiz'
                              ? 'quiz'
                              : 'assignment'}
                          </span>
                          {node.type}
                        </span>
                        {node.score !== null && (
                          <span className="font-bold text-[#005daa]">Nota: {node.score}%</span>
                        )}
                      </div>

                      {isInProgress && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectLearningObject(node.id);
                          }}
                          className="bg-[#005daa] text-white font-['Inter'] text-xs font-semibold px-4 py-2 rounded-md hover:bg-[#0075d5] transition-colors shadow-xs flex items-center gap-1"
                        >
                          <span>Continuar</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      )}

                      {isRemediation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectLearningObject(node.id);
                          }}
                          className="bg-[#ba1a1a] text-white font-['Inter'] text-xs font-semibold px-4 py-2 rounded-md hover:bg-[#ba1a1a]/90 transition-colors shadow-xs flex items-center gap-1"
                        >
                          <span>Refazer (Remediação)</span>
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Spacer element for alternating grid */}
                <div className="hidden sm:block w-[calc(50%-40px)]" />
              </div>
            );
          })}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};
