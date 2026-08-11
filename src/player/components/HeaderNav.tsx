import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const HeaderNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    session,
    toggleInspectorModal,
    logs,
  } = usePlayerStore();

  const activeTabClass = 'text-primary border-b-2 border-primary pb-1 font-semibold';
  const inactiveTabClass = 'text-[#404753] hover:text-primary transition-colors pb-1';

  return (
    <header className="bg-[#f8f9ff] border-b border-[#c0c7d6] shadow-xs w-full absolute top-0 z-40">
      <div className="flex justify-between items-center w-full px-6 h-16 max-w-[1280px] mx-auto">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setCurrentView('dashboard')}
        >
          <span className="material-symbols-outlined text-primary text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
          <span className="font-['Hanken_Grotesk'] text-xl font-bold text-[#005daa] tracking-tight">
            Sagacitas Player
          </span>
          <span className="hidden sm:inline-block bg-[#d4e3ff] text-[#001c3a] text-[10px] font-mono px-2 py-0.5 rounded font-medium border border-[#a5c8ff]">
            B2B SDK
          </span>
        </div>

        {/* Search Input (Desktop) */}
        <div className="hidden md:flex items-center bg-[#e5eeff] rounded-full px-4 py-1.5 w-80 border border-[#c0c7d6] focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-[#404753] mr-2 text-xl">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar cursos..."
            className="bg-transparent border-none outline-none w-full text-[#0b1c30] text-sm placeholder:text-[#404753] focus:ring-0 p-0"
          />
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 font-['Hanken_Grotesk'] text-base">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={currentView === 'dashboard' ? activeTabClass : inactiveTabClass}
          >
            Painel
          </button>
          <button
            onClick={() => setCurrentView('trail')}
            className={currentView === 'trail' ? activeTabClass : inactiveTabClass}
          >
            Meus Cursos
          </button>
          <button
            onClick={() => setCurrentView('player')}
            className={currentView === 'player' ? activeTabClass : inactiveTabClass}
          >
            Recursos
          </button>
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-3">
          {/* SDK Service Logs Inspector Button */}
          <button
            onClick={toggleInspectorModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#d3e4fe] text-[#004785] hover:bg-[#0075d5] hover:text-white rounded-md text-xs font-mono font-medium transition-colors"
            title="Inspecionar chamadas de serviços e logs do DNT Engine"
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span className="hidden lg:inline">SDK Logs</span>
            {logs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse"></span>
            )}
          </button>

          <button className="text-[#404753] hover:text-primary transition-colors p-1.5 rounded-full hover:bg-[#e5eeff]">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button
            onClick={() => setCurrentView('handshake')}
            title="Refazer Autenticação Handshake"
            className="text-[#404753] hover:text-primary transition-colors p-1.5 rounded-full hover:bg-[#e5eeff]"
          >
            <span className="material-symbols-outlined text-xl">key</span>
          </button>
          <button className="hidden md:block text-[#404753] hover:text-primary transition-colors p-1.5 rounded-full hover:bg-[#e5eeff]">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c0c7d6] ml-1 bg-[#d4e3ff] shrink-0">
            <img
              src={session?.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={session?.user.name || 'User profile'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
