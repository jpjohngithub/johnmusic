import React from 'react';
import { usePlaylists } from '../../context/PlaylistContext';
import { Platform } from '../../types';
import { SpotifyIcon, YouTubeIcon, TikTokIcon } from '../Icons';
import {
  Home,
  Search,
  Library,
  PlusCircle,
  Layers,
  Sparkles,
  Headphones,
  Radio,
  Link2
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, filter?: Platform | 'all') => void;
  onOpenMergeModal: () => void;
  onOpenCreateModal: () => void;
  onOpenRecognizerModal: () => void;
  onOpenImportModal: () => void;
  onSelectPlaylist: (id: string) => void;
  selectedPlaylistId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenMergeModal,
  onOpenCreateModal,
  onOpenRecognizerModal,
  onOpenImportModal,
  onSelectPlaylist,
  selectedPlaylistId
}) => {
  const { playlists } = usePlaylists();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[#09070e] border-r border-purple-950/40 p-4 sticky top-0 flex-shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-950/50">
          <Headphones className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white">
            JohnMusic
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
            Unified 3.0
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-5">
        <button
          onClick={() => onNavigate('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentView === 'home' && !selectedPlaylistId
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          Início
        </button>

        <button
          onClick={() => onNavigate('search', 'all')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentView === 'search'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          Buscar Músicas & Playlists
        </button>

        <button
          onClick={() => onNavigate('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentView === 'library'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className="w-4 h-4" />
          Sua Biblioteca
        </button>
      </nav>

      {/* Smart Tools (Shazam + Import) */}
      <div className="mb-5 space-y-1">
        <div className="px-3 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Ferramentas
        </div>

        <button
          onClick={onOpenRecognizerModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-purple-300 bg-[#160f22]/70 hover:bg-purple-950/80 border border-purple-900/30 transition-all"
        >
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            Ouvir do PC (Shazam)
          </span>
          <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">Auto</span>
        </button>

        <button
          onClick={onOpenImportModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 text-purple-400" />
            Importar Link
          </span>
          <span className="text-[9px] text-slate-500 font-mono">TikTok / YT</span>
        </button>
      </div>

      {/* Playlists Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Playlists
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenMergeModal}
              title="Mesclar Playlists"
              className="p-1 rounded text-purple-400 hover:bg-purple-950 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenCreateModal}
              title="Nova Playlist"
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Playlist List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs truncate transition-all ${
                selectedPlaylistId === pl.id
                  ? 'bg-purple-950 text-purple-300 font-bold border-l-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {pl.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
