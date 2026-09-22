import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const SidebarNav: React.FC = () => {
  const { currentView, setCurrentView, manifest, activeNode, selectLearningObject } = usePlayerStore();

  const activeItemClass =
    'flex items-center gap-3 px-4 py-3 bg-[#0075d5] text-white font-semibold rounded-xl transition-all duration-200 shadow-xs';
  const inactiveItemClass =
    'flex items-center gap-3 px-4 py-3 text-[#404753] hover:bg-[#dce9ff] hover:text-[#005daa] rounded-xl transition-all duration-200';

  const handleResume = () => {
    if (activeNode) {
      selectLearningObject(activeNode.id);
    } else {
      setCurrentView('trail');
    }
  };

  return (
    <aside className="hidden md:flex flex-col p-4 gap-2 absolute left-0 top-16 h-[calc(100vh-64px)] w-[280px] bg-[#eff4ff] border-r border-[#c0c7d6] z-30 overflow-y-auto">
      {/* Header / Course Context Box */}
      <div className="flex flex-col gap-2 mb-4 p-4 bg-[#d3e4fe] rounded-xl border border-[#a5c8ff]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0075d5] flex items-center justify-center shrink-0 overflow-hidden border border-[#c0c7d6] text-white">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-['Hanken_Grotesk'] font-semibold text-sm text-[#0b1c30] truncate">
              {manifest?.title || 'Curso Atual'}
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#404753] truncate">
              {manifest?.module_name || 'Módulo 3: Lógica Avançada'}
            </span>
          </div>
        </div>
        <button
          onClick={handleResume}
          className="mt-3 w-full py-2 px-4 bg-[#005daa] text-white rounded-md font-[#Inter] text-sm font-medium hover:bg-[#0075d5] transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">play_arrow</span>
          Retomar Aprendizado
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 flex-grow font-['Inter'] text-sm">
        <button
          onClick={() => setCurrentView('trail')}
          className={currentView === 'trail' ? activeItemClass : inactiveItemClass}
        >
          <span className="material-symbols-outlined text-xl">account_tree</span>
          <span>Trilha do Curso</span>
        </button>

        <button
          onClick={() => setCurrentView('wallet')}
          className={currentView === 'wallet' ? activeItemClass : inactiveItemClass}
        >
          <span className="material-symbols-outlined text-xl">group</span>
          <span>Gerenciar Acessos</span>
        </button>

        <a href="/class-studio" className={inactiveItemClass}>
          <span className="material-symbols-outlined text-xl">edit_note</span>
          <span>Class Studio</span>
        </a>

        <button
          onClick={() => setCurrentView('player')}
          className={currentView === 'player' ? activeItemClass : inactiveItemClass}
        >
          <span className="material-symbols-outlined text-xl">play_lesson</span>
          <span>Objetos de Aprendizagem</span>
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={currentView === 'dashboard' ? activeItemClass : inactiveItemClass}
        >
          <span className="material-symbols-outlined text-xl">folder</span>
          <span>Recursos</span>
        </button>

        <button
          onClick={() => setCurrentView('trail')}
          className={inactiveItemClass}
        >
          <span className="material-symbols-outlined text-xl">contact_support</span>
          <span>Suporte</span>
        </button>
      </div>

      {/* Footer Links */}
      <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-[#c0c7d6] font-['Inter'] text-sm">
        <button className={inactiveItemClass}>
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Configurações</span>
        </button>
        <button
          onClick={() => setCurrentView('handshake')}
          className="flex items-center gap-3 px-4 py-3 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl transition-all duration-200"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
