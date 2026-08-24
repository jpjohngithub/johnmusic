import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search as SearchIcon,
  Music2,
  Youtube,
  Play,
  Sparkles,
  Loader2,
  Plus,
  Clock,
  ListMusic,
  Disc3,
  Layers,
  ListPlus,
  Radio,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { executeUniversalSearch, type UniversalTrackResult } from '@/api/universalSearchService'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, SpotifySavedItem } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

type SearchFilterType = 'all' | 'tracks' | 'playlists' | 'youtube' | 'tiktok'

interface SearchProps {
  isAuthenticated?: boolean
  onPlayTrack?: (track: any, index: number, contextUri?: string) => void
}

export function Search({ isAuthenticated = false }: SearchProps) {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [filterType, setFilterType] = useState<SearchFilterType>('all')
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const {
    currentQueueItem,
    isPlaying,
    isResolving,
    playUniversal,
  } = usePlayerStore()

  const { youtubeVideos, tiktokVideos, customPlaylists, addSpotifyItem } =
    useLibraryStore()

  // Preenche query da URL se existir
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      setDebouncedQuery(q)
    }
  }, [searchParams])

  // Debounce query
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    const timeout = setTimeout(() => {
      setDebouncedQuery(val.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }

  // Universal Search Query
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['universal', 'search', debouncedQuery, isAuthenticated],
    queryFn: () => executeUniversalSearch(debouncedQuery, isAuthenticated),
    enabled: debouncedQuery.length > 1,
  })

  // Local Custom Playlists match
  const matchedCustomPlaylists = debouncedQuery
    ? customPlaylists.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(debouncedQuery.toLowerCase()))
      )
    : []

  // Local YouTube matches
  const matchedYouTube = debouncedQuery
    ? youtubeVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          v.channelTitle.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : []

  // Local TikTok matches
  const matchedTikTok = debouncedQuery
    ? tiktokVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          v.authorName.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : []

  // Handle Track Click -> Toca pelo motor universal unificado
  const handleTrackClick = async (track: UniversalTrackResult, index: number) => {
    const queueItems: QueueItem[] = (searchData?.tracks || []).map((t) => ({
      id: t.id,
      source: 'spotify',
      title: t.name,
      subtitle: t.artistName,
      imageUrl: t.artworkUrl,
      audioUrl: t.previewUrl || undefined,
      uri: t.spotifyUri,
      durationMs: t.durationMs,
    }))

    if (queueItems.length > 0) {
      await playUniversal(queueItems, index)
    } else {
      const singleItem: QueueItem = {
        id: track.id,
        source: 'spotify',
        title: track.name,
        subtitle: track.artistName,
        imageUrl: track.artworkUrl,
        audioUrl: track.previewUrl || undefined,
        uri: track.spotifyUri,
        durationMs: track.durationMs,
      }
      await playUniversal([singleItem], 0)
    }
  }

  const handlePlaySavedPlaylist = async (pl: typeof customPlaylists[0]) => {
    const queueItems: QueueItem[] = pl.items.map((i) => ({
      id: i.id,
      source: i.source,
      title: i.title,
      subtitle: i.subtitle,
      imageUrl: i.imageUrl,
      audioUrl: i.url,
      uri: i.uri,
      videoId: i.videoId,
      tiktokPostId: i.tiktokPostId,
      tiktokUrl: i.url,
      durationMs: i.durationMs,
    }))
    if (queueItems.length > 0) {
      await playUniversal(queueItems, 0)
    }
  }

  const handlePlaySpotifyCatalogPlaylist = async (playlist: SpotifySavedItem) => {
    try {
      const { importSpotifyPlaylist } = await import('@/api/playlistImportService')
      const pl = await importSpotifyPlaylist(playlist.spotifyId)
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

    const queueItem: QueueItem = {
      id: playlist.id,
      source: 'spotify',
      title: playlist.title,
      subtitle: playlist.subtitle,
      imageUrl: playlist.thumbnailUrl,
      uri: `spotify:${playlist.type}:${playlist.spotifyId}`,
    }
    await playUniversal([queueItem], 0)
  }

  const showTracks = filterType === 'all' || filterType === 'tracks'
  const showPlaylists = filterType === 'all' || filterType === 'playlists'
  const showYouTube = filterType === 'all' || filterType === 'youtube'
  const showTikTok = filterType === 'all' || filterType === 'tiktok'

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-16">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Search Header */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">
          O que você quer ouvir?
        </h1>

        <div className="relative">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Digite o nome da música, playlist, artista ou cole um link..."
            className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 shadow-xl transition-all"
            autoFocus
          />
          {isLoading && (
            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-green animate-spin" />
          )}
        </div>

        {/* Filter Selection Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          {[
            { id: 'all', label: 'Tudo', icon: Layers },
            { id: 'tracks', label: 'Músicas', icon: Music2 },
            { id: 'playlists', label: 'Playlists', icon: ListMusic },
            { id: 'youtube', label: 'YouTube', icon: Youtube },
            { id: 'tiktok', label: 'TikTok', icon: Disc3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilterType(id as SearchFilterType)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                filterType === id
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      {debouncedQuery && (
        <div className="space-y-10">
          {/* Direct Spotify Link Result */}
          {searchData?.directSpotifyItem && (
            <section className="p-6 rounded-3xl bg-black/80 border border-spotify-green/40 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-spotify-green font-bold text-sm">
                  <Music2 size={18} />
                  <span>Link do Spotify Detectado: {searchData.directSpotifyItem.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handlePlaySpotifyCatalogPlaylist(searchData.directSpotifyItem!)
                    }
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-spotify-green text-black font-bold text-xs rounded-full hover:bg-green-400 transition-all shadow-md"
                  >
                    <Play size={14} className="fill-black" />
                    <span>Tocar Agora</span>
                  </button>
                  <button
                    onClick={() => addSpotifyItem(searchData.directSpotifyItem!)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 text-white font-bold text-xs rounded-full hover:bg-white/20 transition-all shadow-md"
                  >
                    <Plus size={14} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Playlists Section */}
          {showPlaylists &&
            ((searchData?.playlists && searchData.playlists.length > 0) ||
              matchedCustomPlaylists.length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <ListMusic size={22} className="text-spotify-green" />
                  <span>Playlists Encontradas</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Custom / Imported Playlists */}
                  {matchedCustomPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => handlePlaySavedPlaylist(pl)}
                      className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-spotify-green/20 space-y-2 flex flex-col justify-between"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
                        {pl.coverUrl ? (
                          <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="text-spotify-green"><Music2 size={36} /></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                            <Play size={20} className="text-black fill-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-extrabold text-spotify-green tracking-wider">Sua Playlist</span>
                        <p className="text-white text-xs font-bold truncate leading-snug">{pl.name}</p>
                        <p className="text-white/40 text-[10px] truncate">{pl.items.length} faixas</p>
                      </div>
                    </div>
                  ))}

                  {/* Spotify Catalog Playlists */}
                  {searchData?.playlists?.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => handlePlaySpotifyCatalogPlaylist(playlist)}
                      className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col justify-between"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md">
                        {playlist.thumbnailUrl ? (
                          <img
                            src={playlist.thumbnailUrl}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-spotify-green/10 text-spotify-green">
                            <Music2 size={36} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                            <Play size={20} className="text-black fill-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold truncate leading-snug">{playlist.title}</p>
                        <p className="text-white/40 text-[11px] truncate">{playlist.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Tracks Section (Músicas) */}
          {showTracks && searchData?.tracks && searchData.tracks.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Music2 size={22} className="text-spotify-green" />
                  <span>Músicas Encontradas</span>
                </h2>
                <span className="text-white/40 text-xs">{searchData.tracks.length} resultados</span>
              </div>

              {/* Table / List */}
              <div className="w-full select-none">
                <div className="grid items-center px-4 pb-2 text-white/40 text-[11px] uppercase tracking-wider border-b border-white/5"
                     style={{ gridTemplateColumns: '40px 1fr auto' }}>
                  <span className="text-center">#</span>
                  <span>Título / Artista</span>
                  <div className="flex items-center gap-2 pr-2">
                    <Clock size={14} />
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {searchData.tracks.map((track, index) => {
                    const isCurrent =
                      currentQueueItem?.title?.toLowerCase() === track.name.toLowerCase() &&
                      (isPlaying || isResolving)

                    return (
                      <div
                        key={`${track.id}-${index}`}
                        onClick={() => handleTrackClick(track, index)}
                        className={cn(
                          'group grid items-center px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 border',
                          isCurrent
                            ? 'bg-spotify-green/10 border-spotify-green/30 text-spotify-green'
                            : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/5 text-white/80 hover:text-white'
                        )}
                        style={{ gridTemplateColumns: '40px 1fr auto' }}
                      >
                        {/* Number / Play / Equalizer */}
                        <div className="flex items-center justify-center">
                          {isCurrent ? (
                            isResolving ? (
                              <Loader2 size={14} className="animate-spin text-spotify-green" />
                            ) : (
                              <div className="flex gap-0.5 items-end h-4">
                                <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '70%' }} />
                                <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '100%' }} />
                                <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '40%' }} />
                              </div>
                            )
                          ) : (
                            <>
                              <span className="text-xs font-semibold group-hover:hidden text-white/40">
                                {index + 1}
                              </span>
                              <Play size={14} className="hidden group-hover:block text-white fill-white" />
                            </>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <img
                            src={track.artworkUrl}
                            alt={track.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className={cn('text-sm font-semibold truncate', isCurrent ? 'text-spotify-green' : 'text-white')}>
                              {track.name}
                            </p>
                            <p className="text-white/40 text-xs truncate">
                              {track.artistName} {track.albumName && `• ${track.albumName}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions & Duration */}
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalItem({
                                id: track.id,
                                source: 'spotify',
                                title: track.name,
                                subtitle: track.artistName,
                                imageUrl: track.artworkUrl,
                                uri: track.spotifyUri,
                                durationMs: track.durationMs,
                                url: track.spotifyUrl,
                                addedAt: new Date().toISOString(),
                              })
                            }}
                            className="p-2 rounded-xl text-white/40 hover:text-spotify-green hover:bg-white/10 transition-colors"
                            title="Adicionar à Playlist"
                          >
                            <ListPlus size={16} />
                          </button>

                          <span className="text-white/40 text-xs font-mono w-12 text-right">
                            {formatMs(track.durationMs)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* YouTube Results in Search */}
          {showYouTube && matchedYouTube.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Youtube size={22} className="text-youtube-red" />
                <span>Vídeos do YouTube Salvos</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {matchedYouTube.map((video) => (
                  <div
                    key={video.id}
                    onClick={async () => {
                      const qItem: QueueItem = {
                        id: video.id,
                        source: 'youtube',
                        title: video.title,
                        subtitle: video.channelTitle,
                        imageUrl: video.thumbnailUrl,
                        videoId: video.videoId,
                      }
                      await playUniversal([qItem], 0)
                    }}
                    className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col justify-between"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md">
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-youtube-red flex items-center justify-center shadow-lg">
                          <Play size={18} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold truncate leading-snug">{video.title}</p>
                      <p className="text-white/40 text-[11px] truncate">{video.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TikTok Results in Search */}
          {showTikTok && matchedTikTok.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="text-tiktok-pink"><TikTokIcon /></span>
                <span>Sons do TikTok Salvos</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {matchedTikTok.map((video) => (
                  <div
                    key={video.id}
                    onClick={async () => {
                      const qItem: QueueItem = {
                        id: video.id,
                        source: 'tiktok',
                        title: video.title || 'TikTok Music',
                        subtitle: `@${video.authorName}`,
                        imageUrl: video.thumbnailUrl,
                        tiktokPostId: video.postId,
                        tiktokUrl: video.url,
                      }
                      await playUniversal([qItem], 0)
                    }}
                    className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col justify-between"
                  >
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-md">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="text-tiktok-pink/40"><TikTokIcon /></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-tiktok-pink flex items-center justify-center shadow-lg">
                          <Play size={18} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold truncate leading-snug">{video.title || 'TikTok'}</p>
                      <p className="text-white/40 text-[10px] truncate">@{video.authorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
