import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Minimize2, Maximize2, X, Music } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    __johnmusic_yt_player: any;
  }
}

export const YouTubeAudioPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    isMuted, 
    nextTrack,
    isYouTubeMode,
    toggleYouTubeMode,
    setCurrentTime,
    setDuration
  } = usePlayer();

  const [player, setPlayer] = useState<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Load YouTube IFrame Player API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize YT Player instance with valid dimensions to prevent browser background throttling
  useEffect(() => {
    if (!isApiReady || !iframeContainerRef.current) return;

    try {
      const newPlayer = new window.YT.Player('yt-player-element', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          disablekb: 1,
          fs: 0,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            window.__johnmusic_yt_player = e.target;
            e.target.setVolume(volume * 100);
            if (isMuted) e.target.mute();
            if (isPlaying) e.target.playVideo();
          },
          onStateChange: (e: any) => {
            // YT.PlayerState.ENDED = 0
            if (e.data === 0) {
              nextTrack();
            }
          },
        },
      });

      setPlayer(newPlayer);
      window.__johnmusic_yt_player = newPlayer;
    } catch (err) {
      console.debug('YouTube Player init note:', err);
    }
  }, [isApiReady]);

  // Sync timeline progress bar during playback
  useEffect(() => {
    if (!player || !isYouTubeMode) return;

    const interval = setInterval(() => {
      try {
        if (player.getCurrentTime && player.getDuration) {
          const cur = player.getCurrentTime();
          const dur = player.getDuration();
          if (cur !== undefined && !isNaN(cur)) setCurrentTime(cur);
          if (dur !== undefined && !isNaN(dur) && dur > 0) setDuration(dur);
        }
      } catch {}
    }, 500);

    return () => clearInterval(interval);
  }, [player, isYouTubeMode, setCurrentTime, setDuration]);

  // Sync track when currentTrack changes
  useEffect(() => {
    if (!player || !player.loadPlaylist || !currentTrack) return;
    if (currentTrack.isLocal) return;

    const isExplicitYt = currentTrack.genre === 'YouTube' || currentTrack.genre === 'TikTok Viral' || currentTrack.audioUrl?.includes('youtube.com') || currentTrack.audioUrl?.includes('youtu.be');

    if (isYouTubeMode || isExplicitYt) {
      try {
        if (currentTrack.audioUrl && currentTrack.audioUrl.includes('watch?v=')) {
          const vidId = currentTrack.audioUrl.split('watch?v=')[1]?.substring(0, 11);
          if (vidId) {
            player.loadVideoById(vidId);
            return;
          }
        }

        const searchQuery = `${currentTrack.artist} ${currentTrack.title} official audio`;
        player.loadPlaylist({
          listType: 'search',
          list: searchQuery,
          index: 0,
          suggestedQuality: 'hd720',
        });
      } catch (err) {
        console.debug('Failed to load track on YT player:', err);
      }
    }
  }, [currentTrack, isYouTubeMode, player]);

  // Sync play / pause
  useEffect(() => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch {}
  }, [isPlaying, player]);

  // Sync volume & mute
  useEffect(() => {
    if (!player) return;
    try {
      if (isMuted) {
        player.mute();
      } else {
        player.unMute();
        player.setVolume(volume * 100);
      }
    } catch {}
  }, [volume, isMuted, player]);

  const isExplicitYt = currentTrack?.genre === 'YouTube' || currentTrack?.genre === 'TikTok Viral' || currentTrack?.audioUrl?.includes('youtube.com');
  const shouldBeVisible = isYouTubeMode || isExplicitYt;

  if (!shouldBeVisible) {
    return (
      <div className="fixed -bottom-96 -right-96 w-64 h-36 opacity-0 pointer-events-none">
        <div ref={iframeContainerRef} className="w-full h-full">
          <div id="yt-player-element" className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed z-30 transition-all duration-300 shadow-2xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden p-2 flex flex-col ${
      isMinimized
        ? 'bottom-28 right-6 w-56 h-12'
        : 'bottom-28 right-6 w-72 sm:w-80 h-48 sm:h-52'
    }`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1 pb-1.5 text-xs text-white">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold truncate">
          <Music className="w-3.5 h-3.5" />
          <span className="truncate">{currentTrack ? `${currentTrack.title}` : '100% Full Audio'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            title={isMinimized ? 'Expandir Player' : 'Minimizar Player'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={toggleYouTubeMode}
            className="p-1 rounded-lg text-slate-400 hover:text-red-400"
            title="Fechar Modo Full Audio"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Active Iframe Container */}
      <div 
        ref={iframeContainerRef}
        className={`w-full rounded-xl overflow-hidden bg-black ${isMinimized ? 'h-0 hidden' : 'flex-1'}`}
      >
        <div id="yt-player-element" className="w-full h-full" />
      </div>
    </div>
  );
};
