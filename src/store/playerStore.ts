// ============================================================
// PLAYER STORE — Estado global do player unificado (Zustand)
// Suporte contínuo para Spotify, YouTube, TikTok e Áudio Direto
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

export interface ExtendedPlayerState extends PlayerState {
  currentQueueItem: QueueItem | null
  isResolving: boolean
}

export interface PlayerActions {
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

  // Queue & Universal Playback
  setQueue: (items: QueueItem[], startIndex?: number) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  playQueueIndex: (index: number) => Promise<void>
  playNext: () => Promise<void>
  playPrev: () => Promise<void>
  nextInQueue: () => QueueItem | null
  prevInQueue: () => QueueItem | null

  // Universal playback across all platforms
  playUniversal: (items: QueueItem[], startIndex?: number) => Promise<void>

  // Reset
  reset: () => void
}

const initialState: ExtendedPlayerState = {
  source: null,
  isPlaying: false,
  volume: 50,
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
  currentQueueItem: null,
  isResolving: false,
}

export const usePlayerStore = create<ExtendedPlayerState & PlayerActions>()(
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
          currentQueueItem: {
            id: track.id,
            source: 'audio',
            title: track.title,
            subtitle: track.artist,
            imageUrl: track.artworkUrl,
            audioUrl: track.audioUrl,
            durationMs: track.durationMs,
          },
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
      playSpotifySavedItem: (item) => {
        const queueItem: QueueItem = {
          id: item.id,
          source: 'spotify',
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.thumbnailUrl,
          uri: `spotify:${item.type}:${item.spotifyId}`,
          durationMs: 0,
        }
        get().playUniversal([queueItem], 0)
      },

      setYouTubeVideo: (youtubeVideo) => set({ youtubeVideo }),
      playYouTubeVideo: (video) =>
        set({
          source: 'youtube',
          youtubeVideo: video,
          currentQueueItem: {
            id: video.id,
            source: 'youtube',
            title: video.title,
            subtitle: video.channelTitle,
            imageUrl: video.thumbnailUrl,
            videoId: video.videoId,
          },
          audioTrack: null,
          spotifyTrack: null,
          spotifySavedItem: null,
          tiktokVideo: null,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        }),

      setTikTokVideo: (tiktokVideo) => set({ tiktokVideo }),
      playTikTokVideo: (video) => {
        const queueItem: QueueItem = {
          id: video.id,
          source: 'tiktok',
          title: video.soundTitle || video.title || 'TikTok Music',
          subtitle: video.soundAuthor || `@${video.authorName}`,
          imageUrl: video.thumbnailUrl,
          audioUrl: video.audioUrl,
          tiktokPostId: video.postId,
          tiktokUrl: video.url,
          durationMs: (video.durationSeconds || 30) * 1000,
        }
        get().playUniversal([queueItem], 0)
      },

      setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),
      addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
      clearQueue: () => set({ queue: [], queueIndex: 0, currentQueueItem: null }),

      // ─── Play Queue Index ───────────────────────────────────
      playQueueIndex: async (index: number) => {
        const { queue } = get()
        if (index < 0 || index >= queue.length) return

        const targetItem = queue[index]
        if (!targetItem) return

        set({ queueIndex: index, isResolving: true })

        // 1. Se já possui áudio direto (ex: MP3 extraído do TikTok ou áudio preview)
        if (targetItem.audioUrl) {
          set({
            source: 'audio',
            currentQueueItem: targetItem,
            audioTrack: {
              id: targetItem.id,
              title: targetItem.title,
              artist: targetItem.subtitle,
              artworkUrl: targetItem.imageUrl,
              audioUrl: targetItem.audioUrl,
              durationMs: targetItem.durationMs,
            },
            youtubeVideo: null,
            spotifySavedItem: null,
            tiktokVideo: null,
            isPlaying: true,
            isResolving: false,
          })
          return
        }

        // 2. Se for um link do TikTok sem áudio direto ainda, tenta extrair o MP3 na hora
        if (targetItem.source === 'tiktok' && (targetItem.tiktokUrl || targetItem.tiktokPostId)) {
          try {
            const { extractTikTokAudioAndMetadata } = await import('@/api/tiktokService')
            const urlToUse = targetItem.tiktokUrl || `https://www.tiktok.com/@user/video/${targetItem.tiktokPostId}`
            const data = await extractTikTokAudioAndMetadata(urlToUse)
            if (data.audioUrl) {
              const updatedQueue = [...queue]
              updatedQueue[index] = {
                ...targetItem,
                title: data.soundTitle || targetItem.title,
                subtitle: data.soundAuthor || targetItem.subtitle,
                audioUrl: data.audioUrl,
                imageUrl: data.thumbnailUrl || targetItem.imageUrl,
                durationMs: data.durationSeconds * 1000,
              }
              set({
                queue: updatedQueue,
                source: 'audio',
                currentQueueItem: updatedQueue[index],
                audioTrack: {
                  id: targetItem.id,
                  title: data.soundTitle || targetItem.title,
                  artist: data.soundAuthor || targetItem.subtitle,
                  artworkUrl: data.thumbnailUrl || targetItem.imageUrl,
                  audioUrl: data.audioUrl,
                  durationMs: data.durationSeconds * 1000,
                },
                youtubeVideo: null,
                isPlaying: true,
                isResolving: false,
              })
              return
            }
          } catch {
            // segue para conversão via busca
          }
        }

        // 3. Se já possui videoId do YouTube
        if (targetItem.videoId) {
          set({
            source: 'youtube',
            currentQueueItem: targetItem,
            youtubeVideo: {
              id: targetItem.id,
              videoId: targetItem.videoId,
              title: targetItem.title,
              channelTitle: targetItem.subtitle,
              thumbnailUrl: targetItem.imageUrl,
              url: `https://www.youtube.com/watch?v=${targetItem.videoId}`,
              addedAt: new Date().toISOString(),
            },
            audioTrack: null,
            spotifySavedItem: null,
            tiktokVideo: null,
            isPlaying: true,
            isResolving: false,
          })
          return
        }

        // 4. Resolver via motor de conversão cruzada para áudio do YouTube
        try {
          const { resolvePlayable } = await import('@/api/crossPlatformService')
          const resolved = await resolvePlayable(targetItem)

          if (resolved?.videoId) {
            const updatedQueue = [...queue]
            updatedQueue[index] = {
              ...targetItem,
              videoId: resolved.videoId,
            }

            set({
              queue: updatedQueue,
              source: 'youtube',
              currentQueueItem: targetItem,
              youtubeVideo: {
                id: targetItem.id,
                videoId: resolved.videoId,
                title: targetItem.title,
                channelTitle: targetItem.subtitle,
                thumbnailUrl: targetItem.imageUrl || resolved.thumbnailUrl,
                url: `https://www.youtube.com/watch?v=${resolved.videoId}`,
                addedAt: new Date().toISOString(),
              },
              audioTrack: null,
              isPlaying: true,
              isResolving: false,
            })
          } else {
            set({ isPlaying: false, isResolving: false })
          }
        } catch {
          set({ isPlaying: false, isResolving: false })
        }
      },

      // ─── Next / Prev com Reprodução Automática Unificada ─────
      playNext: async () => {
        const { queue, queueIndex, isShuffled, repeatMode, playQueueIndex } = get()
        if (queue.length === 0) return

        if (repeatMode === 'one') {
          await playQueueIndex(queueIndex)
          return
        }

        let nextIndex: number
        if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else {
          nextIndex = queueIndex + 1
          if (nextIndex >= queue.length) {
            if (repeatMode === 'all') {
              nextIndex = 0
            } else {
              set({ isPlaying: false })
              return
            }
          }
        }

        await playQueueIndex(nextIndex)
      },

      playPrev: async () => {
        const { queue, queueIndex, playQueueIndex } = get()
        if (queue.length === 0) return

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
        await playQueueIndex(prevIndex)
      },

      nextInQueue: () => {
        const { queue, queueIndex, isShuffled, repeatMode } = get()
        if (queue.length === 0) return null

        if (repeatMode === 'one') return queue[queueIndex]

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

      // ─── Universal Playback ─────────────────────────────────
      playUniversal: async (items: QueueItem[], startIndex = 0) => {
        const queue = [...items]
        set({ queue, queueIndex: startIndex })
        await get().playQueueIndex(startIndex)
      },

      reset: () => set(initialState),
    }),
    { name: 'PlayerStore' }
  )
)
