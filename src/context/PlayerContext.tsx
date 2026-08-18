import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Track, Playlist, RepeatMode, VisualizerMode, ViewType, SpotifyAlbum, SpotifyPlaylistCard } from '../types/music';
import { DEFAULT_PLAYLISTS } from '../data/defaultTracks';
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
  selectedSpotifyItem: SpotifyPlaylistCard | SpotifyAlbum | null;
  selectedSpotifyType: 'playlist' | 'album';
  equalizerGains: number[];
  activePreset: string;
  visualizerMode: VisualizerMode;
  isVisualizerOpen: boolean;
  isEqualizerOpen: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  isSpotifyEmbedOpen: boolean;
  isYouTubeMode: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  searchQuery: string;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (title: string, description: string, coverUrl?: string) => Playlist;
  updatePlaylist: (playlistId: string, updated: { title: string; description: string; coverUrl?: string }) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
  addLocalTracks: (tracks: Track[]) => void;
  setCurrentView: (view: ViewType, playlistId?: string | null) => void;
  openSpotifyItem: (item: SpotifyPlaylistCard | SpotifyAlbum, type: 'playlist' | 'album') => void;
  setEqualizerGains: (gains: number[], presetName?: string) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setSleepTimer: (minutes: number | null) => void;
  setSearchQuery: (query: string) => void;
  toggleVisualizer: () => void;
  toggleEqualizer: () => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
  toggleSpotifyEmbed: () => void;
  toggleYouTubeMode: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const STORAGE_PLAYLISTS_KEY = 'johnmusic_playlists';
