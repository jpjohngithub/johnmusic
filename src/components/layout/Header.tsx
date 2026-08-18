import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Keyboard, 
  X, 
  Sliders,
  Activity
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    searchQuery, 
    setSearchQuery,
    toggleEqualizer,
    toggleVisualizer,
    isPlaying
  } = usePlayer();

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && currentView !== 'explore') {
      setCurrentView('explore');
    }
  };

  const shortcuts = [
    { key: 'Espaço', desc: 'Tocar / Pausar reprodução' },
    { key: '→ / ←', desc: 'Avançar ou retroceder 5 segundos' },
    { key: '↑ / ↓', desc: 'Aumentar ou diminuir volume' },
    { key: 'M', desc: 'Mutar ou desmutar o áudio' },
    { key: 'L', desc: 'Favoritar / Curtir a música atual' },
    { key: 'N', desc: 'Pular para a próxima faixa' },
    { key: 'P', desc: 'Voltar para a faixa anterior' },
  ];

  return (
    <>
      <header className="h-16 px-6 bg-slate-950/40 backdrop-blur-md border-b border-slate-800/40 flex items-center justify-between z-20">
        {/* Navigation & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Voltar ao início"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('explore')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Explorar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="O que você quer ouvir hoje? (Ex: Cyberpunk, Lofi, Rock...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && currentView !== 'explore') {
                  setCurrentView('explore');
                }
              }}
              className="w-full pl-10 pr-10 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Action buttons */}
          <button
            onClick={toggleEqualizer}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            title="Abrir Equalizador"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>EQ Pro</span>
          </button>

          <button
            onClick={toggleVisualizer}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            title="Abrir Visualizador"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visualizador</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Atalhos do Teclado"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800/80">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400 font-bold text-xs">
                  JM
                </div>
              </div>
              {isPlaying && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                John
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400">johnmusic Studio</div>
            </div>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Keyboard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Atalhos de Teclado</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-4">
              {shortcuts.map((sc) => (
                <div key={sc.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                  <span className="text-slate-300">{sc.desc}</span>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-semibold shadow-inner">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Pressione qualquer tecla enquanto ouve para controlar o johnmusic!
            </div>
          </div>
        </div>
      )}
    </>
  );
};
