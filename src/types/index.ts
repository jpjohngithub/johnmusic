export type Platform = 'spotify' | 'youtube' | 'tiktok';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl: string;
  platform: Platform;
  streamUrl?: string; // Direct audio URL (TikTok or MP3 stream)
  youtubeId?: string; // YouTube video ID for IFrame playback
  tiktokOriginalUrl?: string;
  popularity?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  createdAt: number;
  isCustom?: boolean;
}

export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isReady: boolean;
  type: 'youtube' | 'html5' | null;
}
