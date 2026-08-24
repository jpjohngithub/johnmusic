// ============================================================
// SEARCH PAGE — Busca Universal Multi-Plataforma
// Pesquisa ultra-rápida de Músicas e Playlists no Spotify, YouTube e TikTok
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search as SearchIcon,
  Music2,
  Youtube,
  Play,
  Sparkles,
  Loader2,
  Clock,
  ListMusic,
  FolderPlus,
  X,
  Disc3,
  Layers,
  ListPlus,
  ExternalLink,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  executeUniversalSearch,
  type SearchTrackItem,
  type SearchPlaylistItem,
} from '@/api/universalSearchService'
import { importYouTubePlaylist, importSpotifyPlaylist } from '@/api/playlistImportService'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

interface SearchProps {
  isAuthenticated?: boolean
}

type SearchMode = 'tracks' | 'playlists'
type TrackTabType = 'all' | 'spotify' | 'youtube' | 'tiktok'
type PlaylistTabType = 'all' | 'spotify' | 'youtube' | 'library'

export function Search({ isAuthenticated = false }: SearchProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialMode = (searchParams.get('mode') as SearchMode) || 'tracks'

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode)
  const [activeTrackTab, setActiveTrackTab] = useState<TrackTabType>('all')
  const [activePlaylistTab, setActivePlaylistTab] = useState<PlaylistTabType>('all')
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    currentQueueItem,
    isPlaying,
    isResolving,
    playUniversal,
  } = usePlayerStore()

  const { customPlaylists, addCustomPlaylist } = useLibraryStore()

  // Sincroniza query da URL apenas se vier de fora
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const mode = searchParams.get('mode') as SearchMode
    if (mode && (mode === 'tracks' || mode === 'playlists')) {
      setSearchMode(mode)
    }
    if (q !== query && q !== debouncedQuery) {
      setQuery(q)
      setDebouncedQuery(q)
    }
  }, [searchParams])

  // Digitação imediata e debounce otimizado sem lag
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = val.trim()
      setDebouncedQuery(trimmed)
      if (trimmed) {
        setSearchParams({ q: trimmed, mode: searchMode }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }, 250)
  }

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode)
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery, mode }, { replace: true })
    }
  }

  const clearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setQuery('')
    setDebouncedQuery('')
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  // Universal Search Query
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['universal', 'search', debouncedQuery, isAuthenticated],
    queryFn: () => executeUniversalSearch(debouncedQuery, isAuthenticated),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000,
  })

  // Playlists personalizadas salvas que coincidem
  const matchedCustomPlaylists = debouncedQuery
    ? customPlaylists.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(debouncedQuery.toLowerCase()))
      )
    : []

  // Toca faixa pesquisada
  const handlePlayTrack = async (track: SearchTrackItem, trackList: SearchTrackItem[], index: number) => {
    const queueItems: QueueItem[] = trackList.map((t) => ({
      id: t.id,
      source: t.source,
      title: t.title,
      subtitle: t.subtitle,
      imageUrl: t.artworkUrl,
      audioUrl: t.audioUrl || (t.previewUrl ? t.previewUrl : undefined),
      uri: t.spotifyUri,
      videoId: t.videoId,
      tiktokUrl: t.tiktokUrl,
      durationMs: t.durationMs,
    }))

    await playUniversal(queueItems, index)
  }

  // Toca playlist salva da biblioteca
  const handlePlaySavedPlaylist = async (pl: typeof customPlaylists[0]) => {
    const queueItems: QueueItem[] = pl.items.map((i) => ({
      id: i.id,
      source: i.source,
      title: i.title,
      subtitle: i.subtitle,
      imageUrl: i.imageUrl,
      audioUrl: i.source === 'audio' ? i.url : undefined,
      uri: i.uri,
      videoId: i.videoId,
      tiktokPostId: i.tiktokPostId,
      tiktokUrl: i.source === 'tiktok' ? i.url : undefined,
      durationMs: i.durationMs,
    }))
    if (queueItems.length > 0) {
      await playUniversal(queueItems, 0)
    }
  }

  // Clique em playlist pesquisada (Importa e toca automaticamente a 50% de volume)
  const handlePlaylistClick = async (pl: SearchPlaylistItem) => {
    if (loadingPlaylistId) return
    setLoadingPlaylistId(pl.id)

    try {
      if (pl.source === 'spotify') {
        const spotifyId = pl.id.replace('sp-pl-', '').replace('sp-album-', '')
        if (isAuthenticated && pl.id.startsWith('sp-pl-')) {
          navigate(`/spotify/playlist/${spotifyId}`)
          return
        }
        // Importa e toca a playlist do Spotify com capas HD e áudio garantido
        const customPl = await importSpotifyPlaylist(pl.spotifyUrl || pl.id.replace('sp-pl-', ''))
        if (customPl && customPl.items.length > 0) {
          addCustomPlaylist(customPl)
          await playUniversal(
            customPl.items.map((i) => ({
              id: i.id,
              source: i.source,
              title: i.title,
              subtitle: i.subtitle,
              imageUrl: i.imageUrl,
              uri: i.uri,
              videoId: i.videoId,
              durationMs: i.durationMs,
            })),
            0
          )
          navigate(`/playlist/${customPl.id}`)
          return
        }
        navigate(`/spotify/playlist/${spotifyId}`)
      } else if (pl.source === 'youtube') {
        // Importa e toca playlist do YouTube
        const customPl = await importYouTubePlaylist(pl.youtubeUrl || pl.youtubePlaylistId || '')
        if (customPl && customPl.items.length > 0) {
          addCustomPlaylist(customPl)
          await playUniversal(
            customPl.items.map((i) => ({
              id: i.id,
              source: i.source,
              title: i.title,
              subtitle: i.subtitle,
              imageUrl: i.imageUrl,
              videoId: i.videoId,
              durationMs: i.durationMs,
            })),
            0
          )
          navigate(`/playlist/${customPl.id}`)
          return
        }
      }
    } catch {
      // fallback caso ocorra erro de rede
    } finally {
      setLoadingPlaylistId(null)
    }
  }

  const isCurrentPlayingTrack = (track: SearchTrackItem) => {
    if (!isPlaying && !isResolving) return false
    if (currentQueueItem?.title?.toLowerCase() === track.title?.toLowerCase()) return true
    if (track.videoId && currentQueueItem?.videoId === track.videoId) return true
    if (track.spotifyUri && currentQueueItem?.uri === track.spotifyUri) return true
    return false
  }

  const totalTrackResults =
    (searchData?.spotifyTracks.length || 0) +
    (searchData?.youtubeVideos.length || 0) +
    (searchData?.tiktokTracks.length || 0)

  const totalPlaylistResults =
    (searchData?.spotifyPlaylists.length || 0) +
    (searchData?.youtubePlaylists.length || 0) +
    matchedCustomPlaylists.length

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-20">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* ─── SEARCH HERO & INPUT BAR ────────── */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <h1 className="text-3xl font-black text-white text-center tracking-tight">
          O que você quer ouvir hoje?
        </h1>

        {/* ─── TOGGLE: MÚSICAS VS PLAYLISTS ────────── */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
            <button
              onClick={() => handleModeChange('tracks')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all',
                searchMode === 'tracks'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20 scale-100'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Music2 size={15} />
              <span>Músicas</span>
            </button>

            <button
              onClick={() => handleModeChange('playlists')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all',
                searchMode === 'playlists'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20 scale-100'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <ListMusic size={15} />
              <span>Playlists & Álbuns</span>
            </button>
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={
              searchMode === 'tracks'
                ? 'Buscar músicas no Spotify, YouTube e TikTok...'
                : 'Buscar playlists e álbuns no Spotify e YouTube...'
            }
            className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 shadow-2xl transition-all"
            autoFocus
          />
          {isLoading ? (
            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-green animate-spin" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        {/* ─── PLATFORM TABS (MODO MÚSICAS) ────────── */}
        {debouncedQuery && searchMode === 'tracks' && (
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => setActiveTrackTab('all')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activeTrackTab === 'all'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Sparkles size={14} />
              <span>Tudo ({totalTrackResults})</span>
            </button>

            <button
              onClick={() => setActiveTrackTab('spotify')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activeTrackTab === 'spotify'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Music2 size={14} />
              <span>Spotify ({searchData?.spotifyTracks.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTrackTab('youtube')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activeTrackTab === 'youtube'
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Youtube size={14} />
              <span>YouTube ({searchData?.youtubeVideos.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTrackTab('tiktok')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activeTrackTab === 'tiktok'
                  ? 'bg-tiktok-pink text-white shadow-lg shadow-tiktok-pink/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <TikTokIcon />
              <span>TikTok ({searchData?.tiktokTracks.length || 0})</span>
            </button>
          </div>
        )}

        {/* ─── PLATFORM TABS (MODO PLAYLISTS) ────────── */}
        {debouncedQuery && searchMode === 'playlists' && (
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => setActivePlaylistTab('all')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activePlaylistTab === 'all'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Layers size={14} />
              <span>Todas as Playlists ({totalPlaylistResults})</span>
            </button>

            <button
              onClick={() => setActivePlaylistTab('spotify')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activePlaylistTab === 'spotify'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Music2 size={14} />
              <span>Spotify ({searchData?.spotifyPlaylists.length || 0})</span>
            </button>

            <button
              onClick={() => setActivePlaylistTab('youtube')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                activePlaylistTab === 'youtube'
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              )}
            >
              <Youtube size={14} />
              <span>YouTube ({searchData?.youtubePlaylists.length || 0})</span>
            </button>

            {matchedCustomPlaylists.length > 0 && (
              <button
                onClick={() => setActivePlaylistTab('library')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all',
                  activePlaylistTab === 'library'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                )}
              >
                <ListMusic size={14} />
                <span>Sua Biblioteca ({matchedCustomPlaylists.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── RESULTS CONTAINER ────────── */}
      {debouncedQuery && (
        <div className="space-y-10">
          {/* ═══════════════════════════════════════════════════════
              MODO 1: BUSCA DE MÚSICAS (TRACKS)
          ═══════════════════════════════════════════════════════ */}
          {searchMode === 'tracks' && (
            <div className="space-y-10">
              {/* Suas Playlists Salvas */}
              {matchedCustomPlaylists.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <ListMusic size={20} className="text-spotify-green" />
                    <span>Playlists na sua Biblioteca ({matchedCustomPlaylists.length})</span>
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                            <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                              <Play size={18} className="text-black fill-black ml-0.5" />
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
                  </div>
                </section>
              )}

              {/* Aba: Tudo */}
              {activeTrackTab === 'all' && searchData && (
                <div className="space-y-10">
                  {/* Spotify Section */}
                  {searchData.spotifyTracks.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <Music2 size={22} className="text-spotify-green" />
                          <span>Músicas do Spotify</span>
                        </h2>
                        <span className="text-white/40 text-xs">{searchData.spotifyTracks.length} resultados</span>
                      </div>
                      <TrackListView
                        tracks={searchData.spotifyTracks}
                        onPlayTrack={(track, index) => handlePlayTrack(track, searchData.spotifyTracks, index)}
                        onArtistClick={(artist) => {
                          setQuery(artist)
                          setDebouncedQuery(artist)
                          setSearchParams({ q: artist, mode: 'tracks' })
                        }}
                        onSaveTrack={(track) => setModalItem({
                          id: track.id,
                          source: track.source,
                          title: track.title,
                          subtitle: track.subtitle,
                          imageUrl: track.artworkUrl,
                          uri: track.spotifyUri,
                          url: track.spotifyUrl,
                          durationMs: track.durationMs,
                          addedAt: new Date().toISOString(),
                        })}
                        isCurrentPlaying={isCurrentPlayingTrack}
                        isResolving={isResolving}
                      />
                    </section>
                  )}

                  {/* YouTube Section */}
                  {searchData.youtubeVideos.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <Youtube size={22} className="text-youtube-red" />
                          <span>Vídeos e Músicas do YouTube</span>
                        </h2>
                        <span className="text-white/40 text-xs">{searchData.youtubeVideos.length} resultados</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {searchData.youtubeVideos.map((video, index) => {
                          const isCurrent = isCurrentPlayingTrack(video)

                          return (
                            <div
                              key={video.id}
                              onClick={() => handlePlayTrack(video, searchData.youtubeVideos, index)}
                              className={cn(
                                'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2 flex flex-col justify-between',
                                isCurrent ? 'border-youtube-red/50 bg-youtube-red/10' : 'border-white/5'
                              )}
                            >
                              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md">
                                <img src={video.artworkUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-youtube-red flex items-center justify-center shadow-lg">
                                    <Play size={18} className="text-white fill-white ml-0.5" />
                                  </div>
                                </div>
                                {video.durationMs ? (
                                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                                    {formatMs(video.durationMs)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className={cn('text-xs font-semibold truncate', isCurrent ? 'text-youtube-red' : 'text-white')}>{video.title}</p>
                                  <p
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setQuery(video.subtitle)
                                      setDebouncedQuery(video.subtitle)
                                      setSearchParams({ q: video.subtitle, mode: 'tracks' })
                                    }}
                                    className="text-white/40 hover:text-spotify-green hover:underline cursor-pointer text-[11px] truncate transition-colors"
                                    title={`Ver mais de ${video.subtitle}`}
                                  >
                                    {video.subtitle}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setModalItem({
                                      id: video.id,
                                      source: 'youtube',
                                      title: video.title,
                                      subtitle: video.subtitle,
                                      imageUrl: video.artworkUrl,
                                      videoId: video.videoId,
                                      durationMs: video.durationMs,
                                      addedAt: new Date().toISOString(),
                                    })
                                  }}
                                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                  title="Salvar em Playlist"
                                >
                                  <FolderPlus size={15} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* TikTok Section */}
                  {searchData.tiktokTracks.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="text-tiktok-pink"><TikTokIcon /></span>
                          <span>Sons Virais do TikTok</span>
                        </h2>
                        <span className="text-white/40 text-xs">{searchData.tiktokTracks.length} resultados</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {searchData.tiktokTracks.map((video, index) => {
                          const isCurrent = isCurrentPlayingTrack(video)

                          return (
                            <div
                              key={video.id}
                              onClick={() => handlePlayTrack(video, searchData.tiktokTracks, index)}
                              className={cn(
                                'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2 flex flex-col justify-between',
                                isCurrent ? 'border-tiktok-pink/50 bg-tiktok-pink/10' : 'border-white/5'
                              )}
                            >
                              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-md">
                                {video.artworkUrl ? (
                                  <img src={video.artworkUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="text-tiktok-pink"><TikTokIcon /></div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-tiktok-pink flex items-center justify-center shadow-lg">
                                    <Play size={18} className="text-white fill-white ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <p className={cn('text-xs font-semibold truncate', isCurrent ? 'text-tiktok-pink' : 'text-white')}>{video.title}</p>
                                  <p
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const clean = video.subtitle.replace(/TikTok\s*•?\s*/gi, '').trim()
                                      setQuery(clean)
                                      setDebouncedQuery(clean)
                                      setSearchParams({ q: clean, mode: 'tracks' })
                                    }}
                                    className="text-white/40 hover:text-spotify-green hover:underline cursor-pointer text-[10px] truncate transition-colors"
                                    title={`Ver mais de ${video.subtitle}`}
                                  >
                                    {video.subtitle}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setModalItem({
                                      id: video.id,
                                      source: 'tiktok',
                                      title: video.title,
                                      subtitle: video.subtitle,
                                      imageUrl: video.artworkUrl,
                                      audioUrl: video.audioUrl,
                                      durationMs: video.durationMs,
                                      addedAt: new Date().toISOString(),
                                    })
                                  }}
                                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                  title="Salvar em Playlist"
                                >
                                  <FolderPlus size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* Aba: Spotify Apenas */}
              {activeTrackTab === 'spotify' && searchData && (
                <section className="space-y-4">
                  <TrackListView
                    tracks={searchData.spotifyTracks}
                    onPlayTrack={(track, index) => handlePlayTrack(track, searchData.spotifyTracks, index)}
                    onArtistClick={(artist) => {
                      setQuery(artist)
                      setDebouncedQuery(artist)
                      setSearchParams({ q: artist, mode: 'tracks' })
                    }}
                    onSaveTrack={(track) => setModalItem({
                      id: track.id,
                      source: track.source,
                      title: track.title,
                      subtitle: track.subtitle,
                      imageUrl: track.artworkUrl,
                      uri: track.spotifyUri,
                      url: track.spotifyUrl,
                      durationMs: track.durationMs,
                      addedAt: new Date().toISOString(),
                    })}
                    isCurrentPlaying={isCurrentPlayingTrack}
                    isResolving={isResolving}
                  />
                </section>
              )}

              {/* Aba: YouTube Apenas */}
              {activeTrackTab === 'youtube' && searchData && (
                <section className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchData.youtubeVideos.map((video, index) => {
                      const isCurrent = isCurrentPlayingTrack(video)

                      return (
                        <div
                          key={video.id}
                          onClick={() => handlePlayTrack(video, searchData.youtubeVideos, index)}
                          className={cn(
                            'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2 flex flex-col justify-between',
                            isCurrent ? 'border-youtube-red/50 bg-youtube-red/10' : 'border-white/5'
                          )}
                        >
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md">
                            <img src={video.artworkUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-youtube-red flex items-center justify-center shadow-lg">
                                <Play size={18} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-xs font-semibold truncate', isCurrent ? 'text-youtube-red' : 'text-white')}>{video.title}</p>
                              <p
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setQuery(video.subtitle)
                                  setDebouncedQuery(video.subtitle)
                                  setSearchParams({ q: video.subtitle, mode: 'tracks' })
                                }}
                                className="text-white/40 hover:text-spotify-green hover:underline cursor-pointer text-[11px] truncate transition-colors"
                                title={`Ver mais de ${video.subtitle}`}
                              >
                                {video.subtitle}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalItem({
                                  id: video.id,
                                  source: 'youtube',
                                  title: video.title,
                                  subtitle: video.subtitle,
                                  imageUrl: video.artworkUrl,
                                  videoId: video.videoId,
                                  durationMs: video.durationMs,
                                  addedAt: new Date().toISOString(),
                                })
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                              title="Salvar em Playlist"
                            >
                              <FolderPlus size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Aba: TikTok Apenas */}
              {activeTrackTab === 'tiktok' && searchData && (
                <section className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {searchData.tiktokTracks.map((video, index) => {
                      const isCurrent = isCurrentPlayingTrack(video)

                      return (
                        <div
                          key={video.id}
                          onClick={() => handlePlayTrack(video, searchData.tiktokTracks, index)}
                          className={cn(
                            'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2 flex flex-col justify-between',
                            isCurrent ? 'border-tiktok-pink/50 bg-tiktok-pink/10' : 'border-white/5'
                          )}
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-md">
                            {video.artworkUrl ? (
                              <img src={video.artworkUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="text-tiktok-pink"><TikTokIcon /></div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-tiktok-pink flex items-center justify-center shadow-lg">
                                <Play size={18} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-xs font-semibold truncate', isCurrent ? 'text-tiktok-pink' : 'text-white')}>{video.title}</p>
                              <p
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const clean = video.subtitle.replace(/TikTok\s*•?\s*/gi, '').trim()
                                  setQuery(clean)
                                  setDebouncedQuery(clean)
                                  setSearchParams({ q: clean, mode: 'tracks' })
                                }}
                                className="text-white/40 hover:text-spotify-green hover:underline cursor-pointer text-[10px] truncate transition-colors"
                                title={`Ver mais de ${video.subtitle}`}
                              >
                                {video.subtitle}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalItem({
                                  id: video.id,
                                  source: 'tiktok',
                                  title: video.title,
                                  subtitle: video.subtitle,
                                  imageUrl: video.artworkUrl,
                                  audioUrl: video.audioUrl,
                                  durationMs: video.durationMs,
                                  addedAt: new Date().toISOString(),
                                })
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                              title="Salvar em Playlist"
                            >
                              <FolderPlus size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              MODO 2: BUSCA DE PLAYLISTS E ÁLBUNS
          ═══════════════════════════════════════════════════════ */}
          {searchMode === 'playlists' && searchData && (
            <div className="space-y-10">
              {/* Playlists da Biblioteca */}
              {(activePlaylistTab === 'all' || activePlaylistTab === 'library') && matchedCustomPlaylists.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <ListMusic size={22} className="text-purple-400" />
                    <span>Playlists da sua Biblioteca ({matchedCustomPlaylists.length})</span>
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {matchedCustomPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => navigate(`/playlist/${pl.id}`)}
                        className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-purple-500/20 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
                          {pl.coverUrl ? (
                            <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="text-purple-400"><Music2 size={40} /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                              <Play size={20} className="text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-purple-400 tracking-wider">Biblioteca JohnMusic</span>
                          <p className="text-white text-sm font-bold truncate leading-snug">{pl.name}</p>
                          <p className="text-white/40 text-xs truncate">{pl.items.length} músicas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Playlists do Spotify */}
              {(activePlaylistTab === 'all' || activePlaylistTab === 'spotify') && searchData.spotifyPlaylists.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Music2 size={22} className="text-spotify-green" />
                      <span>Playlists e Álbuns do Spotify</span>
                    </h2>
                    <span className="text-white/40 text-xs">{searchData.spotifyPlaylists.length} resultados</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchData.spotifyPlaylists.map((pl) => {
                      const isLoadingThis = loadingPlaylistId === pl.id

                      return (
                        <div
                          key={pl.id}
                          onClick={() => handlePlaylistClick(pl)}
                          className={cn(
                            'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2.5 flex flex-col justify-between',
                            isLoadingThis ? 'border-spotify-green/50 bg-spotify-green/10' : 'border-white/5'
                          )}
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
                            {pl.artworkUrl ? (
                              <img src={pl.artworkUrl} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="text-spotify-green"><Music2 size={40} /></div>
                            )}
                            <div className={cn(
                              'absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center',
                              isLoadingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}>
                              <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                                {isLoadingThis ? (
                                  <Loader2 size={22} className="text-black animate-spin" />
                                ) : (
                                  <Play size={20} className="text-black fill-black ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-extrabold text-spotify-green tracking-wider">Spotify</span>
                            <p className="text-white text-sm font-bold truncate leading-snug">{pl.title}</p>
                            <p className="text-white/40 text-xs truncate">{pl.subtitle}</p>
                            {pl.trackCount > 0 && (
                              <p className="text-white/30 text-[11px] mt-0.5">{pl.trackCount} faixas</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Playlists do YouTube */}
              {(activePlaylistTab === 'all' || activePlaylistTab === 'youtube') && searchData.youtubePlaylists.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Youtube size={22} className="text-youtube-red" />
                      <span>Playlists do YouTube</span>
                    </h2>
                    <span className="text-white/40 text-xs">{searchData.youtubePlaylists.length} resultados</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchData.youtubePlaylists.map((pl) => {
                      const isLoadingThis = loadingPlaylistId === pl.id

                      return (
                        <div
                          key={pl.id}
                          onClick={() => handlePlaylistClick(pl)}
                          className={cn(
                            'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border space-y-2.5 flex flex-col justify-between',
                            isLoadingThis ? 'border-youtube-red/50 bg-youtube-red/10' : 'border-white/5'
                          )}
                        >
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
                            {pl.artworkUrl ? (
                              <img src={pl.artworkUrl} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="text-youtube-red"><Youtube size={40} /></div>
                            )}
                            <div className={cn(
                              'absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center',
                              isLoadingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}>
                              <div className="w-12 h-12 rounded-full bg-youtube-red flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                                {isLoadingThis ? (
                                  <Loader2 size={22} className="text-white animate-spin" />
                                ) : (
                                  <Play size={20} className="text-white fill-white ml-0.5" />
                                )}
                              </div>
                            </div>
                            {pl.trackCount > 0 && (
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                                {pl.trackCount} vídeos
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-extrabold text-youtube-red tracking-wider">YouTube Playlist</span>
                            <p className="text-white text-sm font-bold truncate leading-snug">{pl.title}</p>
                            <p className="text-white/40 text-xs truncate">{pl.subtitle}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Nenhum resultado */}
          {!isLoading &&
            ((searchMode === 'tracks' && totalTrackResults === 0) ||
              (searchMode === 'playlists' && totalPlaylistResults === 0)) && (
              <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                <SearchIcon size={40} className="text-white/20 mx-auto" />
                <p className="text-white/60 text-sm">Nenhum resultado encontrado para "{debouncedQuery}".</p>
                <p className="text-white/40 text-xs">
                  {searchMode === 'tracks'
                    ? 'Tente buscar por outro nome de música ou mude para a busca de Playlists.'
                    : 'Tente buscar por outro termo ou mude para a busca de Músicas.'}
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

// ─── Componente Reutilizável de Lista de Faixas ───────────────

interface TrackListViewProps {
  tracks: SearchTrackItem[]
  onPlayTrack: (track: SearchTrackItem, index: number) => void
  onSaveTrack: (track: SearchTrackItem) => void
  onArtistClick?: (artist: string) => void
  isCurrentPlaying: (track: SearchTrackItem) => boolean
  isResolving: boolean
}

function TrackListView({
  tracks,
  onPlayTrack,
  onSaveTrack,
  onArtistClick,
  isCurrentPlaying,
  isResolving,
}: TrackListViewProps) {
  return (
    <div className="w-full select-none">
      <div
        className="grid items-center px-4 pb-2 text-white/40 text-[11px] uppercase tracking-wider border-b border-white/5"
        style={{ gridTemplateColumns: '40px 1fr auto' }}
      >
        <span className="text-center">#</span>
        <span>Título / Artista</span>
        <div className="flex items-center gap-2 pr-2">
          <Clock size={14} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {tracks.map((track, index) => {
          const isCurrent = isCurrentPlaying(track)

          return (
            <div
              key={`${track.id}-${index}`}
              onClick={() => onPlayTrack(track, index)}
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
                  alt={track.title}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md"
                />
                <div className="min-w-0 space-y-0.5">
                  <p className={cn('text-sm font-semibold truncate', isCurrent ? 'text-spotify-green' : 'text-white')}>
                    {track.title}
                  </p>
                  <p className="text-white/40 text-xs truncate">
                    <span
                      onClick={(e) => {
                        if (onArtistClick) {
                          e.stopPropagation()
                          onArtistClick(track.subtitle)
                        }
                      }}
                      className="hover:text-spotify-green hover:underline cursor-pointer transition-colors"
                      title={`Ver outras músicas de ${track.subtitle}`}
                    >
                      {track.subtitle}
                    </span>
                    {track.albumName && ` • ${track.albumName}`}
                  </p>
                </div>
              </div>

              {/* Actions & Duration */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSaveTrack(track)
                  }}
                  className="p-2 rounded-xl text-white/40 hover:text-spotify-green hover:bg-white/10 transition-colors"
                  title="Salvar em Playlist"
                >
                  <FolderPlus size={16} />
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
  )
}
