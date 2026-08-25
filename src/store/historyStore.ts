// ============================================================
// HISTORY STORE — Histórico de Reprodução e Buscas do Usuário
// Persistido no LocalStorage para alimentador de Recomendações
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryItem, QueueItem, PlaylistItem } from '@/types'

interface HistoryState {
  history: HistoryItem[]
  recentSearches: string[]
}

interface HistoryActions {
  recordPlay: (item: QueueItem | PlaylistItem) => void
  recordSearch: (query: string) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  clearSearches: () => void
  getTopArtists: () => string[]
  getTopKeywords: () => string[]
}

export const useHistoryStore = create<HistoryState & HistoryActions>()(
  persist(
    (set, get) => ({
      history: [],
      recentSearches: [],

      recordPlay: (item) => {
        if (!item || !item.title) return

        set((state) => {
          const now = new Date().toISOString()
          const existingIndex = state.history.findIndex(
            (h) => h.title.toLowerCase() === item.title.toLowerCase() &&
                   h.subtitle.toLowerCase() === item.subtitle.toLowerCase()
          )

          let updatedHistory: HistoryItem[]
          if (existingIndex >= 0) {
            const existing = state.history[existingIndex]
            const updatedItem: HistoryItem = {
              ...existing,
              playedAt: now,
              playCount: (existing.playCount || 1) + 1,
              imageUrl: item.imageUrl || existing.imageUrl,
              videoId: (item as any).videoId || existing.videoId,
            }
            updatedHistory = [
              updatedItem,
              ...state.history.filter((_, idx) => idx !== existingIndex),
            ]
          } else {
            const newItem: HistoryItem = {
              id: item.id || crypto.randomUUID(),
              source: item.source,
              title: item.title,
              subtitle: item.subtitle || '',
              imageUrl: item.imageUrl || '',
              videoId: (item as any).videoId,
              audioUrl: (item as any).audioUrl,
              playedAt: now,
              playCount: 1,
            }
            updatedHistory = [newItem, ...state.history]
          }

          // Mantém no máximo os 100 itens mais recentes
          return { history: updatedHistory.slice(0, 100) }
        })
      },

      recordSearch: (rawQuery) => {
        const query = rawQuery.trim()
        if (!query || query.length < 2) return

        // Não salva URLs brutas como buscas textuais
        if (query.startsWith('http://') || query.startsWith('https://')) return

        set((state) => {
          const filtered = state.recentSearches.filter(
            (q) => q.toLowerCase() !== query.toLowerCase()
          )
          return {
            recentSearches: [query, ...filtered].slice(0, 30),
          }
        })
      },

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      clearSearches: () => set({ recentSearches: [] }),

      getTopArtists: () => {
        const { history } = get()
        const artistCounts: Record<string, number> = {}

        for (const item of history) {
          if (!item.subtitle) continue
          // Separa múltiplos artistas se houver ", " ou " feat "
          const cleanSubtitle = item.subtitle.replace(/ - Topic/i, '').replace(/VEVO/i, '').trim()
          const artists = cleanSubtitle.split(/,|&|feat\.|ft\./i).map((a) => a.trim()).filter(Boolean)

          for (const artist of artists) {
            if (artist.length > 1) {
              artistCounts[artist] = (artistCounts[artist] || 0) + (item.playCount || 1)
            }
          }
        }

        return Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([artist]) => artist)
          .slice(0, 10)
      },

      getTopKeywords: () => {
        const { recentSearches, history } = get()
        const keywords = new Set<string>()

        // 1. Termos de busca recentes
        recentSearches.slice(0, 8).forEach((q) => keywords.add(q))

        // 2. Artistas do histórico
        history.slice(0, 12).forEach((h) => {
          if (h.subtitle) {
            const clean = h.subtitle.replace(/ - Topic/i, '').trim()
            keywords.add(clean)
          }
        })

        return Array.from(keywords)
      },
    }),
    {
      name: 'johnmusic-history',
    }
  )
)
