export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  genre?: string;
  lyrics?: LyricLine[] | string;
  isLocal?: boolean;
  isLiked?: boolean;
  source: 'built-in' | 'local' | 'spotify' | 'online';
  file?: File;
  addedAt?: number;
  spotifyUri?: string;
  spotifyId?: string;
  externalUrl?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  createdAt: number;
  isSystem?: boolean;
  spotifyId?: string;
  tracks?: Track[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artist: string;
  coverUrl: string;
  releaseDate?: string;
  totalTracks: number;
  spotifyUri: string;
}

export interface SpotifyPlaylistCard {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  totalTracks: number;
  spotifyUri: string;
  owner?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'circle' | 'neon-pulse' | 'glow-blocks';

export type ViewType = 
  | 'home'
  | 'explore'
  | 'playlist'
  | 'spotify-playlist'
  | 'local-files'
  | 'spotify'
  | 'favorites'
  | 'history'
  | 'lyrics';

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 5 bands: 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
}

export interface SpotifyAuthStatus {
  clientId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isConnected: boolean;
  userProfile?: {
    displayName: string;
    email?: string;
    product?: string;
    images?: { url: string }[];
  };
}
