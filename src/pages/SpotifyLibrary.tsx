// ============================================================
// SPOTIFY LIBRARY — Página do Spotify com iFrame API Player
// Player oficial do Spotify integrado com controle total
// ============================================================

import { useState, useCallback, useRef } from 'react'
import {
  Music2,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Pause,
  SkipBack,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { CURATED_PUBLIC_SPOTIFY } from '@/api/spotifyUrlService'
import { SpotifyInput } from '@/components/spotify/SpotifyInput'
import { SpotifyIFramePlayer } from '@/components/spotify/SpotifyIFramePlayer'
import { useSpotifyIFrameController } from '@/hooks/useSpotifyIFrameController'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { getClientCredentialsToken } from '@/api/spotifyAuth'
import { cn } from '@/lib/utils'
import type { SpotifySavedItem } from '@/types'

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
  const { spotifySavedItem, playSpotifySavedItem } = usePlayerStore()
  const { spotifyItems, removeSpotifyItem } = useLibraryStore()
  const { setController, togglePlay, controllerRef } = useSpotifyIFrameController()

  const [activeItem, setActiveItem] = useState<SpotifySavedItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
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

  const handlePlayItem = useCallback((item: SpotifySavedItem) => {
    setActiveItem(item)
    setIsPlaying(false)
    // também atualiza o playerStore para o PlayerBar
    playSpotifySavedItem(item)
  }, [playSpotifySavedItem])

  const handlePlaybackUpdate = useCallback((isPaused: boolean) => {
    setIsPlaying(!isPaused)
  }, [])

  const handleControllerReady = useCallback((controller: Parameters<typeof setController>[0]) => {
    setController(controller)
    setIsPlaying(true)
  }, [setController])

  const currentItem = activeItem || spotifySavedItem
  const embedUri = currentItem
    ? `spotify:${currentItem.type}:${currentItem.spotifyId}`
    : undefined

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Music2 size={34} className="text-spotify-green" />
            <span>Spotify</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Pesquise e ouça músicas e playlists do Spotify
          </p>
        </div>
      </div>

      {/* ─── Player Principal ─── */}
      {currentItem && (
        <section className="p-6 rounded-3xl bg-gradient-to-b from-spotify-green/10 to-black/50 border border-spotify-green/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentItem.thumbnailUrl && (
                <img
                  src={currentItem.thumbnailUrl}
                  alt={currentItem.title}
                  className="w-12 h-12 rounded-lg object-cover shadow-lg"
                />
              )}
              <div>
                <p className="text-white font-bold text-sm truncate max-w-xs">{currentItem.title}</p>
                <p className="text-white/50 text-xs truncate">{currentItem.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => controllerRef.current?.seek(0)}
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                title="Reiniciar"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => {
                  togglePlay()
                  setIsPlaying(!isPlaying)
                }}
                className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
              </button>
              <a
                href={currentItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white/40 hover:text-spotify-green hover:bg-spotify-green/10 transition-all"
                title="Abrir no Spotify"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* iFrame API Player */}
          <div className="rounded-xl overflow-hidden">
            <SpotifyIFramePlayer
              key={currentItem.spotifyId}
              spotifyUri={embedUri}
              height={currentItem.type === 'track' ? 152 : 380}
              onPlaybackUpdate={handlePlaybackUpdate}
              onReady={handleControllerReady}
            />
          </div>
        </section>
      )}

      {/* ─── Pesquisar no Spotify ─── */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Pesquisar músicas ou playlists no Spotify..."
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
              Resultados ({searchResults.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((item) => {
                const isActive = currentItem?.spotifyId === item.spotifyId
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePlayItem(item)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl text-left transition-all border group',
                      isActive
                        ? 'bg-spotify-green/10 border-spotify-green/40'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                          <Music2 size={20} className="text-spotify-green" />
                        </div>
                      )}
                      <div className={cn(
                        'absolute inset-0 rounded-lg bg-black/50 items-center justify-center',
                        isActive ? 'flex' : 'hidden group-hover:flex'
                      )}>
                        <Play size={16} className="text-spotify-green fill-spotify-green ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isActive ? 'text-spotify-green' : 'text-white')}>
                        {item.title}
                      </p>
                      <p className="text-white/40 text-xs truncate">{item.subtitle}</p>
                      <span className="text-[10px] text-white/20 uppercase">
                        {item.type === 'track' ? 'Música' : 'Playlist'}
                      </span>
                    </div>
                  </button>
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
              const isActive = currentItem?.spotifyId === item.spotifyId
              return (
                <div
                  key={item.id}
                  className={cn(
                    'group p-3 rounded-2xl transition-all border flex flex-col justify-between',
                    isActive
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

                  <div className="mt-3 space-y-0.5">
                    <p
                      onClick={() => handlePlayItem(item)}
                      className="text-white text-xs font-semibold truncate hover:underline cursor-pointer"
                    >
                      {item.title}
                    </p>
                    <p className="text-white/40 text-[10px] truncate">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                    <span className="text-[9px] text-white/30">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </span>
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

      {/* ─── Coleções Oficiais ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Music2 size={20} className="text-spotify-green" />
            <span>Coleções Oficiais do Spotify</span>
          </h2>
          <p className="text-white/40 text-xs mt-0.5">Clique para ouvir diretamente</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CURATED_PUBLIC_SPOTIFY.map((item) => {
            const isActive = currentItem?.spotifyId === item.spotifyId
            return (
              <div
                key={item.id}
                onClick={() => handlePlayItem(item)}
                className={cn(
                  'group p-3 rounded-2xl transition-all cursor-pointer border space-y-2 flex flex-col justify-between',
                  isActive
                    ? 'border-spotify-green/50 bg-spotify-green/5'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'
                )}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                      <Play size={20} className="text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate leading-snug">{item.title}</p>
                  <p className="text-white/40 text-[11px] truncate">{item.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
