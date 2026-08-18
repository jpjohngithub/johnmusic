import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { TrackRow } from '../common/TrackRow';
import { Play, Shuffle, Trash2, Music, Clock, Calendar } from 'lucide-react';

export const PlaylistView: React.FC = () => {
  const { 
    playlists, 
    selectedPlaylistId, 
    playTrack, 
    deletePlaylist, 
    localTracks, 
    favorites,
    setCurrentView 
  } = usePlayer();

  const playlist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];

  if (!playlist) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Playlist não encontrada.</p>
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  // Combine all track sources to find playlist tracks
  const trackPool = [...DEFAULT_TRACKS, ...localTracks, ...favorites];
  const playlistTracks = playlist.trackIds
    .map(id => trackPool.find(t => t.id === id))
    .filter(Boolean) as typeof DEFAULT_TRACKS;

  const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  const handleShuffleAll = () => {
    if (playlistTracks.length > 0) {
      const rand = Math.floor(Math.random() * playlistTracks.length);
      playTrack(playlistTracks[rand], playlistTracks);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Playlist Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/80 shadow-2xl">
        <img 
          src={playlist.coverUrl} 
          alt={playlist.title} 
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl flex-shrink-0 border border-slate-700"
        />

        <div className="space-y-3 min-w-0 flex-1 text-center md:text-left">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Playlist johnmusic
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
            {playlist.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            {playlist.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 font-medium pt-1">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Music className="w-4 h-4 text-emerald-400" />
              {playlistTracks.length} faixas
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Aprox. {totalMinutes} minutos
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              {new Date(playlist.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            disabled={playlistTracks.length === 0}
            onClick={handlePlayAll}
            className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Tocar Playlist
          </button>

          <button
            disabled={playlistTracks.length === 0}
            onClick={handleShuffleAll}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition-colors"
            title="Tocar em ordem aleatória"
          >
            <Shuffle className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        {!playlist.isSystem && (
          <button
            onClick={() => {
              if (confirm(`Excluir a playlist "${playlist.title}"?`)) {
                deletePlaylist(playlist.id);
              }
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Excluir playlist"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Playlist
          </button>
        )}
      </div>

      {/* Track List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        {playlistTracks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-slate-300">Esta playlist está vazia.</p>
            <p className="text-xs text-slate-500 mt-1">
              Vá para "Início" ou "Explorar" e clique nos 3 pontinhos para adicionar músicas aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlistTracks.map((track, idx) => (
              <TrackRow 
                key={`${playlist.id}-${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                allTracks={playlistTracks} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
