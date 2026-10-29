import React, { useState, useEffect } from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from '../components/SafeImage';
import { TrackRow } from '../components/TrackRow';
import { EditPlaylistModal } from '../components/Modals/EditPlaylistModal';
import { generatePlaylistShareUrl } from '../services/share';
import { getRecommendedTracksForPlaylist } from '../services/api';
import { Track } from '../types';
import { Play, Pause, Shuffle, ArrowLeft, Layers, Trash2, Edit3, Share2, Check, Sparkles, RotateCcw, Plus, ExternalLink, Loader2 } from 'lucide-react';

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
  const { getPlaylistById, removeTrackFromPlaylist, deletePlaylist, reorderPlaylistTracks, addTrackToPlaylist } = usePlaylists();
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleShuffle } = usePlayer();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Recommendations state
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [seedOffset, setSeedOffset] = useState<number>(0);
  const [addedRecIds, setAddedRecIds] = useState<Set<string>>(new Set());

  const playlist = getPlaylistById(playlistId);

  const fetchRecommendations = async (tracks: Track[], offset: number) => {
    setLoadingRecs(true);
    try {
      const recs = await getRecommendedTracksForPlaylist(tracks, offset);
      setRecommendedTracks(recs);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    setAddedRecIds(new Set());
    if (playlist) {
      fetchRecommendations(playlist.tracks, 0);
    }
  }, [playlist?.id]);

  const handleRefreshRecommendations = () => {
    if (!playlist) return;
    const nextOffset = seedOffset + 1;
    setSeedOffset(nextOffset);
    fetchRecommendations(playlist.tracks, nextOffset);
  };

  const handleAddRecommended = (track: Track) => {
    if (!playlist) return;
    addTrackToPlaylist(playlist.id, track);
    setAddedRecIds(prev => new Set(prev).add(track.id));
  };

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
    let ok = true;
    try {
      ok = window.confirm(`Tem certeza que deseja remover a playlist "${playlist.name}"?`);
    } catch {
      ok = true;
    }
    if (ok) {
      deletePlaylist(playlist.id);
      onBack();
    }
  };

  const handleSharePlaylist = async () => {
    setIsSharing(true);
    try {
      const url = await generatePlaylistShareUrl(playlist);
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      alert('Não foi possível copiar o link de compartilhamento.');
    } finally {
      setIsSharing(false);
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
            disabled={isSharing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#160f22] hover:bg-purple-950 text-purple-300 border border-purple-900/30 transition-colors shadow-sm disabled:opacity-50"
            title="Compartilhar playlist via link curto"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Link Copiado!</span>
              </>
            ) : isSharing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Encurtando...</span>
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

      {/* Músicas Recomendadas (Spotify-Style Recommendations) */}
      <div className="pt-8 pb-4 border-t border-purple-900/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Músicas Recomendadas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Com base no estilo e nas músicas desta playlist
            </p>
          </div>

          <button
            onClick={handleRefreshRecommendations}
            disabled={loadingRecs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/40 text-purple-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingRecs ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {loadingRecs ? (
          <div className="flex items-center justify-center py-10 text-purple-400 text-xs gap-2">
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>Buscando recomendações...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendedTracks.map((rec) => {
              const isAdded = addedRecIds.has(rec.id) || playlist.tracks.some(t => 
                t.id === rec.id || 
                (t.youtubeId && rec.youtubeId && t.youtubeId === rec.youtubeId) ||
                (t.title.toLowerCase().trim() === rec.title.toLowerCase().trim() && t.artist.toLowerCase().trim() === rec.artist.toLowerCase().trim())
              );
              const isCurrent = currentTrack?.id === rec.id;
              const isPlayingThis = isCurrent && isPlaying;

              const getRecSourceUrl = () => {
                if (rec.youtubeId) return `https://www.youtube.com/watch?v=${rec.youtubeId}`;
                if (rec.tiktokOriginalUrl) return rec.tiktokOriginalUrl;
                if (rec.platform === 'tiktok') return `https://www.tiktok.com/search?q=${encodeURIComponent(`${rec.artist} ${rec.title}`)}`;
                if (rec.platform === 'spotify') return `https://open.spotify.com/search/${encodeURIComponent(`${rec.artist} ${rec.title}`)}`;
                if (rec.streamUrl) return rec.streamUrl;
                return `https://www.google.com/search?q=${encodeURIComponent(`${rec.artist} ${rec.title}`)}`;
              };

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0f0a17]/50 hover:bg-[#160f22] border border-purple-900/20 transition-all"
                >
                  <div
                    onClick={() => {
                      if (isCurrent) togglePlay();
                      else playTrack(rec, [rec, ...playlist.tracks]);
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black shadow-md">
                      <SafeImage
                        src={rec.coverUrl}
                        videoId={rec.youtubeId}
                        alt={rec.title}
                        fallbackText={rec.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        {isPlayingThis ? (
                          <Pause className="w-4 h-4 text-purple-400 fill-purple-400" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <p className={`font-semibold text-xs sm:text-sm truncate ${isCurrent ? 'text-purple-300 font-bold' : 'text-slate-100'}`}>
                        {rec.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{rec.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={getRecSourceUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir música original"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {isAdded ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        Adicionada
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddRecommended(rec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-colors active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
