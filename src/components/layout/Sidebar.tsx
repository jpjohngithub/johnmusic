import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import type { ViewType } from '../../types/music';
import { 
  Home, 
  Compass, 
  FileAudio, 
  Heart, 
  History, 
  Plus, 
  Music, 
  Radio, 
  Sparkles, 
  Trash2,
  Headphones,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { CreatePlaylistModal } from '../common/CreatePlaylistModal';

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    playlists, 
    selectedPlaylistId, 
    deletePlaylist,
    isPlaying,
    userSpotifyPlaylists,
    openSpotifyItem,
    isSpotifySDKReady,
  } = usePlayer();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSpotifyPlaylistsExpanded, setIsSpotifyPlaylistsExpanded] = useState(true);

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'explore', label: 'Explorar & Buscar', icon: <Compass className="w-5 h-5" /> },
    { id: 'local-files', label: 'Arquivos do PC', icon: <FileAudio className="w-5 h-5" />, badge: 'Local' },
    { id: 'spotify', label: 'Spotify Connect', icon: <Radio className="w-5 h-5" />, badge: isSpotifySDKReady ? 'Premium' : 'API' },
    { id: 'favorites', label: 'Músicas Curtidas', icon: <Heart className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-5 h-5" /> },
  ];

  return (
    <>
      <aside className="w-64 h-full bg-slate-950/80 border-r border-slate-800/80 flex flex-col select-none flex-shrink-0 z-30">
        {/* Brand Logo */}
        <div className="p-6 flex items-center justify-between">
          <div 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Headphones className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                johnmusic
              </h1>
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest block -mt-1">
                Audio Pro v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Principal
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id && !selectedPlaylistId;
            const isSpotify = item.id === 'spotify';
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id, null)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-emerald-400' : isSpotify ? 'text-green-500' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    isSpotify && isSpotifySDKReady
                      ? 'bg-green-500/20 text-green-300 border-green-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-[1px] bg-slate-800/80 mx-4 my-3" />

        {/* Scrollable library area */}
        <div className="flex-1 flex flex-col min-h-0 px-3 overflow-y-auto">

          {/* ── Spotify Playlists (user's own) ─────────────────────────── */}
          {userSpotifyPlaylists.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setIsSpotifyPlaylistsExpanded(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-green-500" />
                  Minhas Playlists Spotify
                  <span className="text-[9px] font-semibold text-green-500 ml-1">
                    {userSpotifyPlaylists.length}
                  </span>
                </span>
                {isSpotifyPlaylistsExpanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
              </button>

              {isSpotifyPlaylistsExpanded && (
                <div className="space-y-0.5">
                  {userSpotifyPlaylists.map((pl) => {
                    const isSelected = currentView === 'spotify-playlist';
                    return (
                      <button
                        key={pl.id}
                        onClick={() => openSpotifyItem(pl, 'playlist')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'text-green-400 hover:bg-slate-900/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                        }`}
                        title={pl.name}
                      >
                        {pl.coverUrl ? (
                          <img
                            src={pl.coverUrl}
                            alt={pl.name}
                            className="w-7 h-7 rounded-md object-cover flex-shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Music className="w-3.5 h-3.5 text-green-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate">{pl.name}</div>
                          <div className="text-[10px] text-slate-600 truncate">
                            {pl.totalTracks} músicas
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Local Playlists ────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sua Biblioteca
            </span>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Criar Nova Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 pb-3">
            {playlists.map((playlist) => {
              const isSelected = currentView === 'playlist' && selectedPlaylistId === playlist.id;
              return (
                <div
                  key={playlist.id}
                  onClick={() => setCurrentView('playlist', playlist.id)}
                  className={`group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Music className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{playlist.title}</span>
                  </div>

                  {!playlist.isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir a playlist "${playlist.title}"?`)) deletePlaylist(playlist.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Engine Badge */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Web Audio DSP</div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isPlaying ? '● 32-bit Float Live' : '○ Standby'}
              </div>
            </div>
          </div>
          {isSpotifySDKReady && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-mono font-semibold">Spotify SDK Ativo</span>
            </div>
          )}
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
