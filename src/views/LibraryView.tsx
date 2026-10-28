import React, { useState } from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from '../components/SafeImage';
import { TrackRow } from '../components/TrackRow';
import { Track } from '../types';
import { Plus, Layers, Play, Library, Trash2, Heart, RotateCcw, Music } from 'lucide-react';

interface LibraryViewProps {
  onOpenCreateModal: () => void;
  onOpenMergeModal: () => void;
  onSelectPlaylist: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenCreateModal,
  onOpenMergeModal,
  onSelectPlaylist
}) => {
  const { playlists, savedTracks, deletePlaylist, restoreLegacyPlaylists } = usePlaylists();
  const { playTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<'playlists' | 'saved'>('playlists');
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  const handlePlayPlaylist = (e: React.MouseEvent, tracks: any[]) => {
    e.stopPropagation();
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleRestore = () => {
    const count = restoreLegacyPlaylists();
    if (count > 0) {
      setRestoreMsg(`${count} playlist(s) anteriores restauradas com sucesso!`);
    } else {
      setRestoreMsg('Todas as playlists anteriores do histórico já foram sincronizadas.');
    }
    setTimeout(() => setRestoreMsg(null), 4000);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja remover a playlist "${name}"?`)) {
      deletePlaylist(id);
    }
  };

  const handlePlayAllSaved = () => {
    if (savedTracks.length > 0) {
      playTrack(savedTracks[0], savedTracks);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Library className="w-6 h-6 text-purple-400" />
            Sua Biblioteca
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie suas playlists e músicas salvas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRestore}
            title="Recuperar playlists das versões anteriores salvas neste navegador"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#160f22] hover:bg-purple-950 text-purple-300 border border-purple-900/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Histórico
          </button>

          <button
            onClick={onOpenMergeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800/40 transition-all shadow-md"
          >
            <Layers className="w-3.5 h-3.5" />
            Mesclar
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Playlist
          </button>
        </div>
      </div>

      {restoreMsg && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs">
          {restoreMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-purple-900/20 pb-2">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white bg-white/[0.02]'
          }`}
        >
          <Library className="w-3.5 h-3.5" />
          Playlists ({playlists.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white bg-white/[0.02]'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          Músicas Adicionadas ({savedTracks.length})
        </button>
      </div>

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group relative p-3 rounded-2xl bg-[#0f0a17]/50 hover:bg-[#160f22] border border-purple-900/20 hover:border-purple-600/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-black shadow-md">
                  <SafeImage
                    src={pl.coverUrl}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Play overlay */}
                  {pl.tracks.length > 0 && (
                    <button
                      onClick={(e) => handlePlayPlaylist(e, pl.tracks)}
                      className="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  )}
                </div>

                <h4 className="font-bold text-xs text-white truncate">{pl.name}</h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{pl.tracks.length} músicas</p>
              </div>

              {/* Delete Playlist Button (Available for all playlists) */}
              <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-purple-400/70 font-mono">
                  {pl.isCustom ? 'Personalizada' : 'Oficial'}
                </span>
                <button
                  onClick={(e) => handleDelete(e, pl.id, pl.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Remover Playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Tracks Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-[#0e0a14] border border-purple-900/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Músicas Adicionadas à Biblioteca</h3>
                <p className="text-xs text-slate-400">{savedTracks.length} faixas salvas</p>
              </div>
            </div>

            {savedTracks.length > 0 && (
              <button
                onClick={handlePlayAllSaved}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
              >
                <Play className="w-4 h-4 fill-white" />
                Tocar Todas
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {savedTracks.length === 0 ? (
              <div className="text-center py-16 bg-[#0f0a17]/30 border border-white/5 rounded-2xl text-slate-500">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhuma música adicionada ainda</p>
                <p className="text-xs mt-1">Clique no ícone de coração ou (+) para salvar faixas aqui.</p>
              </div>
            ) : (
              savedTracks.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  playlistContextTracks={savedTracks}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
