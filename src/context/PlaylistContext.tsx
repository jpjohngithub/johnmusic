import React, { createContext, useContext, useState, useEffect } from 'react';
import { Playlist, Track } from '../types';
import { FEATURED_TRACKS } from '../services/api';
import { importLegacyPlaylists } from '../services/legacyMigration';

interface PlaylistContextType {
  playlists: Playlist[];
  savedTracks: Track[];
  createPlaylist: (name: string, description?: string, coverUrl?: string, tracks?: Track[]) => Playlist;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  mergePlaylists: (playlistIds: string[], newName: string, removeDuplicates?: boolean) => Playlist;
  getPlaylistById: (id: string) => Playlist | undefined;
  restoreLegacyPlaylists: () => number;
  toggleSaveTrack: (track: Track) => void;
  isSavedTrack: (trackId: string) => boolean;
}

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl_spotify_hits',
    name: 'Spotify Top Hits',
    description: 'Os maiores sucessos mundiais do Spotify sem necessidade de login.',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
    tracks: FEATURED_TRACKS.filter(t => t.platform === 'spotify'),
    createdAt: Date.now() - 1000000,
    isCustom: false
  },
  {
    id: 'pl_youtube_trends',
    name: 'YouTube Music Trends',
    description: 'Videoclipes e músicas em alta com streaming em background contínuo.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    tracks: FEATURED_TRACKS.filter(t => t.platform === 'youtube'),
    createdAt: Date.now() - 900000,
    isCustom: false
  },
  {
    id: 'pl_tiktok_viral',
    name: 'TikTok Viral Tracks',
    description: 'Áudios, phonks e trends mais tocadas no TikTok com áudio direto sem travamento.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    tracks: FEATURED_TRACKS.filter(t => t.platform === 'tiktok'),
    createdAt: Date.now() - 800000,
    isCustom: false
  },
  {
    id: 'pl_unified_megamix',
    name: 'JohnMusic Mega Mix',
    description: 'Mix unificado cruzando Spotify, YouTube e TikTok com transição mágica contínua.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    tracks: FEATURED_TRACKS,
    createdAt: Date.now() - 700000,
    isCustom: false
  }
];

const STORAGE_DELETED_KEY = 'johnmusic_deleted_ids_v4';
const STORAGE_DELETED_NAMES_KEY = 'johnmusic_deleted_names_v4';
const STORAGE_MIGRATED_KEY = 'johnmusic_legacy_migrated_v4';
const STORAGE_PLAYLISTS_KEY = 'johnmusic_playlists_v4';
const STORAGE_SAVED_KEY = 'johnmusic_saved_tracks_v4';

