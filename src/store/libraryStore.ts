// ============================================================
// LIBRARY STORE — Biblioteca de Playlists Personalizadas & Importadas
// Suporta Reordenação, Edição Completa, Duplicação e Customização
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CustomPlaylist,
  PlaylistItem,
  SpotifySavedItem,
  YouTubeVideo,
  YouTubePlaylist,
  TikTokVideo,
  TikTokPlaylist,
} from '@/types'

interface LibraryState {
  // Playlists Personalizadas & Importadas
  customPlaylists: CustomPlaylist[]

  // Spotify (via URL sem login)
  spotifyItems: SpotifySavedItem[]

  // YouTube
  youtubeVideos: YouTubeVideo[]
  youtubePlaylists: YouTubePlaylist[]

  // TikTok
  tiktokVideos: TikTokVideo[]
  tiktokPlaylists: TikTokPlaylist[]
}

interface LibraryActions {
  // Custom Playlists (Criação, Edição & Reordenação)
  createCustomPlaylist: (name: string, description?: string, coverUrl?: string) => CustomPlaylist
  addCustomPlaylist: (playlist: CustomPlaylist) => void
  deleteCustomPlaylist: (id: string) => void
  renameCustomPlaylist: (id: string, name: string, description?: string) => void
  updateCustomPlaylist: (id: string, updates: Partial<CustomPlaylist>) => void
  duplicateCustomPlaylist: (id: string) => CustomPlaylist | null
  addItemToCustomPlaylist: (playlistId: string, item: PlaylistItem) => void
  removeItemFromCustomPlaylist: (playlistId: string, itemId: string) => void
  movePlaylistItem: (playlistId: string, itemId: string, direction: 'up' | 'down') => void
  reorderPlaylistItems: (playlistId: string, fromIndex: number, toIndex: number) => void
  reversePlaylistOrder: (playlistId: string) => void
  sortPlaylist: (playlistId: string, by: 'title' | 'artist' | 'date') => void

  // Spotify Items
  addSpotifyItem: (item: SpotifySavedItem) => void
  removeSpotifyItem: (id: string) => void
  hasSpotifyItem: (spotifyId: string) => boolean

  // YouTube Videos
  addYouTubeVideo: (video: YouTubeVideo) => void
  removeYouTubeVideo: (id: string) => void
  hasYouTubeVideo: (videoId: string) => boolean

  // YouTube Playlists
  createYouTubePlaylist: (name: string) => YouTubePlaylist
  deleteYouTubePlaylist: (id: string) => void
  renameYouTubePlaylist: (id: string, name: string) => void
  addVideoToYouTubePlaylist: (playlistId: string, video: YouTubeVideo) => void
  removeVideoFromYouTubePlaylist: (playlistId: string, videoId: string) => void

  // TikTok Videos
  addTikTokVideo: (video: TikTokVideo) => void
  removeTikTokVideo: (id: string) => void
  hasTikTokVideo: (postId: string) => boolean

  // TikTok Playlists
  createTikTokPlaylist: (name: string) => TikTokPlaylist
  deleteTikTokPlaylist: (id: string) => void
  renameTikTokPlaylist: (id: string, name: string) => void
  addVideoToTikTokPlaylist: (playlistId: string, video: TikTokVideo) => void
  removeVideoFromTikTokPlaylist: (playlistId: string, videoId: string) => void
}

