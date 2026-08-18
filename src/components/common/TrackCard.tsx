import React from 'react';
import type { Track } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { Play, Pause, Heart } from 'lucide-react';

interface TrackCardProps {
  track: Track;
  allTracks?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, allTracks }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleFavorite, favorites } = usePlayer();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isLiked = favorites.some(f => f.id === track.id);

  const handleClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
        isCurrent 
          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
          : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 hover:-translate-y-1'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-800 shadow-md">
        <img 
          src={track.coverUrl} 
          alt={track.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Play Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all duration-300 ${
            isCurrentlyPlaying 
              ? 'opacity-100 scale-100 bg-emerald-400' 
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105 hover:bg-emerald-400'
          }`}
          title={isCurrentlyPlaying ? 'Pausar' : 'Tocar'}
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </button>

        {/* Floating Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full bg-slate-950/60 backdrop-blur-md transition-all ${
            isLiked 
              ? 'opacity-100 text-pink-500' 
              : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-white hover:scale-110'
          }`}
          title={isLiked ? 'Remover dos favoritos' : 'Favoritar'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Genre Pill */}
        {track.genre && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-950/70 backdrop-blur-md text-emerald-300 border border-emerald-500/20">
            {track.genre}
          </span>
        )}
      </div>

      {/* Info */}
      <h3 className={`font-semibold text-sm truncate ${isCurrent ? 'text-emerald-400' : 'text-slate-100 group-hover:text-white'}`}>
        {track.title}
      </h3>
      <p className="text-xs text-slate-400 truncate mt-0.5">
        {track.artist}
      </p>
    </div>
  );
};
