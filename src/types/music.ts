export interface LyricLine {
  time: number; // in seconds (for synced lyrics)
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
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  createdAt: number;
  isSystem?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'circle' | 'neon-pulse' | 'glow-blocks';

export type ViewType = 
  | 'home'
  | 'explore'
  | 'playlist'
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
