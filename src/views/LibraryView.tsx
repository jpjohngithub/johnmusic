import React from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from '../components/SafeImage';
import { Plus, Layers, Play, Library, Trash2 } from 'lucide-react';

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
  const { playlists, deletePlaylist } = usePlaylists();
  const { playTrack } = usePlayer();

  const handlePlayPlaylist = (e: React.MouseEvent, tracks: any[]) => {
    e.stopPropagation();
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Library className="w-7 h-7 text-purple-400" />
            Sua Biblioteca
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie e una playlists do Spotify, YouTube e TikTok em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMergeModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 active:scale-95 transition-all"
          >
            <Layers className="w-4 h-4" />
            Mesclar Playlists
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Playlist
          </button>
        </div>
      </div>

      {/* Grid of Playlists */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => onSelectPlaylist(pl.id)}
            className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer backdrop-blur-md flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
                <SafeImage
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Quick play overlay */}
                {pl.tracks.length > 0 && (
                  <button
                    onClick={(e) => handlePlayPlaylist(e, pl.tracks)}
                    className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </button>
                )}
              </div>

              <h4 className="font-bold text-sm text-white truncate">{pl.name}</h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">{pl.tracks.length} músicas</p>
            </div>

            {pl.isCustom && (
              <div className="pt-2 mt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Excluir playlist "${pl.name}"?`)) {
                      deletePlaylist(pl.id);
                    }
                  }}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                  title="Excluir playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
