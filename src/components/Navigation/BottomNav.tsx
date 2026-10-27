import React from 'react';
import { Platform } from '../../types';
import { SpotifyIcon, YouTubeIcon, TikTokIcon } from '../Icons';
import { Home, Search, Library } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  activeFilter?: Platform | 'all';
  onNavigate: (view: string, filter?: Platform | 'all') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  activeFilter,
  onNavigate
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0d14]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl">
      {/* 1. Início */}
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'home'
            ? 'text-purple-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Início</span>
      </button>

      {/* 2. Buscar */}
      <button
        onClick={() => onNavigate('search', 'all')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'search' && activeFilter === 'all'
            ? 'text-purple-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px]">Buscar</span>
      </button>

      {/* 3. Spotify */}
      <button
        onClick={() => onNavigate('search', 'spotify')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'search' && activeFilter === 'spotify'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-emerald-400'
        }`}
      >
        <SpotifyIcon className="w-5 h-5" />
        <span className="text-[10px]">Spotify</span>
      </button>

      {/* 4. YouTube */}
      <button
        onClick={() => onNavigate('search', 'youtube')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'search' && activeFilter === 'youtube'
            ? 'text-red-400 font-bold'
            : 'text-slate-400 hover:text-red-400'
        }`}
      >
        <YouTubeIcon className="w-5 h-5" />
        <span className="text-[10px]">YouTube</span>
      </button>

      {/* 5. TikTok */}
      <button
        onClick={() => onNavigate('search', 'tiktok')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'search' && activeFilter === 'tiktok'
            ? 'text-cyan-400 font-bold'
            : 'text-slate-400 hover:text-cyan-400'
        }`}
      >
        <TikTokIcon className="w-5 h-5" />
        <span className="text-[10px]">TikTok</span>
      </button>

      {/* 6. Biblioteca */}
      <button
        onClick={() => onNavigate('library')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
          currentView === 'library'
            ? 'text-purple-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px]">Biblioteca</span>
      </button>
    </nav>
  );
};