export const useLibraryStore = create<LibraryState & LibraryActions>()(
  persist(
    (set, get) => ({
      // Initial state
      customPlaylists: [],
      spotifyItems: [],
      youtubeVideos: [],
      youtubePlaylists: [],
      tiktokVideos: [],
      tiktokPlaylists: [],

      // ─── Custom Playlists (Criação, Edição & Reordenação) ──────────
      createCustomPlaylist: (name, description, coverUrl) => {
        const playlist: CustomPlaylist = {
          id: crypto.randomUUID(),
          name,
          description: description || '',
          coverUrl: coverUrl || '',
          importedFrom: 'manual',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ customPlaylists: [playlist, ...s.customPlaylists] }))
        return playlist
      },

      addCustomPlaylist: (playlist) =>
        set((s) => ({
          customPlaylists: [
            playlist,
            ...s.customPlaylists.filter((p) => p.id !== playlist.id && p.name !== playlist.name),
          ],
        })),

      deleteCustomPlaylist: (id) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.filter((p) => p.id !== id),
        })),

      renameCustomPlaylist: (id, name, description) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name,
                  description: description !== undefined ? description : p.description,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      updateCustomPlaylist: (id, updates) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      duplicateCustomPlaylist: (id) => {
        const target = get().customPlaylists.find((p) => p.id === id)
        if (!target) return null
        const clone: CustomPlaylist = {
          ...target,
          id: crypto.randomUUID(),
          name: `${target.name} (Cópia)`,
          items: target.items.map((i) => ({ ...i, id: crypto.randomUUID() })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ customPlaylists: [clone, ...s.customPlaylists] }))
        return clone
      },

      addItemToCustomPlaylist: (playlistId, item) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  coverUrl: p.coverUrl || item.imageUrl,
                  items: [...p.items.filter((i) => i.id !== item.id), item],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      removeItemFromCustomPlaylist: (playlistId, itemId) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  items: p.items.filter((i) => i.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      movePlaylistItem: (playlistId, itemId, direction) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) => {
            if (p.id !== playlistId) return p
            const idx = p.items.findIndex((i) => i.id === itemId)
            if (idx === -1) return p

            const newIndex = direction === 'up' ? idx - 1 : idx + 1
            if (newIndex < 0 || newIndex >= p.items.length) return p

            const newItems = [...p.items]
            const [moved] = newItems.splice(idx, 1)
            newItems.splice(newIndex, 0, moved)

            return {
              ...p,
              items: newItems,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      reorderPlaylistItems: (playlistId, fromIndex, toIndex) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) => {
            if (p.id !== playlistId) return p
            if (
              fromIndex < 0 ||
              fromIndex >= p.items.length ||
              toIndex < 0 ||
              toIndex >= p.items.length
            ) {
              return p
            }

            const newItems = [...p.items]
            const [moved] = newItems.splice(fromIndex, 1)
            newItems.splice(toIndex, 0, moved)

            return {
              ...p,
              items: newItems,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      reversePlaylistOrder: (playlistId) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  items: [...p.items].reverse(),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      sortPlaylist: (playlistId, by) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) => {
            if (p.id !== playlistId) return p
            const sorted = [...p.items].sort((a, b) => {
              if (by === 'title') return a.title.localeCompare(b.title)
              if (by === 'artist') return a.subtitle.localeCompare(b.subtitle)
              if (by === 'date') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
              return 0
            })
            return {
              ...p,
              items: sorted,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ─── Spotify Items ────────────────────────────────────
      addSpotifyItem: (item) =>
        set((s) => ({
          spotifyItems: s.hasSpotifyItem(item.spotifyId)
            ? s.spotifyItems
            : [item, ...s.spotifyItems],
        })),

      removeSpotifyItem: (id) =>
        set((s) => ({ spotifyItems: s.spotifyItems.filter((i) => i.id !== id) })),

      hasSpotifyItem: (spotifyId) =>
        get().spotifyItems.some((i) => i.spotifyId === spotifyId),

      // ─── YouTube Videos ───────────────────────────────────
      addYouTubeVideo: (video) =>
        set((s) => ({
          youtubeVideos: s.hasYouTubeVideo(video.videoId)
            ? s.youtubeVideos
            : [video, ...s.youtubeVideos],
        })),

      removeYouTubeVideo: (id) =>
        set((s) => ({ youtubeVideos: s.youtubeVideos.filter((v) => v.id !== id) })),

      hasYouTubeVideo: (videoId) =>
        get().youtubeVideos.some((v) => v.videoId === videoId),

      // ─── YouTube Playlists ────────────────────────────────
      createYouTubePlaylist: (name) => {
        const pl: YouTubePlaylist = {
          id: crypto.randomUUID(),
          name,
          videos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ youtubePlaylists: [pl, ...s.youtubePlaylists] }))
        return pl
      },

      deleteYouTubePlaylist: (id) =>
        set((s) => ({
          youtubePlaylists: s.youtubePlaylists.filter((p) => p.id !== id),
        })),

      renameYouTubePlaylist: (id, name) =>
        set((s) => ({
          youtubePlaylists: s.youtubePlaylists.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        })),

      addVideoToYouTubePlaylist: (playlistId, video) =>
        set((s) => ({
          youtubePlaylists: s.youtubePlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  videos: [...p.videos.filter((v) => v.id !== video.id), video],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      removeVideoFromYouTubePlaylist: (playlistId, videoId) =>
        set((s) => ({
          youtubePlaylists: s.youtubePlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  videos: p.videos.filter((v) => v.id !== videoId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      // ─── TikTok Videos ────────────────────────────────────
      addTikTokVideo: (video) =>
        set((s) => ({
          tiktokVideos: s.hasTikTokVideo(video.postId)
            ? s.tiktokVideos
            : [video, ...s.tiktokVideos],
        })),

      removeTikTokVideo: (id) =>
        set((s) => ({ tiktokVideos: s.tiktokVideos.filter((v) => v.id !== id) })),

      hasTikTokVideo: (postId) =>
        get().tiktokVideos.some((v) => v.postId === postId),

      // ─── TikTok Playlists ─────────────────────────────────
      createTikTokPlaylist: (name) => {
        const pl: TikTokPlaylist = {
          id: crypto.randomUUID(),
          name,
          videos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ tiktokPlaylists: [pl, ...s.tiktokPlaylists] }))
        return pl
      },

      deleteTikTokPlaylist: (id) =>
        set((s) => ({
          tiktokPlaylists: s.tiktokPlaylists.filter((p) => p.id !== id),
        })),

      renameTikTokPlaylist: (id, name) =>
        set((s) => ({
          tiktokPlaylists: s.tiktokPlaylists.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        })),

      addVideoToTikTokPlaylist: (playlistId, video) =>
        set((s) => ({
          tiktokPlaylists: s.tiktokPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  videos: [...p.videos.filter((v) => v.id !== video.id), video],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      removeVideoFromTikTokPlaylist: (playlistId, videoId) =>
        set((s) => ({
          tiktokPlaylists: s.tiktokPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  videos: p.videos.filter((v) => v.id !== videoId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
    }),
    {
      name: 'johnmusic-library-v4',
    }
  )
)