function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function getDeletedPlaylistIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY) || getCookie(STORAGE_DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function getDeletedPlaylistNames(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_NAMES_KEY) || getCookie(STORAGE_DELETED_NAMES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveToLocalStorage(key: string, data: any) {
  try {
    const str = JSON.stringify(data);
    localStorage.setItem(key, str);
    // Also backup to session storage
    sessionStorage.setItem(key, str);
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const deletedIds = getDeletedPlaylistIds();
    const deletedNames = getDeletedPlaylistNames();
    let loaded: Playlist[] | null = null;

    // Check v4 store first, then sessionStorage, then v3
    const savedV4 = localStorage.getItem(STORAGE_PLAYLISTS_KEY) || sessionStorage.getItem(STORAGE_PLAYLISTS_KEY);
    const savedV3 = localStorage.getItem('johnmusic_playlists_v3');

    if (savedV4) {
      try {
        const parsed = JSON.parse(savedV4);
        if (Array.isArray(parsed)) loaded = parsed;
      } catch {}
    } else if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed)) loaded = parsed;
      } catch {}
    }

    if (loaded !== null) {
      // Exclude permanently deleted playlists by ID and by normalized name
      let clean = loaded.filter(p => !deletedIds.has(p.id) && !deletedNames.has(p.name.toLowerCase().trim()));

      // Refresh working stream URLs and verified YouTube IDs on tracks without overwriting user additions
      clean = clean.map(p => {
        const updatedTracks = p.tracks.map(t => {
          const fresh = FEATURED_TRACKS.find(f => f.id === t.id);
          if (fresh) {
            return {
              ...t,
              youtubeId: fresh.youtubeId || t.youtubeId,
              streamUrl: fresh.streamUrl || t.streamUrl,
              coverUrl: fresh.coverUrl || t.coverUrl
            };
          }
          return t;
        });
        return { ...p, tracks: updatedTracks };
      });

      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, clean);
      return clean;
    }

    // First launch only: initialize defaults minus deleted items
    let current: Playlist[] = DEFAULT_PLAYLISTS.filter(p => !deletedIds.has(p.id) && !deletedNames.has(p.name.toLowerCase().trim()));

    const isAlreadyMigrated = localStorage.getItem(STORAGE_MIGRATED_KEY) === 'true';
    if (!isAlreadyMigrated) {
      try {
        const legacy = importLegacyPlaylists().filter(p => !deletedIds.has(p.id) && !deletedNames.has(p.name.toLowerCase().trim()));
        if (legacy.length > 0) {
          current = [...legacy, ...current];
        }
      } catch (e) {
        console.warn('Initial legacy migration failed:', e);
      }
      localStorage.setItem(STORAGE_MIGRATED_KEY, 'true');
    }

    saveToLocalStorage(STORAGE_PLAYLISTS_KEY, current);
    return current;
  });

  const [savedTracks, setSavedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return FEATURED_TRACKS.slice(0, 4);
  });

  // Synchronous auto-save backup
  useEffect(() => {
    saveToLocalStorage(STORAGE_PLAYLISTS_KEY, playlists);
  }, [playlists]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_SAVED_KEY, savedTracks);
  }, [savedTracks]);

  const toggleSaveTrack = (track: Track) => {
    setSavedTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      const next = exists ? prev.filter(t => t.id !== track.id) : [track, ...prev];
      saveToLocalStorage(STORAGE_SAVED_KEY, next);
      return next;
    });
  };

  const isSavedTrack = (trackId: string): boolean => {
    return savedTracks.some(t => t.id === trackId);
  };

  const restoreLegacyPlaylists = (): number => {
    try {
      const legacy = importLegacyPlaylists();
      if (legacy.length === 0) return 0;
      let count = 0;
      setPlaylists(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAdd = legacy.filter(p => !existingIds.has(p.id));
        count = toAdd.length;
        const next = [...toAdd, ...prev];
        saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
        return next;
      });
      return count;
    } catch {
      return 0;
    }
  };

  const createPlaylist = (
    name: string,
    description?: string,
    coverUrl?: string,
    tracks?: Track[]
  ): Playlist => {
    const newPl: Playlist = {
      id: `pl_custom_${Date.now()}`,
      name,
      description: description || 'Playlist criada no JohnMusic',
      coverUrl: coverUrl || (tracks && tracks[0]?.coverUrl) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      tracks: tracks || [],
      createdAt: Date.now(),
      isCustom: true
    };
    setPlaylists(prev => {
      const next = [newPl, ...prev];
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
    return newPl;
  };

  const deletePlaylist = (id: string) => {
    const target = playlists.find(p => p.id === id);
    const targetName = target ? target.name.toLowerCase().trim() : '';

    // 1. Permanently blacklist ID and name in localStorage and cookie
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(id);
      const idJson = JSON.stringify(Array.from(set));
      localStorage.setItem(STORAGE_DELETED_KEY, idJson);
      setCookie(STORAGE_DELETED_KEY, idJson);

      if (targetName) {
        const rawNames = localStorage.getItem(STORAGE_DELETED_NAMES_KEY);
        const nameSet = new Set<string>(rawNames ? JSON.parse(rawNames) : []);
        nameSet.add(targetName);
        const nameJson = JSON.stringify(Array.from(nameSet));
        localStorage.setItem(STORAGE_DELETED_NAMES_KEY, nameJson);
        setCookie(STORAGE_DELETED_NAMES_KEY, nameJson);
      }
    } catch {}

    // 2. Scrub from legacy localStorage stores
    const keysToScrub = [
      'johnmusic_playlists_v4',
      'johnmusic_playlists_v3',
      'johnmusic_playlists_v2',
      'johnmusic-library-v4',
      'johnmusic-library-v3',
      'customPlaylists',
      'youtubePlaylists',
      'tiktokPlaylists'
    ];
    keysToScrub.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localStorage.setItem(key, JSON.stringify(parsed.filter((item: any) => item.id !== id && item.name?.toLowerCase().trim() !== targetName)));
        } else if (parsed && typeof parsed === 'object') {
          const stateObj = parsed.state || parsed;
          ['customPlaylists', 'youtubePlaylists', 'tiktokPlaylists', 'playlists'].forEach(arrKey => {
            if (Array.isArray(stateObj[arrKey])) {
              stateObj[arrKey] = stateObj[arrKey].filter((item: any) => item.id !== id && item.name?.toLowerCase().trim() !== targetName);
            }
          });
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch {}
    });

    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
  };

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...updates, isCustom: true } : p));
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
  };

  const reorderPlaylistTracks = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p;
        const newTracks = [...p.tracks];
        const [moved] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, moved);
        return { ...p, tracks: newTracks };
      });
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      });
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p;
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      });
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
  };

  const mergePlaylists = (
    playlistIds: string[],
    newName: string,
    removeDuplicates = true
  ): Playlist => {
    const selected = playlists.filter(p => playlistIds.includes(p.id));
    const allTracks: Track[] = [];
    const seen = new Set<string>();

    for (const pl of selected) {
      for (const t of pl.tracks) {
        const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`;
        if (removeDuplicates) {
          if (!seen.has(key) && !seen.has(t.id)) {
            seen.add(key);
            seen.add(t.id);
            allTracks.push(t);
          }
        } else {
          allTracks.push(t);
        }
      }
    }

    const firstCover = selected.find(p => p.coverUrl)?.coverUrl;
    const merged: Playlist = {
      id: `pl_merged_${Date.now()}`,
      name: newName,
      description: `Playlist unificada mesclando ${selected.map(s => s.name).join(', ')} (${allTracks.length} faixas).`,
      coverUrl: firstCover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      tracks: allTracks,
      createdAt: Date.now(),
      isCustom: true
    };

    setPlaylists(prev => {
      const next = [merged, ...prev];
      saveToLocalStorage(STORAGE_PLAYLISTS_KEY, next);
      return next;
    });
    return merged;
  };

  const getPlaylistById = (id: string) => playlists.find(p => p.id === id);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        savedTracks,
        createPlaylist,
        deletePlaylist,
        updatePlaylist,
        reorderPlaylistTracks,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        mergePlaylists,
        getPlaylistById,
        restoreLegacyPlaylists,
        toggleSaveTrack,
        isSavedTrack
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylists must be used within PlaylistProvider');
  return context;
};
