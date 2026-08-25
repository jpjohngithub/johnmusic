// ============================================================
// TIPOS GLOBAIS DO JOHNMUSIC 2.0
// ============================================================

// Fonte de mídia
export type MediaSource = 'spotify' | 'youtube' | 'tiktok' | 'audio'

// ─── Spotify Types ───────────────────────────────────────────

export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  images?: SpotifyImage[]
  followers?: { total: number }
  genres?: string[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  uri: string
  images: SpotifyImage[]
  release_date: string
  artists: SpotifyArtist[]
  total_tracks: number
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  preview_url: string | null
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  track_number: number
  explicit: boolean
  is_local: boolean
  is_playable?: boolean
}

export interface SpotifyPlaylistTrack {
  added_at: string
  track: SpotifyTrack | null
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  uri: string
  images: SpotifyImage[]
  tracks: {
    total: number
    href: string
  }
  owner: {
    display_name: string
    id: string
  }
  public: boolean | null
  collaborative: boolean
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  followers: { total: number }
  product: 'premium' | 'free' | 'open'
  country: string
}

export interface SpotifySearchResult {
  tracks?: {
    items: SpotifyTrack[]
    total: number
    next: string | null
  }
  artists?: {
    items: SpotifyArtist[]
    total: number
    next: string | null
  }
  playlists?: {
    items: SpotifyPlaylist[]
    total: number
    next: string | null
  }
  albums?: {
    items: SpotifyAlbum[]
    total: number
    next: string | null
  }
}

// Item do Spotify adicionado sem login por URL
export interface SpotifySavedItem {
  id: string
  type: 'track' | 'playlist' | 'album' | 'artist' | 'episode'
  spotifyId: string
  title: string
  subtitle: string
  thumbnailUrl: string
  url: string
  embedUrl: string
  addedAt: string
}

// ─── Custom Playlist & Multi-Platform Library ────────────────

export interface PlaylistItem {
  id: string
  source: MediaSource
  title: string
  subtitle: string
  imageUrl: string
  url?: string
  audioUrl?: string
  uri?: string
  videoId?: string
  tiktokPostId?: string
  durationMs?: number
  addedAt: string
}

export interface CustomPlaylist {
  id: string
  name: string
  description?: string
  coverUrl?: string
  importedFrom?: 'spotify' | 'youtube' | 'tiktok' | 'manual'
  externalUrl?: string
  items: PlaylistItem[]
  createdAt: string
  updatedAt: string
}

// ─── Direct Audio Stream Track ────────────────────────────────

export interface AudioTrack {
  id: string
  title: string
  artist: string
  album?: string
  artworkUrl: string
  audioUrl: string
  durationMs?: number
  externalUrl?: string
}

// Spotify Web Playback SDK types
export interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: { name: string; uri: string }[]
      album: {
        name: string
        uri: string
        images: SpotifyImage[]
      }
    }
    previous_tracks: SpotifyPlayerTrack[]
    next_tracks: SpotifyPlayerTrack[]
  }
  shuffle: boolean
  repeat_mode: 0 | 1 | 2
}

export interface SpotifyPlayerTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: { name: string; uri: string }[]
  album: {
    name: string
    uri: string
    images: SpotifyImage[]
  }
}

// ─── YouTube Types ────────────────────────────────────────────

export interface YouTubeVideo {
  id: string
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  url: string
  addedAt: string
  duration?: string
  playlistId?: string
}

export interface YouTubePlaylist {
  id: string
  name: string
  videos: YouTubeVideo[]
  createdAt: string
  updatedAt?: string
}

// Resultado da busca keyless no YouTube (Piped/Invidious/DataAPI)
export interface YouTubeSearchResult {
  id: string
  videoId: string
  title: string
  channelTitle: string
  durationSeconds: number
  thumbnailUrl: string
  url: string
}

// ─── TikTok Types ─────────────────────────────────────────────

export interface TikTokVideo {
  id: string
  postId: string
  title: string
  authorName: string
  thumbnailUrl: string
  url: string
  audioUrl?: string
  soundTitle?: string
  soundAuthor?: string
  durationSeconds?: number
  embedHtml: string
  addedAt: string
  playlistId?: string
}

export interface TikTokPlaylist {
  id: string
  name: string
  videos: TikTokVideo[]
  createdAt: string
  updatedAt?: string
}

// ─── Player Universal Types ───────────────────────────────────

export type PlayerSource = 'spotify' | 'youtube' | 'tiktok' | 'audio' | null

export interface PlayerState {
  source: PlayerSource
  isPlaying: boolean
  volume: number
  isMuted: boolean
  progress: number      // 0–100
  duration: number      // segundos
  currentTime: number   // segundos
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  perfectTransition: boolean // Transição Mágica: Crossfade ultra-fluido + zero silêncio + pré-carregamento DJ
  isCrossfading: boolean // Indicador ativo de mixagem/crossfade mágico entre faixas
  // Direct Audio Track (HTML5 player)
  audioTrack: AudioTrack | null
  // Spotify
  spotifyTrack: SpotifyPlayerTrack | null
  spotifyDeviceId: string | null
  spotifySavedItem: SpotifySavedItem | null
  // YouTube
  youtubeVideo: YouTubeVideo | null
  // TikTok
  tiktokVideo: TikTokVideo | null
  // Queue
  queue: QueueItem[]
  queueIndex: number
  shuffledOrder: number[]
  shuffledPosition: number
}

export interface QueueItem {
  id: string
  source: MediaSource
  title: string
  subtitle: string
  imageUrl: string
  audioUrl?: string
  uri?: string          // Spotify URI
  videoId?: string      // YouTube video ID
  tiktokPostId?: string // TikTok post ID
  tiktokUrl?: string    // TikTok URL
  durationMs?: number   // Duração conhecida (Spotify/iTunes)
}

// ─── Auth Types ───────────────────────────────────────────────

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number     // timestamp ms
}

// ─── Library Types ────────────────────────────────────────────

export interface LocalLibrary {
  customPlaylists: CustomPlaylist[]
  spotifyItems: SpotifySavedItem[]
  youtubePlaylists: YouTubePlaylist[]
  youtubeVideos: YouTubeVideo[]
  tiktokPlaylists: TikTokPlaylist[]
  tiktokVideos: TikTokVideo[]
}

// ─── History & Recommendations Types ─────────────────────────

export interface HistoryItem {
  id: string
  source: MediaSource
  title: string
  subtitle: string
  imageUrl: string
  videoId?: string
  audioUrl?: string
  playedAt: string      // ISO string
  playCount: number
}

export interface PersonalizedMix {
  id: string
  title: string
  description: string
  coverGradient: string
  coverIcon?: string
  coverUrl?: string
  tags: string[]
  items: QueueItem[]
}

export interface RecommendedPlaylist {
  id: string
  name: string
  description: string
  source: MediaSource
  coverUrl: string
  itemCount: number
  creatorName?: string
  url?: string
  items?: QueueItem[]
}
