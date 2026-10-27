import React, { createContext, useContext, useState, useEffect } from 'react';
import { Playlist, Track } from '../types';
import { FEATURED_TRACKS } from '../services/api';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string, coverUrl?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  mergePlaylists: (playlistIds: string[], newName: string, removeDuplicates?: boolean) => Playlist;
  getPlaylistById: (id: string) => Playlist | undefined;
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

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('johnmusic_playlists_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
    return DEFAULT_PLAYLISTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('johnmusic_playlists_v3', JSON.stringify(playlists));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [playlists]);

  const createPlaylist = (name: string, description?: string, coverUrl?: string): Playlist => {
    const newPl: Playlist = {
      id: `pl_custom_${Date.now()}`,
      name,
      description: description || 'Playlist personalizada criada no JohnMusic',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      tracks: [],
      createdAt: Date.now(),
      isCustom: true
    };
    setPlaylists(prev => [newPl, ...prev]);
    return newPl;
  };

  const deletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      })
    );
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id !== playlistId) return p;
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      })
    );
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

    setPlaylists(prev => [merged, ...prev]);
    return merged;
  };

  const getPlaylistById = (id: string) => playlists.find(p => p.id === id);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        mergePlaylists,
        getPlaylistById,
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
