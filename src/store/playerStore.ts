// ============================================================
// PLAYER STORE — Estado global do player unificado (Zustand)
// Suporte contínuo para Spotify, YouTube, TikTok e Áudio Direto
// ============================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useHistoryStore } from '@/store/historyStore'
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

  // Transição Mágica (Dual-Deck DJ Automix + S-Curve Crossfade + Pre-buffer)
  togglePerfectTransition: () => void
  setPerfectTransition: (active: boolean) => void
  setIsCrossfading: (isCrossfading: boolean) => void
  preResolveNextTrack: () => Promise<void>

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
  updateQueueItem: (index: number, updates: Partial<QueueItem>) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  playQueueIndex: (index: number) => Promise<void>
  playNext: () => Promise<void>
  playPrev: () => Promise<void>
  nextInQueue: () => QueueItem | null
  prevInQueue: () => QueueItem | null
  getNextTrackIndex: () => number | null
  getNextTrack: () => QueueItem | null
  getPrevTrackIndex: () => number | null
  getPrevTrack: () => QueueItem | null
  getUpcomingQueue: () => QueueItem[]

  // Universal playback across all platforms
  playUniversal: (items: QueueItem[], startIndex?: number) => Promise<void>

  // Reset
  reset: () => void
}

function generateShuffleOrder(length: number, currentIndex: number): number[] {
  if (length <= 1) return [0]
  const indices = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex)
  // Algoritmo Fisher-Yates para embaralhamento perfeito e determinístico
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return [currentIndex, ...indices]
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
  perfectTransition: typeof window !== 'undefined' ? localStorage.getItem('jm_perfect_transition') !== 'false' : true,
  audioTrack: null,
  spotifyTrack: null,
  spotifyDeviceId: null,
  spotifySavedItem: null,
  youtubeVideo: null,
  tiktokVideo: null,
  queue: [],
  queueIndex: 0,
  shuffledOrder: [],
  shuffledPosition: 0,
  currentQueueItem: null,
  isResolving: false,
  isCrossfading: false,
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

      toggleShuffle: () =>
        set((s) => {
          const isShuffled = !s.isShuffled
          let shuffledOrder = s.shuffledOrder
          let shuffledPosition = 0
          if (isShuffled && s.queue.length > 0) {
            shuffledOrder = generateShuffleOrder(s.queue.length, s.queueIndex)
            shuffledPosition = 0
          }
          return { isShuffled, shuffledOrder, shuffledPosition }
        }),

      cycleRepeat: () =>
        set((s) => ({
          repeatMode:
            s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none',
        })),

      togglePerfectTransition: () =>
        set((s) => {
          const next = !s.perfectTransition
          try {
            localStorage.setItem('jm_perfect_transition', String(next))
          } catch {}
          return { perfectTransition: next }
        }),

      setPerfectTransition: (active) => {
        try {
          localStorage.setItem('jm_perfect_transition', String(active))
        } catch {}
        set({ perfectTransition: active })
      },

      setIsCrossfading: (isCrossfading) => set({ isCrossfading }),

      preResolveNextTrack: async () => {
        const { queue, getNextTrackIndex } = get()
        if (queue.length <= 1) return

        const nextIndex = getNextTrackIndex()
        if (nextIndex === null) return

        const nextItem = queue[nextIndex]
        if (!nextItem || nextItem.videoId || nextItem.audioUrl) return

        try {
          const { resolvePlayable } = await import('@/api/crossPlatformService')
          const resolved = await resolvePlayable(nextItem)
          if (resolved?.videoId) {
            const currentQ = get().queue
            if (currentQ[nextIndex]?.id === nextItem.id) {
              const updatedQueue = [...currentQ]
              updatedQueue[nextIndex] = {
                ...nextItem,
                videoId: resolved.videoId,
              }
              set({ queue: updatedQueue })
            }
          }
        } catch {}
      },

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

      setQueue: (queue, startIndex = 0) => {
        const { isShuffled, shuffledOrder, shuffledPosition } = get()
        let newShuffledOrder = shuffledOrder
        let newShuffledPosition = shuffledPosition

        if (isShuffled && queue.length > 0) {
          if (shuffledOrder.length !== queue.length) {
            newShuffledOrder = generateShuffleOrder(queue.length, startIndex)
            newShuffledPosition = 0
          }
        } else {
          newShuffledOrder = []
          newShuffledPosition = 0
        }

        set({
          queue,
          queueIndex: startIndex,
          shuffledOrder: newShuffledOrder,
          shuffledPosition: newShuffledPosition,
        })
      },
      updateQueueItem: (index, updates) =>
        set((s) => {
          if (index < 0 || index >= s.queue.length) return {}
          const newQueue = [...s.queue]
          newQueue[index] = { ...newQueue[index], ...updates }
          return { queue: newQueue }
        }),
      addToQueue: (item) =>
        set((s) => {
          const newQueue = [...s.queue, item]
          let newShuffledOrder = s.shuffledOrder
          if (s.isShuffled) {
            newShuffledOrder = [...s.shuffledOrder, newQueue.length - 1]
          }
          return { queue: newQueue, shuffledOrder: newShuffledOrder }
        }),
      removeFromQueue: (id) =>
        set((s) => {
          const newQueue = s.queue.filter((i) => i.id !== id)
          const newShuffledOrder = s.isShuffled && newQueue.length > 0
            ? generateShuffleOrder(newQueue.length, Math.min(s.queueIndex, newQueue.length - 1))
            : []
          return { queue: newQueue, shuffledOrder: newShuffledOrder, shuffledPosition: 0 }
        }),
      clearQueue: () => set({ queue: [], queueIndex: 0, shuffledOrder: [], shuffledPosition: 0, currentQueueItem: null }),

      // ─── Play Queue Index ───────────────────────────────────
      playQueueIndex: async (index: number) => {
        const { queue, isShuffled, shuffledOrder } = get()
        if (index < 0 || index >= queue.length) return

        const targetItem = queue[index]
        if (!targetItem) return

        let newShuffledPos = 0
        let newShuffledOrder = shuffledOrder
        if (isShuffled) {
          if (shuffledOrder.length === queue.length) {
            const foundPos = shuffledOrder.indexOf(index)
            newShuffledPos = foundPos >= 0 ? foundPos : 0
          } else {
            newShuffledOrder = generateShuffleOrder(queue.length, index)
            newShuffledPos = 0
          }
        }

        set({
          queueIndex: index,
          shuffledOrder: newShuffledOrder,
          shuffledPosition: newShuffledPos,
          isResolving: true,
        })

        // Registra histórico de reprodução para recomendações inteligentes
        try {
          useHistoryStore.getState().recordPlay(targetItem)
        } catch {}

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
            // Pré-resolve a próxima música em segundo plano se a transição mágica estiver ativa
            get().preResolveNextTrack()
          } else {
            set({ isPlaying: false, isResolving: false })
          }
        } catch {
          set({ isPlaying: false, isResolving: false })
        }
      },

      // ─── Next / Prev com Reprodução Determinística ───────────
      playNext: async () => {
        const { queue, queueIndex, isShuffled, shuffledOrder, shuffledPosition, repeatMode, playQueueIndex } = get()
        if (queue.length === 0) return

        if (repeatMode === 'one') {
          await playQueueIndex(queueIndex)
          return
        }

        if (isShuffled && shuffledOrder.length === queue.length) {
          const nextPos = shuffledPosition + 1
          if (nextPos < shuffledOrder.length) {
            set({ shuffledPosition: nextPos })
            await playQueueIndex(shuffledOrder[nextPos])
            return
          }
          if (repeatMode === 'all') {
            const newOrder = generateShuffleOrder(queue.length, shuffledOrder[shuffledOrder.length - 1])
            set({ shuffledOrder: newOrder, shuffledPosition: 0 })
            await playQueueIndex(newOrder[0])
            return
          }
          set({ isPlaying: false })
          return
        }

        const nextIndex = queueIndex + 1
        if (nextIndex < queue.length) {
          await playQueueIndex(nextIndex)
        } else if (repeatMode === 'all') {
          await playQueueIndex(0)
        } else {
          set({ isPlaying: false })
        }
      },

      playPrev: async () => {
        const { queue, queueIndex, isShuffled, shuffledOrder, shuffledPosition, playQueueIndex } = get()
        if (queue.length === 0) return

        if (isShuffled && shuffledOrder.length === queue.length) {
          const prevPos = Math.max(0, shuffledPosition - 1)
          set({ shuffledPosition: prevPos })
          await playQueueIndex(shuffledOrder[prevPos])
          return
        }

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
        await playQueueIndex(prevIndex)
      },

      getNextTrackIndex: () => {
        const { queue, queueIndex, isShuffled, shuffledOrder, shuffledPosition, repeatMode } = get()
        if (queue.length === 0) return null
        if (repeatMode === 'one') return queueIndex

        if (isShuffled && shuffledOrder.length === queue.length) {
          const nextPos = shuffledPosition + 1
          if (nextPos < shuffledOrder.length) {
            return shuffledOrder[nextPos]
          }
          if (repeatMode === 'all' && shuffledOrder.length > 0) {
            return shuffledOrder[0]
          }
          return null
        }

        const nextIndex = queueIndex + 1
        if (nextIndex < queue.length) return nextIndex
        if (repeatMode === 'all') return 0
        return null
      },

      getNextTrack: () => {
        const { queue, getNextTrackIndex } = get()
        const idx = getNextTrackIndex()
        return idx !== null && idx >= 0 && idx < queue.length ? queue[idx] : null
      },

      getPrevTrackIndex: () => {
        const { queue, queueIndex, isShuffled, shuffledOrder, shuffledPosition } = get()
        if (queue.length === 0) return null

        if (isShuffled && shuffledOrder.length === queue.length) {
          const prevPos = shuffledPosition - 1
          if (prevPos >= 0 && prevPos < shuffledOrder.length) {
            return shuffledOrder[prevPos]
          }
          return shuffledOrder[shuffledOrder.length - 1]
        }

        return queueIndex > 0 ? queueIndex - 1 : queue.length - 1
      },

      getPrevTrack: () => {
        const { queue, getPrevTrackIndex } = get()
        const idx = getPrevTrackIndex()
        return idx !== null && idx >= 0 && idx < queue.length ? queue[idx] : null
      },

      getUpcomingQueue: () => {
        const { queue, queueIndex, isShuffled, shuffledOrder, shuffledPosition } = get()
        if (queue.length === 0) return []
        if (isShuffled && shuffledOrder.length === queue.length) {
          return shuffledOrder
            .slice(shuffledPosition + 1)
            .map((idx) => queue[idx])
            .filter(Boolean)
        }
        return queue.slice(queueIndex + 1)
      },

      nextInQueue: () => {
        const nextTrack = get().getNextTrack()
        const nextIdx = get().getNextTrackIndex()
        if (nextIdx !== null) set({ queueIndex: nextIdx })
        return nextTrack
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
        const isShuffled = get().isShuffled
        const shuffledOrder = isShuffled && queue.length > 0
          ? generateShuffleOrder(queue.length, startIndex)
          : []
        set({ queue, queueIndex: startIndex, shuffledOrder, shuffledPosition: 0, volume: 50, isMuted: false })
        await get().playQueueIndex(startIndex)
      },

      reset: () => set(initialState),
    }),
    { name: 'PlayerStore' }
  )
)
