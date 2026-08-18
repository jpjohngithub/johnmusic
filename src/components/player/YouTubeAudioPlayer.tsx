import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Tv, Minimize2 } from 'lucide-react';

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
    setCurrentTime,
    setDuration
  } = usePlayer();

  const [player, setPlayer] = useState<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isMiniVideoOpen, setIsMiniVideoOpen] = useState(false);
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

  // Initialize YT Player instance
  useEffect(() => {
    if (!isApiReady || !iframeContainerRef.current) return;

    try {
      const newPlayer = new window.YT.Player('yt-player-element', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
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
      console.debug('YouTube Player init:', err);
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

    const isExplicitYt = currentTrack.genre === 'YouTube' || currentTrack.genre === 'TikTok Viral';
    if (isYouTubeMode || isExplicitYt) {
      const searchQuery = currentTrack.genre === 'YouTube' && currentTrack.audioUrl.includes('watch?v=')
        ? currentTrack.audioUrl.split('watch?v=')[1]?.substring(0, 11)
        : `${currentTrack.artist} ${currentTrack.title} official audio`;

      try {
        if (currentTrack.genre === 'YouTube' && currentTrack.audioUrl.includes('watch?v=')) {
          const vidId = currentTrack.audioUrl.split('watch?v=')[1]?.substring(0, 11);
          player.loadVideoById(vidId);
        } else {
          player.loadPlaylist({
            listType: 'search',
            list: searchQuery,
            index: 0,
            suggestedQuality: 'hd720',
          });
        }
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

  return (
    <div className={`fixed z-30 transition-all duration-300 ${
      isMiniVideoOpen
        ? 'bottom-28 right-6 w-80 h-48 rounded-2xl bg-slate-900 border border-red-500/40 shadow-2xl overflow-hidden p-2 flex flex-col'
        : 'bottom-28 right-6 w-12 h-12 opacity-0 pointer-events-none'
    }`}>
      {/* Header bar on mini video */}
      {isMiniVideoOpen && (
        <div className="flex items-center justify-between px-2 pb-1.5 text-xs text-white">
          <div className="flex items-center gap-1.5 text-red-400 font-bold truncate">
            <Tv className="w-4 h-4" />
            <span className="truncate">{currentTrack ? `${currentTrack.title}` : '100% Full Audio'}</span>
          </div>
          <button
            onClick={() => setIsMiniVideoOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden/Active Iframe Container */}
      <div 
        ref={iframeContainerRef}
        className={`w-full rounded-xl overflow-hidden ${isMiniVideoOpen ? 'flex-1' : 'w-1 h-1'}`}
      >
        <div id="yt-player-element" className="w-full h-full" />
      </div>
    </div>
  );
};
