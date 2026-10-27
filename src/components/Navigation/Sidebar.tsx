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
  Headphones
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, filter?: Platform | 'all') => void;
  onOpenMergeModal: () => void;
  onOpenCreateModal: () => void;
  onSelectPlaylist: (id: string) => void;
  selectedPlaylistId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenMergeModal,
  onOpenCreateModal,
  onSelectPlaylist,
  selectedPlaylistId
}) => {
  const { playlists } = usePlaylists();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[#0e0f17]/90 border-r border-white/10 p-4 sticky top-0 flex-shrink-0 backdrop-blur-2xl">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Headphones className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
            JohnMusic
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
            Unified 3.0
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        <button
          onClick={() => onNavigate('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentView === 'home' && !selectedPlaylistId
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          Início
        </button>

        <button
          onClick={() => onNavigate('search', 'all')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentView === 'search'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          Buscar Tudo
        </button>

        <button
          onClick={() => onNavigate('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentView === 'library'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className="w-4 h-4" />
          Sua Biblioteca
        </button>
      </nav>

      {/* Platforms Filter Shortlinks */}
      <div className="mb-6">
        <div className="px-3 mb-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Canais Integrados
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('search', 'spotify')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <SpotifyIcon className="w-4 h-4 text-emerald-400" />
              Spotify Music
            </span>
            <span className="text-[10px] text-emerald-500/70 font-mono">Sem Login</span>
          </button>

          <button
            onClick={() => onNavigate('search', 'youtube')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-red-950/30 hover:text-red-400 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <YouTubeIcon className="w-4 h-4 text-red-400" />
              YouTube Music
            </span>
            <span className="text-[10px] text-red-500/70 font-mono">Background</span>
          </button>

          <button
            onClick={() => onNavigate('search', 'tiktok')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-cyan-950/30 hover:text-cyan-400 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <TikTokIcon className="w-4 h-4 text-cyan-400" />
              TikTok Trends
            </span>
            <span className="text-[10px] text-cyan-500/70 font-mono">Áudio Direto</span>
          </button>
        </div>
      </div>

      {/* Playlists Section & Merge Tool */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Playlists
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenMergeModal}
              title="Mesclar Playlists (Merge)"
              className="p-1 rounded text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenCreateModal}
              title="Criar Playlist"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Merge Button Quick Banner */}
        <button
          onClick={onOpenMergeModal}
          className="mx-2 mb-3 p-2.5 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-900/40 border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-200 hover:border-purple-400 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse" />
          <div className="text-left leading-tight">
            <p className="font-bold">Mesclar Playlists</p>
            <p className="text-[10px] text-purple-400/80">Junte Spotify + YT + TikTok</p>
          </div>
        </button>

        {/* Scrollable Playlist List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs truncate transition-all ${
                selectedPlaylistId === pl.id
                  ? 'bg-white/10 text-purple-300 font-bold border-l-2 border-purple-500'
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
