import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Track, Playlist, RepeatMode, VisualizerMode, ViewType } from '../types/music';
import { DEFAULT_TRACKS, DEFAULT_PLAYLISTS } from '../data/defaultTracks';
import { audioEngine } from '../services/audioService';
import confetti from 'canvas-confetti';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  history: Track[];
  playlists: Playlist[];
  favorites: Track[];
  localTracks: Track[];
  currentView: ViewType;
  selectedPlaylistId: string | null;
  equalizerGains: number[];
  activePreset: string;
  visualizerMode: VisualizerMode;
  isVisualizerOpen: boolean;
  isEqualizerOpen: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  searchQuery: string;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (title: string, description: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  addLocalTracks: (tracks: Track[]) => void;
  setCurrentView: (view: ViewType, playlistId?: string | null) => void;
  setEqualizerGains: (gains: number[], presetName?: string) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setSleepTimer: (minutes: number | null) => void;
  setSearchQuery: (query: string) => void;
  toggleVisualizer: () => void;
  toggleEqualizer: () => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const STORAGE_PLAYLISTS_KEY = 'johnmusic_playlists';
const STORAGE_FAVORITES_KEY = 'johnmusic_favorites';
const STORAGE_VOL_KEY = 'johnmusic_volume';

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved playlists or defaults
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PLAYLISTS;
  });

  // Load favorites
  const [favorites, setFavorites] = useState<Track[]>(() => {
    const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_TRACKS.filter(t => t.isLiked);
  });

  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  
  const [queue, setQueue] = useState<Track[]>(DEFAULT_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0] || null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(184);

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_VOL_KEY);
    return saved ? Number(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const [currentView, setCurrentViewState] = useState<ViewType>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('neon-pulse');

  // Equalizer
  const [equalizerGains, setEqualizerGainsState] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('Padrão (Flat)');

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(audioEngine.getAudioElement());

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VOL_KEY, String(volume));
  }, [volume]);

  // Handle sleep timer countdown
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          audioEngine.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    let nextIdx = 0;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    const nextTrk = queue[nextIdx];
    if (nextTrk) {
      setQueueIndex(nextIdx);
      setCurrentTrack(nextTrk);
      audioEngine.setSrc(nextTrk.audioUrl);
      audioEngine.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.warn(e));

      setHistory(prev => [nextTrk, ...prev.filter(t => t.id !== nextTrk.id)].slice(0, 50));
    }
  }, [queue, queueIndex, isShuffle, repeatMode]);

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack]);

  // Bind HTML Audio Element events
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const onEnded = () => {
      handleTrackEnd();
    };

    const onError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrack, queue, queueIndex, repeatMode, isShuffle, handleTrackEnd]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    let updatedQueue = queue;
    let index = 0;

    if (newQueue && newQueue.length > 0) {
      updatedQueue = newQueue;
      index = newQueue.findIndex(t => t.id === track.id);
      if (index === -1) {
        updatedQueue = [track, ...newQueue];
        index = 0;
      }
      setQueue(updatedQueue);
    } else {
      index = updatedQueue.findIndex(t => t.id === track.id);
      if (index === -1) {
        updatedQueue = [...queue, track];
        index = updatedQueue.length - 1;
        setQueue(updatedQueue);
      }
    }

    setQueueIndex(index >= 0 ? index : 0);
    setCurrentTrack(track);

    audioEngine.setSrc(track.audioUrl);
    audioEngine.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn('Playback prevented or failed:', err);
    });

    // Add to listening history
    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, [queue]);

  const togglePlay = useCallback(() => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  }, [isPlaying, currentTrack, queue, playTrack]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const prevTrack = useCallback(() => {
    if (currentTime > 4) {
      seek(0);
      return;
    }

    if (queue.length === 0) return;
    const prevIdx = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    const prevTrk = queue[prevIdx];
    if (prevTrk) {
      setQueueIndex(prevIdx);
      setCurrentTrack(prevTrk);
      audioEngine.setSrc(prevTrk.audioUrl);
      audioEngine.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.warn(e));

      setHistory(prev => [prevTrk, ...prev.filter(t => t.id !== prevTrk.id)].slice(0, 50));
    }
  }, [queue, queueIndex, currentTime, seek]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    audioEngine.setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      audioEngine.setMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioEngine.setMuted(next);
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleFavorite = useCallback((track: Track) => {
    setFavorites(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        // Trigger small celebration confetti
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#10b981', '#06b6d4', '#ec4899', '#f59e0b']
        });
        return [...prev, { ...track, isLiked: true }];
      }
    });

    // Also sync in default playlist favorites
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === 'playlist-favorites') {
        const has = pl.trackIds.includes(track.id);
        return {
          ...pl,
          trackIds: has ? pl.trackIds.filter(id => id !== track.id) : [...pl.trackIds, track.id]
        };
      }
      return pl;
    }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  const createPlaylist = useCallback((title: string, description: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: title || 'Minha Playlist',
      description: description || 'Playlist criada no johnmusic.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      trackIds: [],
      createdAt: Date.now()
    };
    setPlaylists(prev => [newPlaylist, ...prev]);

    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 }
    });

    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
      setCurrentViewState('home');
    }
  }, [selectedPlaylistId]);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(track.id)) {
        return { ...p, trackIds: [...p.trackIds, track.id] };
      }
      return p;
    }));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
      }
      return p;
    }));
  }, []);

  const addLocalTracks = useCallback((tracks: Track[]) => {
    setLocalTracks(prev => [...tracks, ...prev]);
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const setCurrentView = useCallback((view: ViewType, playlistId?: string | null) => {
    setCurrentViewState(view);
    if (playlistId !== undefined) {
      setSelectedPlaylistId(playlistId);
    }
  }, []);

  const setEqualizerGains = useCallback((gains: number[], presetName?: string) => {
    setEqualizerGainsState(gains);
    if (presetName) {
      setActivePreset(presetName);
    }
    audioEngine.setEqualizerGains(gains);
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerMinutes(minutes);
  }, []);

  const toggleVisualizer = useCallback(() => setIsVisualizerOpen(prev => !prev), []);
  const toggleEqualizer = useCallback(() => setIsEqualizerOpen(prev => !prev), []);
  const toggleQueue = useCallback(() => setIsQueueOpen(prev => !prev), []);
  const toggleLyrics = useCallback(() => setIsLyricsOpen(prev => !prev), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        queue,
        queueIndex,
        history,
        playlists,
        favorites,
        localTracks,
        currentView,
        selectedPlaylistId,
        equalizerGains,
        activePreset,
        visualizerMode,
        isVisualizerOpen,
        isEqualizerOpen,
        isQueueOpen,
        isLyricsOpen,
        sleepTimerMinutes,
        sleepTimerRemaining,
        searchQuery,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        addToQueue,
        removeFromQueue,
        clearQueue,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addLocalTracks,
        setCurrentView,
        setEqualizerGains,
        setVisualizerMode,
        setSleepTimer,
        setSearchQuery,
        toggleVisualizer,
        toggleEqualizer,
        toggleQueue,
        toggleLyrics,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
