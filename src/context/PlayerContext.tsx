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
  const ytDeckReadyA = useRef<boolean>(false);
  const ytDeckReadyB = useRef<boolean>(false);
  const pendingTrackRef = useRef<{ deck: 'A' | 'B'; track: Track; vol: number } | null>(null);

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
  const playSessionIdRef = useRef<number>(0);

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
    const initTimer = setInterval(() => {
      if (window.YT && window.YT.Player) {
        initYtPlayers();
        if (ytDeckA.current && ytDeckB.current) {
          clearInterval(initTimer);
        }
      }
    }, 150);

    window.onYouTubeIframeAPIReady = () => {
      ytReady.current = true;
      initYtPlayers();
    };

    return () => clearInterval(initTimer);
  }, []);

  const initYtPlayers = () => {
    try {
      if (!ytDeckA.current && document.getElementById('yt-player-a') && window.YT?.Player) {
        ytDeckA.current = new window.YT.Player('yt-player-a', {
          height: '200',
          width: '300',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              ytDeckReadyA.current = true;
              if (pendingTrackRef.current && pendingTrackRef.current.deck === 'A') {
                const { track, vol } = pendingTrackRef.current;
                pendingTrackRef.current = null;
                startDeckPlayback('A', track, vol);
              }
            },
            onStateChange: (event: any) => handleYtStateChange('A', event),
            onError: (err: any) => console.warn('Deck A YT Error:', err)
          }
        });
      }
      if (!ytDeckB.current && document.getElementById('yt-player-b') && window.YT?.Player) {
        ytDeckB.current = new window.YT.Player('yt-player-b', {
          height: '200',
          width: '300',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              ytDeckReadyB.current = true;
              if (pendingTrackRef.current && pendingTrackRef.current.deck === 'B') {
                const { track, vol } = pendingTrackRef.current;
                pendingTrackRef.current = null;
                startDeckPlayback('B', track, vol);
              }
            },
            onStateChange: (event: any) => handleYtStateChange('B', event),
            onError: (err: any) => console.warn('Deck B YT Error:', err)
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

  // Helper to determine if playback should use YouTube engine or HTML5 audio
  const isTrackYouTube = (track: Track | null): boolean => {
    if (!track) return false;
    // Real direct audio streams (like from TikTok CDN) can play in HTML5 audio
    if (track.streamUrl && !track.youtubeId && !track.streamUrl.includes('itunes.apple.com')) {
      return false;
    }
    // Prefer YouTube whenever a valid youtubeId exists or for unified platforms
    if (track.youtubeId) return true;
    if (track.platform === 'spotify' || track.platform === 'youtube' || track.platform === 'tiktok') return true;
    return false;
  };

  // Set volume across decks
  const setDeckVolume = (deck: 'A' | 'B', vol: number, track: Track | null) => {
    const clamped = Math.max(0, Math.min(1, vol));
    const isYt = isTrackYouTube(track);

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

  // Stop playback on a deck unconditionally (both YT and HTML5 audio)
  const stopDeckPlayback = (deck: 'A' | 'B', _track?: Track | null) => {
    if (deck === 'A') {
      try {
        if (ytDeckA.current?.stopVideo) ytDeckA.current.stopVideo();
        if (ytDeckA.current?.pauseVideo) ytDeckA.current.pauseVideo();
      } catch {}
      resetAudioElement(audioDeckA.current);
    } else {
      try {
        if (ytDeckB.current?.stopVideo) ytDeckB.current.stopVideo();
        if (ytDeckB.current?.pauseVideo) ytDeckB.current.pauseVideo();
      } catch {}
      resetAudioElement(audioDeckB.current);
    }
  };

  // Start playback on a deck
  const startDeckPlayback = (deck: 'A' | 'B', track: Track, initialVol = volumeRef.current) => {
    const isYt = isTrackYouTube(track);

    if (deck === 'A') {
      if (isYt && track.youtubeId) {
        resetAudioElement(audioDeckA.current);
        if (ytDeckReadyA.current && ytDeckA.current?.loadVideoById) {
          try {
            ytDeckA.current.loadVideoById({
              videoId: track.youtubeId,
              startSeconds: 0
            });
            ytDeckA.current.setVolume(initialVol * 100);
            ytDeckA.current.playVideo();
          } catch (e) {
            console.warn('YT Deck A play error:', e);
          }
        } else {
          pendingTrackRef.current = { deck: 'A', track, vol: initialVol };
        }
      } else if (audioDeckA.current && track.streamUrl && !track.streamUrl.includes('itunes.apple.com')) {
        if (ytDeckA.current?.stopVideo) ytDeckA.current.stopVideo();
        audioDeckA.current.src = track.streamUrl;
        audioDeckA.current.volume = initialVol;
        audioDeckA.current.muted = false;
        audioDeckA.current.play().catch(async (e) => {
          console.warn('Deck A audio play failed, falling back to YouTube:', e);
          const resolved = await resolveFullTrackAudio(track, true);
          if (resolved.youtubeId) {
            startDeckPlayback('A', resolved, initialVol);
          }
        });
      } else {
        resolveFullTrackAudio(track, true).then(resolved => {
          if (resolved.youtubeId) {
            startDeckPlayback('A', resolved, initialVol);
          }
        });
      }
    } else {
      if (isYt && track.youtubeId) {
        resetAudioElement(audioDeckB.current);
        if (ytDeckReadyB.current && ytDeckB.current?.loadVideoById) {
          try {
            ytDeckB.current.loadVideoById({
              videoId: track.youtubeId,
              startSeconds: 0
            });
            ytDeckB.current.setVolume(initialVol * 100);
            ytDeckB.current.playVideo();
          } catch (e) {
            console.warn('YT Deck B play error:', e);
          }
        } else {
          pendingTrackRef.current = { deck: 'B', track, vol: initialVol };
        }
      } else if (audioDeckB.current && track.streamUrl && !track.streamUrl.includes('itunes.apple.com')) {
        if (ytDeckB.current?.stopVideo) ytDeckB.current.stopVideo();
        audioDeckB.current.src = track.streamUrl;
        audioDeckB.current.volume = initialVol;
        audioDeckB.current.muted = false;
        audioDeckB.current.play().catch(async (e) => {
          console.warn('Deck B audio play failed, falling back to YouTube:', e);
          const resolved = await resolveFullTrackAudio(track, true);
          if (resolved.youtubeId) {
            startDeckPlayback('B', resolved, initialVol);
          }
        });
      } else {
        resolveFullTrackAudio(track, true).then(resolved => {
          if (resolved.youtubeId) {
            startDeckPlayback('B', resolved, initialVol);
          }
        });
      }
    }
  };

  // Play a specific track
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const sessionId = ++playSessionIdRef.current;

    // 1. Immediately cancel any running crossfade & clear pending buffer
    if (crossfadeTimerRef.current) {
      cancelAnimationFrame(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }
    isCrossfadingRef.current = false;
    setIsCrossfading(false);
    pendingTrackRef.current = null;

    // 2. Unconditionally stop previous playback on both decks so old song NEVER bleeds or keeps playing!
    stopDeckPlayback('A');
    stopDeckPlayback('B');

    // 3. Immediately set current state
    setCurrentTrack(track);
    setIsPlaying(true);

    let nextQueue = newQueue ? [...newQueue] : [...queueRef.current];
    let idx = nextQueue.findIndex(t => t.id === track.id);
    if (idx === -1) {
      nextQueue = [track, ...nextQueue];
      idx = 0;
    }
    setQueue(nextQueue);
    setQueueIndex(idx);

    // 4. Resolve track audio (Spotify / Search results -> YouTube ID)
    const needsResolution = !track.youtubeId && (!track.streamUrl || track.streamUrl.includes('itunes.apple.com'));
    const resolvedTrack = needsResolution
      ? await resolveFullTrackAudio(track)
      : track;

    // Check if another song was selected while resolving
    if (sessionId !== playSessionIdRef.current) {
      return;
    }

    nextQueue[idx] = resolvedTrack;
    setQueue([...nextQueue]);
    setCurrentTrack(resolvedTrack);

    const targetDeck = activeDeckRef.current;
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
    const isYt = isTrackYouTube(currentTrack);

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
    const isYt = isTrackYouTube(currentTrack);

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
      const isYt = isTrackYouTube(currentTrack);

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
        onError={async (e) => {
          console.warn('Deck A audio error, attempting YouTube resolution:', e);
          if (currentTrack) {
            const resolved = await resolveFullTrackAudio(currentTrack, true);
            if (resolved.youtubeId) {
              startDeckPlayback('A', resolved, volumeRef.current);
            }
          }
        }}
      />
      <audio
        ref={audioDeckB}
        preload="auto"
        onEnded={() => {
          if (activeDeckRef.current === 'B' && !isCrossfadingRef.current) nextTrack();
        }}
        onError={async (e) => {
          console.warn('Deck B audio error, attempting YouTube resolution:', e);
          if (currentTrack) {
            const resolved = await resolveFullTrackAudio(currentTrack, true);
            if (resolved.youtubeId) {
              startDeckPlayback('B', resolved, volumeRef.current);
            }
          }
        }}
      />

      {/* Background YouTube Players with sufficient dimensions & visible opacity to pass browser autoplay policies */}
      <div className="fixed -bottom-[500px] -right-[500px] w-[300px] h-[200px] pointer-events-none opacity-100 z-10 overflow-hidden">
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
