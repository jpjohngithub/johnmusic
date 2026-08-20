// ============================================================
// PLAYER STORE — Estado global do player (Zustand)
// ============================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  PlayerState,
  PlayerSource,
  QueueItem,
  AudioTrack,
  SpotifyPlayerTrack,
  SpotifySavedItem,
  YouTubeVideo,
  TikTokVideo,
} from '@/types'

interface PlayerActions {
  // Source
  setSource: (source: PlayerSource) => void

  // Playback state
  setIsPlaying: (isPlaying: boolean) => void
  togglePlay: () => void

  // Volume
  setVolume: (volume: number) => void
  toggleMute: () => void

  // Progress
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void

  // Shuffle & Repeat
  toggleShuffle: () => void
  cycleRepeat: () => void

  // Direct Audio Track (HTML5 player)
  setAudioTrack: (track: AudioTrack | null) => void
  playAudioTrack: (track: AudioTrack) => void

  // Spotify
  setSpotifyTrack: (track: SpotifyPlayerTrack | null) => void
  setSpotifyDeviceId: (deviceId: string | null) => void
  setSpotifySavedItem: (item: SpotifySavedItem | null) => void
  playSpotifySavedItem: (item: SpotifySavedItem) => void

  // YouTube
  setYouTubeVideo: (video: YouTubeVideo | null) => void
  playYouTubeVideo: (video: YouTubeVideo) => void

  // TikTok
  setTikTokVideo: (video: TikTokVideo | null) => void
  playTikTokVideo: (video: TikTokVideo) => void

  // Queue
  setQueue: (items: QueueItem[], startIndex?: number) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  nextInQueue: () => QueueItem | null
  prevInQueue: () => QueueItem | null
  playQueueItem: (index: number) => void

  // Reset
  reset: () => void
}

const initialState: PlayerState = {
  source: null,
  isPlaying: false,
  volume: 80,
  isMuted: false,
  progress: 0,
  duration: 0,
  currentTime: 0,
  isShuffled: false,
  repeatMode: 'none',
  audioTrack: null,
  spotifyTrack: null,
  spotifyDeviceId: null,
  spotifySavedItem: null,
  youtubeVideo: null,
  tiktokVideo: null,
  queue: [],
  queueIndex: 0,
}

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSource: (source) => set({ source }),

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () =>
        set((s) => ({
          isMuted: !s.isMuted,
          volume: s.isMuted ? (s.volume || 80) : s.volume,
        })),

      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setCurrentTime: (currentTime) => set({ currentTime }),

      toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),
      cycleRepeat: () =>
        set((s) => ({
          repeatMode:
            s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none',
        })),

      setAudioTrack: (audioTrack) => set({ audioTrack }),
      playAudioTrack: (track) =>
        set({
          source: 'audio',
          audioTrack: track,
          spotifyTrack: null,
          spotifySavedItem: null,
          youtubeVideo: null,
          tiktokVideo: null,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
          duration: track.durationMs ? track.durationMs / 1000 : 0,
        }),

      setSpotifyTrack: (spotifyTrack) => set({ spotifyTrack }),
      setSpotifyDeviceId: (spotifyDeviceId) => set({ spotifyDeviceId }),
      setSpotifySavedItem: (spotifySavedItem) => set({ spotifySavedItem }),
      playSpotifySavedItem: (item) =>
        set({
          source: 'spotify',
          spotifySavedItem: item,
          audioTrack: null,
          youtubeVideo: null,
          tiktokVideo: null,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        }),

      setYouTubeVideo: (youtubeVideo) => set({ youtubeVideo }),
      playYouTubeVideo: (video) =>
        set({
          source: 'youtube',
          youtubeVideo: video,
          audioTrack: null,
          spotifyTrack: null,
          spotifySavedItem: null,
          tiktokVideo: null,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        }),

      setTikTokVideo: (tiktokVideo) => set({ tiktokVideo }),
      playTikTokVideo: (video) =>
        set({
          source: 'tiktok',
          tiktokVideo: video,
          audioTrack: null,
          spotifyTrack: null,
          spotifySavedItem: null,
          youtubeVideo: null,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        }),

      setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),
      addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
      clearQueue: () => set({ queue: [], queueIndex: 0 }),

      nextInQueue: () => {
        const { queue, queueIndex, isShuffled, repeatMode } = get()
        if (queue.length === 0) return null

        if (repeatMode === 'one') {
          return queue[queueIndex]
        }

        let nextIndex: number
        if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else {
          nextIndex = queueIndex + 1
          if (nextIndex >= queue.length) {
            if (repeatMode === 'all') nextIndex = 0
            else return null
          }
        }

        set({ queueIndex: nextIndex })
        return queue[nextIndex]
      },

      prevInQueue: () => {
        const { queue, queueIndex } = get()
        if (queue.length === 0) return null

        const prevIndex = Math.max(0, queueIndex - 1)
        set({ queueIndex: prevIndex })
        return queue[prevIndex]
      },

      playQueueItem: (index) => {
        const { queue } = get()
        if (index < 0 || index >= queue.length) return
        set({ queueIndex: index })
      },

      reset: () => set(initialState),
    }),
    { name: 'PlayerStore' }
  )
)
