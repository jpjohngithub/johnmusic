import React from 'react';
import { Platform } from '../../types';
import { Home, Search, Library, Radio, Link2 } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  activeFilter?: Platform | 'all';
  onNavigate: (view: string, filter?: Platform | 'all') => void;
  onOpenRecognizerModal?: () => void;
  onOpenImportModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  activeFilter,
  onNavigate,
  onOpenRecognizerModal,
  onOpenImportModal
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09070e]/95 backdrop-blur-2xl border-t border-purple-950/40 px-3 py-2 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'home' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Início</span>
      </button>

      <button
        onClick={() => onNavigate('search', 'all')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'search' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px]">Buscar</span>
      </button>

      {onOpenRecognizerModal && (
        <button
          onClick={onOpenRecognizerModal}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-purple-300 hover:text-purple-200"
          title="Shazam / Ouvir do PC"
        >
          <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <span className="text-[10px]">Shazam</span>
        </button>
      )}

      {onOpenImportModal && (
        <button
          onClick={onOpenImportModal}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-400 hover:text-purple-300"
          title="Importar Link"
        >
          <Link2 className="w-5 h-5" />
          <span className="text-[10px]">Importar</span>
        </button>
      )}

      <button
        onClick={() => onNavigate('library')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'library' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px]">Biblioteca</span>
      </button>
    </nav>
  );
};
