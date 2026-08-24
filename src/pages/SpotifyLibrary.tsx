import { useState, useCallback, useRef } from 'react'
import {
  Music2,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Search,
  Loader2,
  ListPlus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SpotifyInput } from '@/components/spotify/SpotifyInput'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { getClientCredentialsToken } from '@/api/spotifyAuth'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, SpotifySavedItem } from '@/types'

// Buscar no Spotify via Client Credentials
async function searchSpotifyTracks(query: string): Promise<SpotifySavedItem[]> {
  const token = await getClientCredentialsToken()
  if (!token || !query.trim()) return []

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()

  const tracks: SpotifySavedItem[] = (data.tracks?.items || []).map((t: {
    id: string
    name: string
    artists: { name: string }[]
    album: { images: { url: string }[] }
    external_urls: { spotify: string }
  }) => ({
    id: t.id,
    type: 'track' as const,
    spotifyId: t.id,
    title: t.name,
    subtitle: t.artists.map((a) => a.name).join(', '),
    thumbnailUrl: t.album.images[0]?.url || '',
    url: t.external_urls.spotify,
    embedUrl: `https://open.spotify.com/embed/track/${t.id}?utm_source=generator&theme=0`,
    addedAt: new Date().toISOString(),
  }))

  const playlists: SpotifySavedItem[] = (data.playlists?.items || []).map((p: {
    id: string
    name: string
    owner: { display_name: string }
    images: { url: string }[]
    external_urls: { spotify: string }
  }) => ({
    id: p.id,
    type: 'playlist' as const,
    spotifyId: p.id,
    title: p.name,
    subtitle: p.owner?.display_name || 'Playlist',
    thumbnailUrl: p.images?.[0]?.url || '',
    url: p.external_urls.spotify,
    embedUrl: `https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0`,
    addedAt: new Date().toISOString(),
  }))

  return [...tracks, ...playlists]
}

export function SpotifyLibrary() {
  const { currentQueueItem, isPlaying, isResolving, playUniversal } = usePlayerStore()
  const { spotifyItems, removeSpotifyItem } = useLibraryStore()
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val.trim()), 400)
  }

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['spotify', 'search', debouncedSearch],
    queryFn: () => searchSpotifyTracks(debouncedSearch),
    enabled: debouncedSearch.length > 1,
  })

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
            Pesquise e ouça faixas e playlists do Spotify direto no player unificado
          </p>
        </div>
      </div>

      {/* ─── Pesquisar no Spotify ─── */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Pesquisar músicas ou playlists no catálogo do Spotify..."
            className="w-full bg-white/[0.06] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 transition-all"
          />
          {isSearching && (
            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-green animate-spin" />
          )}
        </div>

        {/* Resultados da Busca */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Resultados da Busca ({searchResults.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((item) => {
                const isCurrent =
                  currentQueueItem?.title?.toLowerCase() === item.title.toLowerCase() &&
                  (isPlaying || isResolving)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-2xl transition-all border group',
                      isCurrent
                        ? 'bg-spotify-green/10 border-spotify-green/40'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'
                    )}
                  >
                    <div
                      onClick={() => handlePlayItem(item)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <Music2 size={20} className="text-spotify-green" />
                          </div>
                        )}
                        <div className={cn(
                          'absolute inset-0 rounded-xl bg-black/50 items-center justify-center',
                          isCurrent ? 'flex' : 'hidden group-hover:flex'
                        )}>
                          {isCurrent && isResolving ? (
                            <Loader2 size={16} className="text-spotify-green animate-spin" />
                          ) : (
                            <Play size={16} className="text-spotify-green fill-spotify-green ml-0.5" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-bold truncate', isCurrent ? 'text-spotify-green' : 'text-white')}>
                          {item.title}
                        </p>
                        <p className="text-white/40 text-xs truncate">{item.subtitle}</p>
                      </div>
                    </div>

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
                          addedAt: new Date().toISOString(),
                        })
                      }
                      className="p-2 rounded-xl text-white/40 hover:text-spotify-green hover:bg-white/10 transition-colors"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
      {spotifyItems.length > 0 && (
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
      )}
    </div>
  )
}