const STORAGE_FAVORITES_KEY = 'johnmusic_favorites';
const STORAGE_VOL_KEY = 'johnmusic_volume';
const STORAGE_HISTORY_KEY = 'johnmusic_history';
const STORAGE_EQ_KEY = 'johnmusic_equalizer';
const STORAGE_VISUALIZER_KEY = 'johnmusic_visualizer_mode';
const STORAGE_LAST_TRACK_KEY = 'johnmusic_last_track';
const STORAGE_REPEAT_KEY = 'johnmusic_repeat_mode';
const STORAGE_SHUFFLE_KEY = 'johnmusic_shuffle_mode';
const STORAGE_YT_MODE_KEY = 'johnmusic_yt_mode';

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_PLAYLISTS;
  });

  const [favorites, setFavorites] = useState<Track[]>(() => {
    const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [history, setHistory] = useState<Track[]>(() => {
    const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [equalizerGains, setEqualizerGainsState] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_EQ_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.gains)) return parsed.gains;
      } catch (e) { console.error(e); }
    }
    return [0, 0, 0, 0, 0];
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_EQ_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.preset) return parsed.preset;
      } catch (e) { console.error(e); }
    }
    return 'Padrão (Flat)';
  });

  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>(() => {
    const saved = localStorage.getItem(STORAGE_VISUALIZER_KEY) as VisualizerMode;
    return saved || 'neon-pulse';
  });

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_VOL_KEY);
    return saved ? Number(saved) : 0.8;
  });

  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    const saved = localStorage.getItem(STORAGE_REPEAT_KEY) as RepeatMode;
    return saved || 'off';
  });

  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_SHUFFLE_KEY);
    return saved === 'true';
  });

  const [isYouTubeMode, setIsYouTubeMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_YT_MODE_KEY);
    return saved === 'true';
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    const saved = localStorage.getItem(STORAGE_LAST_TRACK_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [currentView, setCurrentViewState] = useState<ViewType>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedSpotifyItem, setSelectedSpotifyItem] = useState<SpotifyPlaylistCard | SpotifyAlbum | null>(null);
  const [selectedSpotifyType, setSelectedSpotifyType] = useState<'playlist' | 'album'>('playlist');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isSpotifyEmbedOpen, setIsSpotifyEmbedOpen] = useState<boolean>(false);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(audioEngine.getAudioElement());

  useEffect(() => {
    localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VOL_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_EQ_KEY, JSON.stringify({ gains: equalizerGains, preset: activePreset }));
  }, [equalizerGains, activePreset]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VISUALIZER_KEY, visualizerMode);
  }, [visualizerMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REPEAT_KEY, repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHUFFLE_KEY, String(isShuffle));
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_YT_MODE_KEY, String(isYouTubeMode));
  }, [isYouTubeMode]);

  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem(STORAGE_LAST_TRACK_KEY, JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

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

  // Clear & Guaranteed Playback Function
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
    setIsPlaying(true);

    const isExplicitYt = track.genre === 'YouTube' || track.genre === 'TikTok Viral' || track.audioUrl?.includes('youtube.com') || track.audioUrl?.includes('youtu.be');

    if (isExplicitYt) {
      setIsYouTubeMode(true);
      audioEngine.pause();
    } else {
      setIsYouTubeMode(false);
      if (track.audioUrl) {
        audioEngine.setSrc(track.audioUrl);
        audioEngine.play().catch(err => {
          console.warn('Audio play error, retrying:', err);
        });
      }
    }

    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, [queue]);

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
      playTrack(nextTrk, queue);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, playTrack]);

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (!isYouTubeMode) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (!isYouTubeMode && audio.duration) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleTrackEnd();
    };

    const onError = (e: any) => {
      console.warn('Audio element error:', e);
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
  }, [currentTrack, queue, queueIndex, repeatMode, isShuffle, handleTrackEnd, isYouTubeMode]);

  const togglePlay = useCallback(() => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      try {
        if (window.__johnmusic_yt_player?.pauseVideo) {
          window.__johnmusic_yt_player.pauseVideo();
        }
      } catch {}
    } else {
      setIsPlaying(true);
      if (isYouTubeMode) {
        try {
          if (window.__johnmusic_yt_player?.playVideo) {
            window.__johnmusic_yt_player.playVideo();
          }
        } catch {}
      } else {
        audioEngine.play().catch(err => {
          console.warn('Playback resume error:', err);
        });
      }
    }
  }, [isPlaying, currentTrack, queue, playTrack, isYouTubeMode]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
    try {
      if (window.__johnmusic_yt_player?.seekTo) {
        window.__johnmusic_yt_player.seekTo(seconds, true);
      }
    } catch {}
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
      playTrack(prevTrk, queue);
    }
  }, [queue, queueIndex, currentTime, seek, playTrack]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    audioEngine.setVolume(clamped);
    try {
      if (window.__johnmusic_yt_player?.setVolume) {
        window.__johnmusic_yt_player.setVolume(clamped * 100);
      }
    } catch {}
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      audioEngine.setMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioEngine.setMuted(next);
      try {
        if (next) {
          window.__johnmusic_yt_player?.mute();
        } else {
          window.__johnmusic_yt_player?.unMute();
        }
      } catch {}
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

  const toggleYouTubeMode = useCallback(() => {
    setIsYouTubeMode(prev => {
      const next = !prev;
      if (next) {
        audioEngine.pause();
      }
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((track: Track) => {
    setFavorites(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#10b981', '#06b6d4', '#ec4899', '#f59e0b']
        });
        return [...prev, { ...track, isLiked: true }];
      }
    });

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

  const createPlaylist = useCallback((title: string, description: string, coverUrl?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: title || 'Minha Playlist',
      description: description || 'Playlist criada no johnmusic.',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
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

  const updatePlaylist = useCallback((playlistId: string, updated: { title: string; description: string; coverUrl?: string }) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, ...updated };
      }
      return p;
    }));
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

  const reorderPlaylistTracks = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const nextIds = [...p.trackIds];
        const [moved] = nextIds.splice(fromIndex, 1);
        nextIds.splice(toIndex, 0, moved);
        return { ...p, trackIds: nextIds };
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

  const openSpotifyItem = useCallback((item: SpotifyPlaylistCard | SpotifyAlbum, type: 'playlist' | 'album') => {
    setSelectedSpotifyItem(item);
    setSelectedSpotifyType(type);
    setCurrentViewState('spotify-playlist');
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
  const toggleSpotifyEmbed = useCallback(() => setIsSpotifyEmbedOpen(prev => !prev), []);

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
        selectedSpotifyItem,
        selectedSpotifyType,
        equalizerGains,
        activePreset,
        visualizerMode,
        isVisualizerOpen,
        isEqualizerOpen,
        isQueueOpen,
        isLyricsOpen,
        isSpotifyEmbedOpen,
        isYouTubeMode,
        sleepTimerMinutes,
        sleepTimerRemaining,
        searchQuery,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        setCurrentTime,
        setDuration,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        addToQueue,
        removeFromQueue,
        clearQueue,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        addLocalTracks,
        setCurrentView,
        openSpotifyItem,
        setEqualizerGains,
        setVisualizerMode,
        setSleepTimer,
        setSearchQuery,
        toggleVisualizer,
        toggleEqualizer,
        toggleQueue,
        toggleLyrics,
        toggleSpotifyEmbed,
        toggleYouTubeMode,
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
