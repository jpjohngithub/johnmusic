import React, { useState } from 'react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from './SafeImage';
import { PlatformBadge } from './PlatformBadge';
import { Play, Pause, Download, Plus, Check } from 'lucide-react';
import { downloadTrackMp3 } from '../services/download';

interface TrackRowProps {
  track: Track;
  index?: number;
  onAddToPlaylist?: (track: Track) => void;
  playlistContextTracks?: Track[];
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  onAddToPlaylist,
  playlistContextTracks
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [downloading, setDownloading] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

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

  return (
    <div
      onClick={handlePlayToggle}
      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-purple-900/25 border-purple-500/40 shadow-lg shadow-purple-950/20'
          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.05]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {index !== undefined && (
          <span className="w-5 text-center text-xs font-medium text-slate-400 group-hover:hidden">
            {index + 1}
          </span>
        )}

        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 shadow-md">
          <SafeImage
            src={track.coverUrl}
            videoId={track.youtubeId}
            alt={track.title}
            fallbackText={track.title}
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isThisPlaying ? (
              <Pause className="w-5 h-5 text-purple-400 fill-purple-400" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <p
            className={`font-medium text-sm truncate ${
              isCurrent ? 'text-purple-400 font-bold' : 'text-slate-100'
            }`}
          >
            {track.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <PlatformBadge platform={track.platform} size="sm" />
            <p className="text-xs text-slate-400 truncate">{track.artist}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          {formatDuration(track.duration)}
        </span>

        {/* Download MP3 Button */}
        <button
          onClick={handleDownload}
          title="Baixar MP3 direto"
          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-white/10 transition-colors"
        >
          {downloading ? (
            <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Add to Playlist Button */}
        {onAddToPlaylist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(track);
            }}
            title="Adicionar à Playlist"
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
