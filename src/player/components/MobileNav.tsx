import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView } = usePlayerStore();

  const activeTabClass = 'flex flex-col items-center justify-center text-[#005daa] font-bold w-full h-full bg-[#d3e4fe]/40';
  const inactiveTabClass = 'flex flex-col items-center justify-center text-[#404753] hover:text-[#005daa] w-full h-full';

  return (
    <nav className="absolute bottom-0 w-full z-50 md:hidden bg-[#f8f9ff] border-t border-[#c0c7d6] shadow-lg h-16 flex justify-around items-center">
      <button
        onClick={() => setCurrentView('dashboard')}
        className={currentView === 'dashboard' ? activeTabClass : inactiveTabClass}
      >
        <span className="material-symbols-outlined text-xl" style={currentView === 'dashboard' ? { fontVariationSettings: "'FILL' 1" } : {}}>
          home
        </span>
        <span className="font-['JetBrains_Mono'] text-[11px] mt-0.5">Início</span>
      </button>

      <button
        onClick={() => setCurrentView('trail')}
        className={currentView === 'trail' ? activeTabClass : inactiveTabClass}
      >
        <span className="material-symbols-outlined text-xl" style={currentView === 'trail' ? { fontVariationSettings: "'FILL' 1" } : {}}>
          reorder
        </span>
        <span className="font-['JetBrains_Mono'] text-[11px] mt-0.5">Trilha</span>
      </button>

      <button
        onClick={() => setCurrentView('player')}
        className={currentView === 'player' ? activeTabClass : inactiveTabClass}
      >
        <span className="material-symbols-outlined text-xl" style={currentView === 'player' ? { fontVariationSettings: "'FILL' 1" } : {}}>
          assignment_turned_in
        </span>
        <span className="font-['JetBrains_Mono'] text-[11px] mt-0.5">Tarefas</span>
      </button>

      <button
        onClick={() => setCurrentView('handshake')}
        className={currentView === 'handshake' ? activeTabClass : inactiveTabClass}
      >
        <span className="material-symbols-outlined text-xl" style={currentView === 'handshake' ? { fontVariationSettings: "'FILL' 1" } : {}}>
          person
        </span>
        <span className="font-['JetBrains_Mono'] text-[11px] mt-0.5">Perfil</span>
      </button>
    </nav>
  );
};
