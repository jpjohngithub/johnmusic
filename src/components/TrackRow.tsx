import React, { useState } from 'react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { SafeImage } from './SafeImage';
import { PlatformBadge } from './PlatformBadge';
import { Play, Pause, Download, Plus, Check, Heart, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { downloadTrackMp3 } from '../services/download';

interface TrackRowProps {
  track: Track;
  index?: number;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: () => void;
  playlistContextTracks?: Track[];
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  onAddToPlaylist,
  onRemove,
  playlistContextTracks,
  isDraggable,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { toggleSaveTrack, isSavedTrack } = usePlaylists();
  const [downloading, setDownloading] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isSaved = isSavedTrack(track.id);

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContextTracks);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    await downloadTrackMp3(track);
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '3:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSourceUrl = (): string => {
    if (track.youtubeId) return `https://www.youtube.com/watch?v=${track.youtubeId}`;
    if (track.tiktokOriginalUrl) return track.tiktokOriginalUrl;
    if (track.platform === 'tiktok') return `https://www.tiktok.com/search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`;
    if (track.platform === 'spotify') return `https://open.spotify.com/search/${encodeURIComponent(`${track.artist} ${track.title}`)}`;
    if (track.streamUrl) return track.streamUrl;
    return `https://www.google.com/search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`;
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handlePlayToggle}
      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-purple-950/50 border-purple-600/50 shadow-md shadow-purple-950/40'
          : 'bg-[#0f0a17]/50 hover:bg-[#160f22] border-purple-900/20 hover:border-purple-800/40'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Drag handle or index number */}
        {isDraggable ? (
          <div className="text-slate-600 group-hover:text-purple-400 cursor-grab active:cursor-grabbing p-0.5">
            <GripVertical className="w-4 h-4" />
          </div>
        ) : index !== undefined ? (
          <span className="w-5 text-center text-xs font-medium text-slate-500 group-hover:hidden">
            {index + 1}
          </span>
        ) : null}

        <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black shadow-md">
          <SafeImage
            src={track.coverUrl}
            videoId={track.youtubeId}
            alt={track.title}
            fallbackText={track.title}
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isThisPlaying ? (
              <Pause className="w-4 h-4 text-purple-400 fill-purple-400" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <p
            className={`font-semibold text-xs sm:text-sm truncate ${
              isCurrent ? 'text-purple-300 font-bold' : 'text-slate-100'
            }`}
          >
            {track.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <PlatformBadge platform={track.platform} size="sm" />
            <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons in single flex container with safe gaps (NO overlap) */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <span className="text-xs text-slate-500 hidden sm:inline-block pr-1">
          {formatDuration(track.duration)}
        </span>

        {/* Favorite / Save Track to Library */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveTrack(track);
          }}
          title={isSaved ? 'Remover das músicas salvas' : 'Salvar na Biblioteca'}
          className={`p-1.5 rounded-lg transition-colors ${
            isSaved ? 'text-purple-400 hover:text-purple-300' : 'text-slate-500 hover:text-purple-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Download MP3 Button */}
        <button
          onClick={handleDownload}
          title="Baixar MP3"
          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
        >
          {downloading ? (
            <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Link to Original Music */}
        <a
          href={getSourceUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Abrir música original"
          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Add to Playlist Button */}
        {onAddToPlaylist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(track);
            }}
            title="Adicionar à Playlist"
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Remove from Playlist Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remover desta Playlist"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
