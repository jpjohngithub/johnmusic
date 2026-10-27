import React from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from '../components/SafeImage';
import { TrackRow } from '../components/TrackRow';
import { Track } from '../types';
import { Play, Shuffle, ArrowLeft, Layers, Trash2 } from 'lucide-react';

interface PlaylistDetailViewProps {
  playlistId: string;
  onBack: () => void;
  onOpenMergeModal: () => void;
  onAddToPlaylist: (track: Track) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlistId,
  onBack,
  onOpenMergeModal,
  onAddToPlaylist
}) => {
  const { getPlaylistById, removeTrackFromPlaylist } = usePlaylists();
  const { playTrack, toggleShuffle } = usePlayer();

  const playlist = getPlaylistById(playlistId);

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Playlist não encontrada.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-purple-600 rounded-xl text-white text-xs font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length > 0) {
      toggleShuffle();
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-b from-purple-900/30 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-xl">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex-shrink-0 border border-white/10">
          <SafeImage
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
            Playlist {playlist.isCustom ? 'Personalizada' : 'Oficial JohnMusic'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-3">
              {playlist.description}
            </p>
          )}
          <p className="text-xs text-slate-400 font-mono">
            {playlist.tracks.length} músicas • aprox. {totalMins} min
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
            <button
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-white" />
              Tocar Tudo
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={playlist.tracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" />
              Ordem Aleatória
            </button>

            <button
              onClick={onOpenMergeModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30"
              title="Mesclar com outras playlists"
            >
              <Layers className="w-4 h-4" />
              Mesclar
            </button>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-2">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-white/5 rounded-2xl">
            <p className="text-sm font-semibold">Esta playlist está vazia</p>
            <p className="text-xs mt-1">Busque músicas e adicione-as clicando no botão (+).</p>
          </div>
        ) : (
          playlist.tracks.map((track, idx) => (
            <div key={`${track.id}-${idx}`} className="relative group">
              <TrackRow
                track={track}
                index={idx}
                onAddToPlaylist={onAddToPlaylist}
                playlistContextTracks={playlist.tracks}
              />
              {playlist.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrackFromPlaylist(playlist.id, track.id);
                  }}
                  title="Remover da playlist"
                  className="absolute right-20 sm:right-24 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
