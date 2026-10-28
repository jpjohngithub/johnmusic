import React, { useState } from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from '../components/SafeImage';
import { TrackRow } from '../components/TrackRow';
import { EditPlaylistModal } from '../components/Modals/EditPlaylistModal';
import { generatePlaylistShareUrl } from '../services/share';
import { Track } from '../types';
import { Play, Shuffle, ArrowLeft, Layers, Trash2, Edit3, Share2, Check } from 'lucide-react';

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
  const { getPlaylistById, removeTrackFromPlaylist, deletePlaylist, reorderPlaylistTracks } = usePlaylists();
  const { playTrack, toggleShuffle } = usePlayer();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  const handleDeletePlaylist = () => {
    if (confirm(`Tem certeza que deseja remover a playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      onBack();
    }
  };

  const handleSharePlaylist = async () => {
    try {
      const url = generatePlaylistShareUrl(playlist);
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      alert('Não foi possível copiar o link de compartilhamento.');
    }
  };

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

  // Drag and drop handlers
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIndex === null || draggedIndex === dropIdx) return;
    reorderPlaylistTracks(playlist.id, draggedIndex, dropIdx);
    setDraggedIndex(null);
  };

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          {/* Share Playlist Button */}
          <button
            onClick={handleSharePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#160f22] hover:bg-purple-950 text-purple-300 border border-purple-900/30 transition-colors shadow-sm"
            title="Compartilhar playlist via link"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          {/* Edit Playlist Button */}
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#160f22] hover:bg-purple-950 text-slate-300 hover:text-white border border-purple-900/30 transition-colors shadow-sm"
            title="Editar foto, nome e descrição"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            Editar
          </button>

          {/* Delete Playlist Button */}
          <button
            onClick={handleDeletePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/30 transition-colors"
            title="Remover Playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        </div>
      </div>

      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-[#0f0a17] border border-purple-900/30 shadow-2xl">
        <div className="relative group/cover w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl bg-black flex-shrink-0 border border-purple-900/40">
          <SafeImage
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => setIsEditOpen(true)}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-xs font-bold transition-opacity"
          >
            <Edit3 className="w-5 h-5 text-purple-400" />
            Alterar Capa
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
            Playlist {playlist.isCustom ? 'Personalizada' : 'Oficial JohnMusic'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-1.5 truncate">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mb-3 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <p className="text-xs text-purple-300/70 font-mono">
            {playlist.tracks.length} músicas • aprox. {totalMins} min
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
            <button
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-white" />
              Tocar Tudo
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={playlist.tracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" />
              Aleatório
            </button>

            <button
              onClick={onOpenMergeModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-purple-950/60 hover:bg-purple-950 text-purple-200 border border-purple-800/40"
              title="Mesclar com outras playlists"
            >
              <Layers className="w-3.5 h-3.5" />
              Mesclar
            </button>
          </div>
        </div>
      </div>

      {/* Tracks List with Drag & Drop Ordering */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-mono">
          <span>{playlist.tracks.length} FAIXAS</span>
          <span>DICA: ARRASTE O ÍCONE (⋮⋮) PARA REORDENAR</span>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-white/5 rounded-2xl bg-[#0f0a17]/30">
            <p className="text-sm font-semibold">Esta playlist está vazia</p>
            <p className="text-xs mt-1">Busque músicas e adicione-as clicando no botão (+).</p>
          </div>
        ) : (
          playlist.tracks.map((track, idx) => (
            <TrackRow
              key={`${track.id}-${idx}`}
              track={track}
              index={idx}
              onAddToPlaylist={onAddToPlaylist}
              onRemove={() => removeTrackFromPlaylist(playlist.id, track.id)}
              playlistContextTracks={playlist.tracks}
              isDraggable={true}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      <EditPlaylistModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        playlist={playlist}
      />
    </div>
  );
};
