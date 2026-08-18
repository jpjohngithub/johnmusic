import React, { useState } from 'react';
import type { Track } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { Play, Heart, MoreVertical, Plus, Music, Disc } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  index: number;
  allTracks?: Track[];
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, index, allTracks }) => {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlay, 
    toggleFavorite, 
    favorites, 
    addToQueue, 
    playlists, 
    addTrackToPlaylist 
  } = usePlayer();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistsSubmenu, setShowPlaylistsSubmenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isLiked = favorites.some(f => f.id === track.id);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  return (
    <div 
      className={`group relative flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isCurrent 
          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
          : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
      }`}
    >
      {/* Index / Play icon */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-8 flex items-center justify-center font-mono text-xs text-slate-500 group-hover:text-emerald-400">
          {isCurrentlyPlaying ? (
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 bg-emerald-400 rounded-full animate-[equalizer_0.6s_ease-in-out_infinite_alternate]" style={{ height: '70%' }}></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_alternate_0.2s]" style={{ height: '100%' }}></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-[equalizer_0.5s_ease-in-out_infinite_alternate_0.4s]" style={{ height: '40%' }}></span>
            </div>
          ) : (
            <>
              <span className="group-hover:hidden">{index + 1}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRowClick(); }}
                className="hidden group-hover:flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
        </div>

        {/* Cover Art */}
        <div 
          onClick={handleRowClick}
          className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-md bg-slate-800 border border-slate-700/50"
        >
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <Disc className="w-5 h-5" />
            </div>
          )}
          {isCurrent && (
            <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></div>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1 pr-2 cursor-pointer" onClick={handleRowClick}>
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-100 group-hover:text-white'}`}>
              {track.title}
            </h4>
            {track.source === 'local' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Local
              </span>
            )}
            {track.source === 'spotify' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-green-500/20 text-green-300 border border-green-500/30">
                Spotify
              </span>
            )}
            {track.source === 'online' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Cloud
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate hover:underline">
            {track.artist} {track.album ? `• ${track.album}` : ''}
          </p>
        </div>
      </div>

      {/* Genre / Tag */}
      <div className="hidden md:block w-36 text-xs text-slate-400 truncate">
        {track.genre || 'Desconhecido'}
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isLiked 
              ? 'text-pink-500 hover:text-pink-400' 
              : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
          title={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        <span className="text-xs font-mono text-slate-400 w-10 text-right">
          {formatDuration(track.duration)}
        </span>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-slate-700/50 transition-all"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute right-0 top-8 z-40 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 rounded-xl shadow-2xl py-1 text-xs text-slate-200 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(track);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center gap-2.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Adicionar à Fila
                </button>

                <div 
                  className="relative"
                  onMouseEnter={() => setShowPlaylistsSubmenu(true)}
                  onMouseLeave={() => setShowPlaylistsSubmenu(false)}
                >
                  <div className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer">
                    <span className="flex items-center gap-2.5">
                      <Music className="w-4 h-4 text-cyan-400" />
                      Adicionar à Playlist
                    </span>
                    <span className="text-slate-400">›</span>
                  </div>

                  {showPlaylistsSubmenu && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                      {playlists.filter(p => !p.isSystem).length === 0 ? (
                        <div className="px-3 py-2 text-slate-500 text-[11px]">Nenhuma playlist customizada</div>
                      ) : (
                        playlists.filter(p => !p.isSystem).map(pl => (
                          <button
                            key={pl.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              addTrackToPlaylist(pl.id, track);
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-500/20 hover:text-emerald-300 truncate transition-colors"
                          >
                            {pl.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-slate-800 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-slate-400'}`} />
                  {isLiked ? 'Remover dos Favoritos' : 'Favoritar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
