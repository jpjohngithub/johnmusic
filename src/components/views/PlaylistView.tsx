import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { TrackRow } from '../common/TrackRow';
import { 
  Play, 
  Shuffle, 
  Trash2, 
  Music, 
  Clock, 
  Calendar, 
  Edit3, 
  Search, 
  Download, 
  X,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { EditPlaylistModal } from '../common/EditPlaylistModal';
import { AddByUrlModal } from '../common/AddByUrlModal';

export const PlaylistView: React.FC = () => {
  const { 
    playlists, 
    selectedPlaylistId, 
    playTrack, 
    deletePlaylist, 
    updatePlaylist,
    localTracks, 
    favorites,
    history,
    setCurrentView 
  } = usePlayer();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddByUrlOpen, setIsAddByUrlOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

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

  // Combine all known track sources to populate playlist tracks
  const trackPool = [...DEFAULT_TRACKS, ...localTracks, ...favorites, ...history];
  const uniquePool = Array.from(new Map(trackPool.map(t => [t.id, t])).values());

  const playlistTracks = playlist.trackIds
    .map(id => uniquePool.find(t => t.id === id))
    .filter(Boolean) as typeof DEFAULT_TRACKS;

  const filteredTracks = playlistTracks.filter(t => 
    !filterQuery.trim() ||
    t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      playTrack(filteredTracks[0], filteredTracks);
    }
  };

  const handleShuffleAll = () => {
    if (filteredTracks.length > 0) {
      const rand = Math.floor(Math.random() * filteredTracks.length);
      playTrack(filteredTracks[rand], filteredTracks);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(playlist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${playlist.title.replace(/\s+/g, '_')}_playlist.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Playlist Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/80 shadow-2xl">
        <div className="relative group w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-slate-700">
          <img 
            src={playlist.coverUrl} 
            alt={playlist.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {!playlist.isSystem && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity"
            >
              <Edit3 className="w-6 h-6 text-emerald-400" />
              Editar Capa & Nome
            </button>
          )}
        </div>

        <div className="space-y-3 min-w-0 flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Playlist johnmusic
            </span>
            {!playlist.isSystem && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Editar playlist"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
            {playlist.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            {playlist.description || 'Sem descrição.'}
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

      {/* Action Toolbar & Search inside Playlist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={playlistTracks.length === 0}
            onClick={handlePlayAll}
            className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Tocar Playlist
          </button>

          <button
            onClick={() => setIsAddByUrlOpen(true)}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all shadow-md"
            title="Adicionar por Link do YouTube, TikTok ou Spotify"
          >
            <LinkIcon className="w-4 h-4 text-red-400" />
            <span>Colar Link (YouTube / TikTok)</span>
          </button>

          <button
            disabled={playlistTracks.length === 0}
            onClick={handleShuffleAll}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition-colors"
            title="Tocar em ordem aleatória"
          >
            <Shuffle className="w-5 h-5 text-emerald-400" />
          </button>

          <button
            onClick={handleExportJson}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Exportar Playlist (JSON)"
          >
            <Download className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Filter input */}
        <div className="flex items-center gap-3">
          {playlistTracks.length > 0 && (
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar nesta playlist..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {!playlist.isSystem && (
            <button
              onClick={() => {
                if (confirm(`Excluir permanentemente a playlist "${playlist.title}"?`)) {
                  deletePlaylist(playlist.id);
                }
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Excluir playlist"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      </div>

      {/* Track List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        {playlistTracks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-slate-300">Esta playlist está vazia.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Cole qualquer link do YouTube ou TikTok acima para adicionar instantaneamente!
            </p>
            <button
              onClick={() => setIsAddByUrlOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar Música por Link
            </button>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma música corresponde ao filtro "{filterQuery}".
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTracks.map((track, idx) => (
              <TrackRow 
                key={`${playlist.id}-${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                allTracks={filteredTracks} 
              />
            ))}
          </div>
        )}
      </div>

      <EditPlaylistModal
        isOpen={isEditModalOpen}
        playlist={playlist}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updatePlaylist}
      />

      <AddByUrlModal
        isOpen={isAddByUrlOpen}
        onClose={() => setIsAddByUrlOpen(false)}
        targetPlaylistId={playlist.id}
      />
    </div>
  );
};
