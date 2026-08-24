// ============================================================
// SPOTIFY LIBRARY — Adição e Gerenciamento 100% via Link / URL
// ============================================================

import { useState, useCallback } from 'react'
import {
  Music2,
  Sparkles,
  Plus,
  Trash2,
  Play,
  ListPlus,
} from 'lucide-react'
import { SpotifyInput } from '@/components/spotify/SpotifyInput'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, SpotifySavedItem } from '@/types'

export function SpotifyLibrary() {
  const { currentQueueItem, isPlaying, isResolving, playUniversal } = usePlayerStore()
  const { spotifyItems, removeSpotifyItem } = useLibraryStore()
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const handlePlayItem = useCallback(async (item: SpotifySavedItem) => {
    if (item.type === 'playlist') {
      try {
        const { importSpotifyPlaylist } = await import('@/api/playlistImportService')
        const pl = await importSpotifyPlaylist(item.spotifyId)
        if (pl.items.length > 0) {
          const queueItems: QueueItem[] = pl.items.map((i) => ({
            id: i.id,
            source: 'spotify',
            title: i.title,
            subtitle: i.subtitle,
            imageUrl: i.imageUrl,
            uri: i.uri,
            durationMs: i.durationMs,
          }))
          await playUniversal(queueItems, 0)
          return
        }
      } catch {
        // fallback
      }
    }

    const queueItem: QueueItem = {
      id: item.id,
      source: 'spotify',
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.thumbnailUrl,
      uri: `spotify:${item.type}:${item.spotifyId}`,
    }
    await playUniversal([queueItem], 0)
  }, [playUniversal])

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-16">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Music2 size={34} className="text-spotify-green" />
            <span>Spotify</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Adicione e toque qualquer música, álbum ou playlist do Spotify colando o link
          </p>
        </div>
      </div>

      {/* ─── URL Input ─── */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-spotify-green/20 backdrop-blur-sm space-y-3 shadow-xl">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Plus size={16} className="text-spotify-green" />
          <span>Adicionar por Link do Spotify</span>
        </h2>
        <SpotifyInput />
      </div>

      {/* ─── Links Salvos ─── */}
      {spotifyItems.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            <span>Seus Links Salvos ({spotifyItems.length})</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {spotifyItems.map((item) => {
              const isCurrent =
                currentQueueItem?.title?.toLowerCase() === item.title.toLowerCase() &&
                (isPlaying || isResolving)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group p-3 rounded-2xl transition-all border flex flex-col justify-between space-y-2',
                    isCurrent
                      ? 'border-spotify-green/50 bg-spotify-green/5'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'
                  )}
                >
                  <div
                    onClick={() => handlePlayItem(item)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-black cursor-pointer shadow-md flex items-center justify-center"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Music2 size={40} className="text-spotify-green" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                        <Play size={20} className="text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p
                      onClick={() => handlePlayItem(item)}
                      className="text-white text-xs font-semibold truncate hover:underline cursor-pointer"
                    >
                      {item.title}
                    </p>
                    <p className="text-white/40 text-[10px] truncate">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() =>
                        setModalItem({
                          id: item.id,
                          source: 'spotify',
                          title: item.title,
                          subtitle: item.subtitle,
                          imageUrl: item.thumbnailUrl,
                          uri: `spotify:${item.type}:${item.spotifyId}`,
                          url: item.url,
                          addedAt: item.addedAt,
                        })
                      }
                      className="p-1 rounded-lg text-white/30 hover:text-spotify-green transition-colors"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus size={13} />
                    </button>
                    <button
                      onClick={() => removeSpotifyItem(item.id)}
                      className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 text-white/30 space-y-2">
          <Music2 size={48} className="mx-auto text-spotify-green opacity-40 mb-3" />
          <p className="text-sm font-semibold text-white/50">Nenhuma música ou playlist salva ainda</p>
          <p className="text-xs text-white/30">Cole qualquer link do Spotify no campo acima para adicionar à sua biblioteca</p>
        </div>
      )}
    </div>
  )
}
