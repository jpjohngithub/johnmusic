import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '../types';
import { resolveFullTrackAudio } from '../services/api';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  crossfadeDuration: number;
  queue: Track[];
  queueIndex: number;
  activeDeck: 'A' | 'B';
  isCrossfading: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  setCrossfadeDuration: (dur: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(5); // default 5 seconds
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Deck references
  const audioDeckA = useRef<HTMLAudioElement | null>(null);
  const audioDeckB = useRef<HTMLAudioElement | null>(null);
  const ytDeckA = useRef<any>(null);
  const ytDeckB = useRef<any>(null);
  const ytReady = useRef<boolean>(false);

  // State refs to avoid stale closures in listeners/crossfade loops
  const activeDeckRef = useRef<'A' | 'B'>('A');
  const volumeRef = useRef<number>(0.85);
  const crossfadeDurationRef = useRef<number>(5);
  const isCrossfadingRef = useRef<boolean>(false);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(false);
  const isRepeatRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<number | null>(null);

  activeDeckRef.current = activeDeck;
  volumeRef.current = volume;
  crossfadeDurationRef.current = crossfadeDuration;
  isCrossfadingRef.current = isCrossfading;
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  isPlayingRef.current = isPlaying;
  isRepeatRef.current = isRepeat;

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        ytReady.current = true;
        initYtPlayers();
      };
    } else if (window.YT && window.YT.Player) {
      ytReady.current = true;
      initYtPlayers();
    }
  }, []);

  const initYtPlayers = () => {
    try {
      if (!ytDeckA.current && document.getElementById('yt-player-a')) {
        ytDeckA.current = new window.YT.Player('yt-player-a', {
          height: '1',
          width: '1',
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0 },
          events: {
            onStateChange: (event: any) => handleYtStateChange('A', event),
          }
        });
      }
      if (!ytDeckB.current && document.getElementById('yt-player-b')) {
        ytDeckB.current = new window.YT.Player('yt-player-b', {
          height: '1',
          width: '1',
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0 },
          events: {
            onStateChange: (event: any) => handleYtStateChange('B', event),
          }
        });
      }
    } catch (e) {
      console.warn('YT init error:', e);
    }
  };

  const handleYtStateChange = (deck: 'A' | 'B', event: any) => {
    // 0 = ENDED
    if (event.data === 0 && deck === activeDeckRef.current) {
      if (!isCrossfadingRef.current) {
        nextTrack();
      }
    }
  };

  // Reset audio deck safely without WebAudio buffer silence
  const resetAudioElement = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
      audio.muted = false;
      audio.volume = volumeRef.current;
    } catch (e) {
      console.warn('Audio reset error:', e);
    }
  };

  // Set volume across decks
  const setDeckVolume = (deck: 'A' | 'B', vol: number, track: Track | null) => {
    const clamped = Math.max(0, Math.min(1, vol));
    const isYt = track?.platform === 'youtube' || (!track?.streamUrl && track?.youtubeId);

    if (deck === 'A') {
      if (isYt && ytDeckA.current?.setVolume) {
        ytDeckA.current.setVolume(clamped * 100);
      } else if (audioDeckA.current) {
        audioDeckA.current.volume = clamped;
      }
    } else {
      if (isYt && ytDeckB.current?.setVolume) {
        ytDeckB.current.setVolume(clamped * 100);
      } else if (audioDeckB.current) {
        audioDeckB.current.volume = clamped;
      }
    }
  };

  // Perform equal-power crossfade transition from deckFrom to deckTo
  const executeCrossfade = (
    fromDeck: 'A' | 'B',
    toDeck: 'A' | 'B',
    fromTrack: Track | null,
    nextTrackObj: Track,
    nextIndex: number
  ) => {
    if (isCrossfadingRef.current) return;
    isCrossfadingRef.current = true;
    setIsCrossfading(true);

    const durationMs = crossfadeDurationRef.current * 1000;
    const startTime = performance.now();
    const masterVol = volumeRef.current;

    // Start next deck at volume 0
    setDeckVolume(toDeck, 0, nextTrackObj);
    startDeckPlayback(toDeck, nextTrackObj, 0);

    // Handshake & equal-power ramp
    const crossfadeStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Equal-power curve
      const angle = progress * (Math.PI / 2);
      const gainFrom = Math.cos(angle);
      const gainTo = Math.sin(angle);

      setDeckVolume(fromDeck, masterVol * gainFrom, fromTrack);
      setDeckVolume(toDeck, masterVol * gainTo, nextTrackObj);

      if (progress < 1) {
        crossfadeTimerRef.current = requestAnimationFrame(crossfadeStep);
      } else {
        // Complete crossfade
        stopDeckPlayback(fromDeck, fromTrack);
        setDeckVolume(toDeck, masterVol, nextTrackObj);

        setActiveDeck(toDeck);
        setCurrentTrack(nextTrackObj);
        setQueueIndex(nextIndex);
        setIsCrossfading(false);
        isCrossfadingRef.current = false;
      }
    };

    crossfadeTimerRef.current = requestAnimationFrame(crossfadeStep);
  };

  // Stop playback on a deck
  const stopDeckPlayback = (deck: 'A' | 'B', track: Track | null) => {
    const isYt = track?.platform === 'youtube' || (!track?.streamUrl && track?.youtubeId);
    if (deck === 'A') {
      if (isYt && ytDeckA.current?.stopVideo) {
        ytDeckA.current.stopVideo();
      }
      resetAudioElement(audioDeckA.current);
    } else {
      if (isYt && ytDeckB.current?.stopVideo) {
        ytDeckB.current.stopVideo();
      }
      resetAudioElement(audioDeckB.current);
    }
  };

  // Start playback on a deck
  const startDeckPlayback = (deck: 'A' | 'B', track: Track, initialVol = volumeRef.current) => {
    const isYt = track.platform === 'youtube' || (!track.streamUrl && track.youtubeId);

    if (deck === 'A') {
      if (isYt) {
        resetAudioElement(audioDeckA.current);
        if (ytDeckA.current?.loadVideoById) {
          ytDeckA.current.loadVideoById({
            videoId: track.youtubeId,
            startSeconds: 0
          });
          ytDeckA.current.setVolume(initialVol * 100);
          ytDeckA.current.playVideo();
        }
      } else if (audioDeckA.current && track.streamUrl) {
        if (ytDeckA.current?.stopVideo) ytDeckA.current.stopVideo();
        audioDeckA.current.src = track.streamUrl;
        audioDeckA.current.volume = initialVol;
        audioDeckA.current.muted = false;
        audioDeckA.current.play().catch(e => console.warn('Deck A play failed:', e));
      }
    } else {
      if (isYt) {
        resetAudioElement(audioDeckB.current);
        if (ytDeckB.current?.loadVideoById) {
          ytDeckB.current.loadVideoById({
            videoId: track.youtubeId,
            startSeconds: 0
          });
          ytDeckB.current.setVolume(initialVol * 100);
          ytDeckB.current.playVideo();
        }
      } else if (audioDeckB.current && track.streamUrl) {
        if (ytDeckB.current?.stopVideo) ytDeckB.current.stopVideo();
        audioDeckB.current.src = track.streamUrl;
        audioDeckB.current.volume = initialVol;
        audioDeckB.current.muted = false;
        audioDeckB.current.play().catch(e => console.warn('Deck B play failed:', e));
      }
    }
  };

  // Play a specific track
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (crossfadeTimerRef.current) {
      cancelAnimationFrame(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }
    isCrossfadingRef.current = false;
    setIsCrossfading(false);

    // Resolve full track audio (Spotify -> YouTube) if needed
    const resolvedTrack = (!track.youtubeId && !track.streamUrl)
      ? await resolveFullTrackAudio(track)
      : track;

    let nextQueue = newQueue ? [...newQueue] : [...queueRef.current];
    let idx = nextQueue.findIndex(t => t.id === track.id);
    if (idx === -1) {
      nextQueue = [resolvedTrack, ...nextQueue];
      idx = 0;
    } else {
      nextQueue[idx] = resolvedTrack;
    }

    setQueue(nextQueue);
    setQueueIndex(idx);
    setCurrentTrack(resolvedTrack);
    setIsPlaying(true);

    const targetDeck = activeDeckRef.current;
    const idleDeck = targetDeck === 'A' ? 'B' : 'A';

    stopDeckPlayback(idleDeck, null);
    startDeckPlayback(targetDeck, resolvedTrack, volumeRef.current);
  }, []);

  // Next Track with Crossfade
  const nextTrack = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let nextIndex = queueIndexRef.current + 1;
    if (nextIndex >= q.length) {
      if (isRepeatRef.current) {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    let nextTrackObj = q[nextIndex];
    if (!nextTrackObj.youtubeId && !nextTrackObj.streamUrl) {
      nextTrackObj = await resolveFullTrackAudio(nextTrackObj);
      q[nextIndex] = nextTrackObj;
      setQueue([...q]);
    }

    const fromDeck = activeDeckRef.current;
    const toDeck = fromDeck === 'A' ? 'B' : 'A';

    executeCrossfade(fromDeck, toDeck, currentTrack, nextTrackObj, nextIndex);
  }, [currentTrack]);

  // Prev Track
  const prevTrack = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let prevIndex = queueIndexRef.current - 1;
    if (prevIndex < 0) {
      prevIndex = q.length - 1;
    }

    let prevTrackObj = q[prevIndex];
    if (!prevTrackObj.youtubeId && !prevTrackObj.streamUrl) {
      prevTrackObj = await resolveFullTrackAudio(prevTrackObj);
      q[prevIndex] = prevTrackObj;
      setQueue([...q]);
    }

    const fromDeck = activeDeckRef.current;
    const toDeck = fromDeck === 'A' ? 'B' : 'A';

    executeCrossfade(fromDeck, toDeck, currentTrack, prevTrackObj, prevIndex);
  }, [currentTrack]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const targetDeck = activeDeckRef.current;
    const isYt = currentTrack?.platform === 'youtube' || (!currentTrack?.streamUrl && currentTrack?.youtubeId);

    if (isPlaying) {
      if (isYt) {
        const yt = targetDeck === 'A' ? ytDeckA.current : ytDeckB.current;
        yt?.pauseVideo?.();
      } else {
        const audio = targetDeck === 'A' ? audioDeckA.current : audioDeckB.current;
        audio?.pause();
      }
      setIsPlaying(false);
    } else {
      if (isYt) {
        const yt = targetDeck === 'A' ? ytDeckA.current : ytDeckB.current;
        yt?.playVideo?.();
      } else {
        const audio = targetDeck === 'A' ? audioDeckA.current : audioDeckB.current;
        audio?.play().catch(console.warn);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  // Seek
  const seek = useCallback((seconds: number) => {
    const targetDeck = activeDeckRef.current;
    const isYt = currentTrack?.platform === 'youtube' || (!currentTrack?.streamUrl && currentTrack?.youtubeId);

    if (isYt) {
      const yt = targetDeck === 'A' ? ytDeckA.current : ytDeckB.current;
      yt?.seekTo?.(seconds, true);
    } else {
      const audio = targetDeck === 'A' ? audioDeckA.current : audioDeckB.current;
      if (audio) audio.currentTime = seconds;
    }
    setCurrentTime(seconds);
  }, [currentTrack]);

  // Set Master Volume
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (!isCrossfadingRef.current) {
      setDeckVolume(activeDeckRef.current, clamped, currentTrack);
    }
  }, [currentTrack]);

  // Time ticker & auto-crossfade trigger (3-8 seconds before track end)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlayingRef.current) return;

      const deck = activeDeckRef.current;
      const isYt = currentTrack?.platform === 'youtube' || (!currentTrack?.streamUrl && currentTrack?.youtubeId);

      let cur = 0;
      let dur = 0;

      if (isYt) {
        const yt = deck === 'A' ? ytDeckA.current : ytDeckB.current;
        if (yt?.getCurrentTime && yt?.getDuration) {
          cur = yt.getCurrentTime() || 0;
          dur = yt.getDuration() || 0;
        }
      } else {
        const audio = deck === 'A' ? audioDeckA.current : audioDeckB.current;
        if (audio) {
          cur = audio.currentTime || 0;
          dur = audio.duration || currentTrack?.duration || 0;
        }
      }

      if (dur > 0) {
        setCurrentTime(cur);
        setDuration(dur);

        // Dynamic early crossfade trigger between 3s and 8s before end
        const remaining = dur - cur;
        const triggerThreshold = Math.max(3, Math.min(8, crossfadeDurationRef.current));

        if (remaining <= triggerThreshold && remaining > 0.5 && !isCrossfadingRef.current) {
          const q = queueRef.current;
          if (q.length > 0 && (queueIndexRef.current < q.length - 1 || isRepeatRef.current)) {
            nextTrack();
          }
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [currentTrack, nextTrack]);

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      nextTrack();
    } else if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(0);
  };

  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => setIsRepeat(prev => !prev);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        crossfadeDuration,
        queue,
        queueIndex,
        activeDeck,
        isCrossfading,
        isShuffle,
        isRepeat,
        playTrack,
        togglePlay,
        seek,
        nextTrack,
        prevTrack,
        setVolume,
        setCrossfadeDuration,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
      {/* Hidden audio elements with clean cross-origin handling without WebAudio buffer silencer */}
      <audio
        ref={audioDeckA}
        preload="auto"
        onEnded={() => {
          if (activeDeckRef.current === 'A' && !isCrossfadingRef.current) nextTrack();
        }}
        onError={(e) => console.warn('Deck A audio error:', e)}
      />
      <audio
        ref={audioDeckB}
        preload="auto"
        onEnded={() => {
          if (activeDeckRef.current === 'B' && !isCrossfadingRef.current) nextTrack();
        }}
        onError={(e) => console.warn('Deck B audio error:', e)}
      />

      {/* Hidden persistent YouTube Players for background playback */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        <div id="yt-player-a" />
        <div id="yt-player-b" />
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
