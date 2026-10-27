import React, { useState } from 'react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { SafeImage } from './SafeImage';
import { PlatformBadge } from './PlatformBadge';
import { Play, Pause, Download, Plus, Check } from 'lucide-react';
import { downloadTrackMp3 } from '../services/download';

interface TrackCardProps {
  track: Track;
  onAddToPlaylist?: (track: Track) => void;
  playlistContextTracks?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onAddToPlaylist,
  playlistContextTracks
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [downloading, setDownloading] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div
      onClick={handlePlayToggle}
      className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-md ${
        isCurrent
          ? 'bg-purple-950/40 border-purple-500/50 shadow-xl shadow-purple-950/30 -translate-y-1'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.15] hover:-translate-y-1'
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
        <SafeImage
          src={track.coverUrl}
          videoId={track.youtubeId}
          alt={track.title}
          fallbackText={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 z-10">
          <PlatformBadge platform={track.platform} size="sm" />
        </div>

        {/* Hover action overlay with play button */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handlePlayToggle}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 active:scale-95"
          >
            {isThisPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4
            className={`font-semibold text-sm truncate ${
              isCurrent ? 'text-purple-400 font-bold' : 'text-slate-100'
            }`}
          >
            {track.title}
          </h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            title="Download MP3"
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-white/10"
          >
            {downloading ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
          {onAddToPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlaylist(track);
              }}
              title="Adicionar à playlist"
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-white/10"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
