import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Music2,
  Youtube,
  Play,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  ListPlus,
  Loader2,
  Disc3,
  Clock,
  Flame,
  Radio,
  Shuffle,
  Heart,
  TrendingUp,
  RefreshCw,
  Check,
  Plus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { isValidSpotifyUrl, createSpotifyItemFromUrl } from '@/api/spotifyUrlService'
import { isValidYouTubeUrl, createYouTubeVideoFromUrl } from '@/api/youtubeService'
import { isValidTikTokUrl, createTikTokVideoFromUrl } from '@/api/tiktokService'
import { importSpotifyPlaylist } from '@/api/playlistImportService'
import { getPersonalizedRecommendations, getSimilarTracksForPlaylist, extractPlaylistArtists, type SimilarTrack } from '@/api/recommendationService'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { useHistoryStore } from '@/store/historyStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, YouTubeVideo, TikTokVideo, PersonalizedMix, RecommendedPlaylist } from '@/types'
import type { SearchTrackItem } from '@/api/universalSearchService'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

export function Home() {
  const navigate = useNavigate()
  const [universalInput, setUniversalInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputFeedback, setInputFeedback] = useState<string | null>(null)
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const { playUniversal, isPlaying, currentQueueItem } = usePlayerStore()
  const {
    spotifyItems,
    youtubeVideos,
    tiktokVideos,
    customPlaylists,
    addSpotifyItem,
    addYouTubeVideo,
    addTikTokVideo,
    addCustomPlaylist,
    addItemToCustomPlaylist,
  } = useLibraryStore()

  const { history, recentSearches, getTopArtists, getTopKeywords } = useHistoryStore()

  // Saudação Dinâmica
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  // Chave reativa para as recomendações baseadas no perfil do usuário
  const topArtists = useMemo(() => getTopArtists(), [history])
  const topKeywords = useMemo(() => getTopKeywords(), [history, recentSearches])

  // Busca Recomendações Personalizadas
  const { data: recommendations, isLoading: isLoadingRecs } = useQuery({
    queryKey: ['recommendations', topArtists.join(','), customPlaylists.length, history.length],
    queryFn: getPersonalizedRecommendations,
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
  })

  // ─── MÚSICAS SIMILARES ÀS PLAYLISTS SALVAS ────────────────────────
  const [homeSimilarTracks, setHomeSimilarTracks] = useState<SimilarTrack[]>([])
  const [isHomeSimilarLoading, setIsHomeSimilarLoading] = useState(false)
  const [addedHomeSimilarIds, setAddedHomeSimilarIds] = useState<Set<string>>(new Set())
  const [selectedPlaylistTargetId, setSelectedPlaylistTargetId] = useState<string>('all')
  const homeSimilarSeedRef = useRef(Date.now())

  // Itens da playlist alvo ou de todas as playlists salvas
  const allSavedPlaylistItems = useMemo(() => {
    if (selectedPlaylistTargetId && selectedPlaylistTargetId !== 'all') {
      const found = customPlaylists.find((p) => p.id === selectedPlaylistTargetId)
      return found ? found.items : []
    }
    return customPlaylists.flatMap((p) => p.items)
  }, [customPlaylists, selectedPlaylistTargetId])

  // Artistas detectados para exibir como estilo musical identificado
  const detectedArtists = useMemo(() => {
    return extractPlaylistArtists(allSavedPlaylistItems)
  }, [allSavedPlaylistItems])

  const loadHomeSimilarTracks = useCallback(
    async (items = allSavedPlaylistItems, seed?: number) => {
      if (items.length === 0) {
        setHomeSimilarTracks([])
        return
      }
      setIsHomeSimilarLoading(true)
      const s = seed ?? homeSimilarSeedRef.current
      homeSimilarSeedRef.current = s
      const existingIds = new Set(
        customPlaylists.flatMap((p) => p.items.map((i) => i.videoId || '')).filter(Boolean)
      )
      try {
        const tracks = await getSimilarTracksForPlaylist(items, existingIds, s)
        setHomeSimilarTracks(tracks)
      } catch {
        // ignore
      } finally {
        setIsHomeSimilarLoading(false)
      }
    },
    [allSavedPlaylistItems, customPlaylists]
  )

  useEffect(() => {
    if (allSavedPlaylistItems.length > 0 && homeSimilarTracks.length === 0 && !isHomeSimilarLoading) {
      loadHomeSimilarTracks(allSavedPlaylistItems)
    }
  }, [allSavedPlaylistItems.length])

  const handleReloadHomeSimilar = () => {
    const newSeed = Date.now()
    loadHomeSimilarTracks(allSavedPlaylistItems, newSeed)
  }

  const handleAddHomeSimilarTrack = (track: SimilarTrack) => {
    const targetPlId =
      selectedPlaylistTargetId !== 'all'
        ? selectedPlaylistTargetId
        : customPlaylists[0]?.id

    if (!targetPlId) return

    const item: PlaylistItem = {
      id: track.videoId,
      source: 'youtube',
      title: track.title,
      subtitle: track.channelTitle,
      imageUrl: track.thumbnailUrl,
      videoId: track.videoId,
      addedAt: new Date().toISOString(),
    }
    addItemToCustomPlaylist(targetPlId, item)
    setAddedHomeSimilarIds((prev) => new Set([...prev, track.videoId]))
  }

  // Processa URL ou redireciona busca universal
  const handleUniversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = universalInput.trim()
    if (!val) return

    setIsProcessing(true)
    setInputFeedback(null)

    // Registra a busca no histórico
    if (!val.startsWith('http')) {
      useHistoryStore.getState().recordSearch(val)
    }

    try {
      // 0. Link Compartilhado do JohnMusic
      const { isJohnMusicShareUrl, importPlaylistFromShareUrl } = await import('@/api/playlistShareService')
      if (isJohnMusicShareUrl(val)) {
        setInputFeedback('Clonando playlist compartilhada com todas as faixas...')
        const pl = importPlaylistFromShareUrl(val)
        if (pl && pl.items.length > 0) {
          addCustomPlaylist(pl)
          setUniversalInput('')
          setInputFeedback(`Playlist "${pl.name}" clonada com sucesso (${pl.items.length} músicas)!`)

          const queueItems: QueueItem[] = pl.items.map((i) => ({
            id: i.id,
            source: i.source,
            title: i.title,
            subtitle: i.subtitle,
            imageUrl: i.imageUrl,
            videoId: i.videoId,
            uri: i.uri,
            durationMs: i.durationMs,
          }))
          await playUniversal(queueItems, 0)
          navigate(`/playlist/${pl.id}`)
          return
        }
      }

      // 1. Spotify URL
      if (isValidSpotifyUrl(val)) {
        const { parseSpotifyUrl } = await import('@/api/spotifyUrlService')
        const parsed = parseSpotifyUrl(val)

        if (parsed?.type === 'playlist' || parsed?.type === 'album') {
          setInputFeedback('Separando faixas da playlist do Spotify...')
          const pl = await importSpotifyPlaylist(val)
          addCustomPlaylist(pl)
          setUniversalInput('')
          setInputFeedback(`Playlist "${pl.name}" importada com ${pl.items.length} faixas!`)

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
          }
          navigate(`/playlist/${pl.id}`)
          return
        }

        // Música individual do Spotify
        const item = await createSpotifyItemFromUrl(val)
        addSpotifyItem(item)
        setUniversalInput('')
        setInputFeedback('Música do Spotify adicionada!')
        const queueItem: QueueItem = {
          id: item.id,
          source: 'spotify',
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.thumbnailUrl,
          uri: `spotify:${item.type}:${item.spotifyId}`,
        }
        await playUniversal([queueItem], 0)
      } else if (isValidYouTubeUrl(val) || val.includes('list=')) {
        // 2. YouTube Playlist ou Vídeo
        if (val.includes('list=')) {
          setInputFeedback('Separando vídeos da playlist do YouTube...')
          const { importYouTubePlaylist } = await import('@/api/playlistImportService')
          const pl = await importYouTubePlaylist(val)
          addCustomPlaylist(pl)
          setUniversalInput('')
          setInputFeedback(`Playlist "${pl.name}" importada com ${pl.items.length} vídeos!`)

          if (pl.items.length > 0) {
            const queueItems: QueueItem[] = pl.items.map((i) => ({
              id: i.id,
              source: 'youtube',
              title: i.title,
              subtitle: i.subtitle,
              imageUrl: i.imageUrl,
              videoId: i.videoId,
              durationMs: i.durationMs,
            }))
            await playUniversal(queueItems, 0)
          }
          navigate(`/playlist/${pl.id}`)
          return
        }

        const video = await createYouTubeVideoFromUrl(val)
        addYouTubeVideo(video)
        setUniversalInput('')
        setInputFeedback('Vídeo do YouTube adicionado!')
        const queueItem: QueueItem = {
          id: video.id,
          source: 'youtube',
          title: video.title,
          subtitle: video.channelTitle,
          imageUrl: video.thumbnailUrl,
          videoId: video.videoId,
        }
        await playUniversal([queueItem], 0)
      } else if (isValidTikTokUrl(val)) {
        // 3. TikTok Audio Extraído
        setInputFeedback('Extraindo áudio do vídeo do TikTok...')
        const video = await createTikTokVideoFromUrl(val)
        addTikTokVideo(video)
        setUniversalInput('')
        setInputFeedback(`Áudio extraído com sucesso: "${video.title}"!`)
        const queueItem: QueueItem = {
          id: video.id,
          source: 'tiktok',
          title: video.soundTitle || video.title,
          subtitle: video.soundAuthor || `@${video.authorName}`,
          imageUrl: video.thumbnailUrl,
          audioUrl: video.audioUrl,
          tiktokPostId: video.postId,
          tiktokUrl: video.url,
          durationMs: (video.durationSeconds || 30) * 1000,
        }
        await playUniversal([queueItem], 0)
      } else {
        // Redireciona para busca unificada
        navigate(`/search?q=${encodeURIComponent(val)}`)
      }
    } catch (err) {
      setInputFeedback(err instanceof Error ? err.message : 'Erro ao processar link')
    } finally {
      setIsProcessing(false)
    }
  }

  // Toca um Mix Personalizado completo
  const playPersonalizedMix = async (mix: PersonalizedMix) => {
    if (!mix.items || mix.items.length === 0) return
    await playUniversal(mix.items, 0)
  }

  // Toca uma faixa recomendada
  const playTrackItem = async (track: SearchTrackItem) => {
    const queueItem: QueueItem = {
      id: track.id,
      source: track.source,
      title: track.title,
      subtitle: track.subtitle,
      imageUrl: track.artworkUrl,
      videoId: track.videoId,
      uri: track.spotifyUri,
      durationMs: track.durationMs,
    }
    await playUniversal([queueItem], 0)
  }

  // Importa e toca Playlist Recomendada do YouTube
  const playRecommendedPlaylist = async (playlist: RecommendedPlaylist) => {
    if (playlist.url) {
      try {
        const { importYouTubePlaylist } = await import('@/api/playlistImportService')
        const pl = await importYouTubePlaylist(playlist.url)
        addCustomPlaylist(pl)
        if (pl.items.length > 0) {
          const queueItems: QueueItem[] = pl.items.map((i) => ({
            id: i.id,
            source: i.source,
            title: i.title,
            subtitle: i.subtitle,
            imageUrl: i.imageUrl,
            videoId: i.videoId,
            durationMs: i.durationMs,
          }))
          await playUniversal(queueItems, 0)
          navigate(`/playlist/${pl.id}`)
        }
      } catch {
        navigate(`/search?q=${encodeURIComponent(playlist.name)}&mode=playlists`)
      }
    } else {
      navigate(`/search?q=${encodeURIComponent(playlist.name)}&mode=playlists`)
    }
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto select-none pb-20">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Hero Banner Inteligente com Saudação */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/90 via-violet-950/70 to-black p-8 md:p-12 border border-purple-500/20 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-400" />
            <span>{greeting}! Recomendações personalizadas para o seu gosto musical</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Descubra novas músicas e ouça suas playlists favoritas.
          </h1>

          <p className="text-white/60 text-sm md:text-base leading-relaxed">
            Pesquise qualquer artista ou cole links do <strong className="text-spotify-green">Spotify</strong>, <strong className="text-youtube-red">YouTube</strong> ou <strong className="text-tiktok-pink">TikTok</strong>. Todas as faixas tocam em harmonia contínua com <strong>Transição Mágica</strong>.
          </p>

          {/* Universal Smart Input */}
          <form onSubmit={handleUniversalSubmit} className="space-y-3 pt-2">
            <div className="relative flex items-center">
              <Search size={20} className="absolute left-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={universalInput}
                onChange={(e) => {
                  setUniversalInput(e.target.value)
                  setInputFeedback(null)
                }}
                placeholder="Cole um link do Spotify, YouTube, TikTok ou pesquise qualquer música/artista..."
                className="w-full bg-black/60 border border-white/20 rounded-2xl pl-12 pr-28 py-4 text-white placeholder-white/40 text-sm focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 backdrop-blur-md shadow-2xl transition-all"
              />
              <button
                type="submit"
                disabled={isProcessing || !universalInput.trim()}
                className="absolute right-2 px-5 py-2.5 bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-bold text-xs rounded-xl disabled:opacity-40 transition-all shadow-lg flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-black" />}
                <span>{isProcessing ? 'Carregando...' : 'Tocar'}</span>
              </button>
            </div>

            {inputFeedback && (
              <p className="text-xs text-spotify-green font-semibold px-2 animate-fade-in">
                ✓ {inputFeedback}
              </p>
            )}
          </form>

          {/* Tags de Buscas Recentes Rápidas */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-white/40 text-xs font-medium">Buscas recentes:</span>
              {recentSearches.slice(0, 5).map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-xs transition-all flex items-center gap-1"
                >
                  <Search size={10} />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-spotify-green/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 🔮 SEÇÃO 1: MIXES FEITOS PARA VOCÊ (Algoritmo Personalizado) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-purple-400 animate-pulse" />
              <span>Feito Para Você • Mixes Personalizados</span>
            </h2>
            <p className="text-white/50 text-xs md:text-sm mt-0.5">
              Gerados automaticamente com base nas suas playlists, buscas e histórico
            </p>
          </div>
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse h-48 flex flex-col justify-end space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(recommendations?.personalizedMixes || []).map((mix) => (
              <div
                key={mix.id}
                onClick={() => playPersonalizedMix(mix)}
                className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300 border border-white/10 hover:border-purple-500/40 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]"
              >
                {/* Capa com Gradiente Vibrante */}
                <div className={cn('relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br flex items-center justify-center shadow-md', mix.coverGradient)}>
                  {mix.coverUrl ? (
                    <img src={mix.coverUrl} alt={mix.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300 mix-blend-overlay" />
                  ) : null}
                  <div className="absolute inset-0 bg-black/20" />
                  
                  <div className="relative z-10 text-center px-3">
                    <Disc3 size={32} className="text-white/80 mx-auto mb-1 animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 drop-shadow">
                      {mix.tags[0] || 'Mix'}
                    </span>
                  </div>

                  {/* Play Hover Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-2xl transform group-hover:scale-110 active:scale-95 transition-transform">
                      <Play size={20} className="text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Textos */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-extrabold uppercase tracking-wider">
                      Mix Diário
                    </span>
                    <span className="text-white/40 text-[10px]">{mix.items.length} faixas</span>
                  </div>
                  <h3 className="text-white font-bold text-sm md:text-base leading-snug group-hover:text-purple-300 transition-colors">
                    {mix.title}
                  </h3>
                  <p className="text-white/50 text-xs line-clamp-2 mt-1 leading-relaxed">
                    {mix.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🎵 SEÇÃO 2: MÚSICAS RECOMENDADAS (Porque você ouviu...) */}
      {recommendations?.becauseYouListened && recommendations.becauseYouListened.tracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Flame size={20} className="text-orange-400" />
                <span>Porque você ouviu <strong className="text-purple-300">{recommendations.becauseYouListened.artistName}</strong></span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Faixas recomendadas que combinam com este artista</p>
            </div>
            <button
              onClick={() => navigate(`/search?q=${encodeURIComponent(recommendations.becauseYouListened!.artistName)}`)}
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver mais</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.becauseYouListened.tracks.map((track) => {
              const isCurrent = currentQueueItem?.id === track.id
              return (
                <div
                  key={track.id}
                  className={cn(
                    'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 hover:border-white/20 flex items-center gap-3 cursor-pointer',
                    isCurrent && 'border-spotify-green bg-spotify-green/10'
                  )}
                  onClick={() => playTrackItem(track)}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
                    {track.artworkUrl ? (
                      <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30"><Music2 size={20} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={16} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-bold truncate', isCurrent ? 'text-spotify-green' : 'text-white group-hover:text-purple-300')}>
                      {track.title}
                    </p>
                    <p className="text-white/50 text-xs truncate mt-0.5">{track.subtitle}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalItem({
                        id: track.id,
                        source: track.source,
                        title: track.title,
                        subtitle: track.subtitle,
                        imageUrl: track.artworkUrl,
                        videoId: track.videoId,
                        durationMs: track.durationMs,
                        addedAt: new Date().toISOString(),
                      })
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-white transition-all flex-shrink-0"
                    title="Adicionar à playlist"
                  >
                    <ListPlus size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ⚡ SEÇÃO 3: TOCADAS RECENTEMENTE (Histórico Rápido) */}
      {(recommendations?.recentlyPlayed || []).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-spotify-green" />
              <span>Tocadas Recentemente</span>
            </h2>
            <button
              onClick={() => useHistoryStore.getState().clearHistory()}
              className="text-white/30 hover:text-red-400 text-xs transition-colors"
            >
              Limpar histórico
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendations!.recentlyPlayed.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => playUniversal([item], 0)}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 hover:border-spotify-green/40 cursor-pointer space-y-2"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Music2 size={32} className="text-white/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center shadow-xl">
                      <Play size={16} className="text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate group-hover:text-spotify-green transition-colors">
                    {item.title}
                  </p>
                  <p className="text-white/40 text-[10px] truncate mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📂 SEÇÃO 4: PLAYLISTS RECOMENDADAS PARA VOCÊ (YouTube & Spotify) */}
      {(recommendations?.recommendedPlaylists || []).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Radio size={20} className="text-yellow-400" />
                <span>Playlists Recomendadas no YouTube & Spotify</span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Coleções perfeitas baseadas nos seus artistas mais ouvidos</p>
            </div>
            <button
              onClick={() => navigate('/search?mode=playlists')}
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Explorar Playlists</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations!.recommendedPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => playRecommendedPlaylist(pl)}
                className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 hover:border-yellow-400/40 cursor-pointer flex items-center gap-3.5 shadow-md hover:scale-[1.01]"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 relative shadow-md">
                  {pl.coverUrl ? (
                    <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30"><Layers size={24} /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={18} className="text-white fill-white ml-0.5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 text-[9px] font-extrabold uppercase">
                      Playlist
                    </span>
                    <span className="text-white/40 text-[10px]">{pl.itemCount} vídeos</span>
                  </div>
                  <h4 className="text-white text-sm font-bold truncate group-hover:text-yellow-300 transition-colors">
                    {pl.name}
                  </h4>
                  <p className="text-white/50 text-xs truncate mt-0.5">{pl.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📁 SEÇÃO 5: PLAYLISTS SALVAS */}
      {customPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers size={20} className="text-spotify-green" />
                <span>Playlists Salvas ({customPlaylists.length})</span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Suas coleções salvas no JohnMusic</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {customPlaylists.map((pl) => (
              <Link
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-spotify-green/20 space-y-2 flex flex-col justify-between hover:scale-[1.02] duration-300"
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
                  <span className="text-[9px] uppercase font-extrabold text-spotify-green tracking-wider">Playlist</span>
                  <p className="text-white text-xs font-bold truncate leading-snug">{pl.name}</p>
                  <p className="text-white/40 text-[10px] truncate">{pl.items.length} faixas</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 🔮 MÚSICAS SIMILARES ÀS PLAYLISTS SALVAS */}
      {customPlaylists.length > 0 && allSavedPlaylistItems.length > 0 && (
        <section className="space-y-4 pt-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/30 via-white/[0.02] to-transparent p-4 rounded-2xl border border-purple-500/10">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-purple-400 animate-pulse" />
                <span>Músicas Similares às suas Playlists</span>
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-white/40 text-xs">
                  Estilo identificado:
                </span>
                {detectedArtists.length > 0 ? (
                  detectedArtists.slice(0, 4).map((art) => (
                    <span
                      key={art}
                      className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold"
                    >
                      {art}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 text-xs">Mix do seu gosto musical</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown se houver mais de 1 playlist */}
              {customPlaylists.length > 1 && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                  <span className="text-white/40 text-[11px] font-medium">Basear em:</span>
                  <select
                    value={selectedPlaylistTargetId}
                    onChange={(e) => {
                      const newTarget = e.target.value
                      setSelectedPlaylistTargetId(newTarget)
                      let targetItems = customPlaylists.flatMap((p) => p.items)
                      if (newTarget !== 'all') {
                        const found = customPlaylists.find((p) => p.id === newTarget)
                        if (found) targetItems = found.items
                      }
                      loadHomeSimilarTracks(targetItems, Date.now())
                    }}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#181818] text-white">
                      Todas as Playlists
                    </option>
                    {customPlaylists.map((pl) => (
                      <option key={pl.id} value={pl.id} className="bg-[#181818] text-white">
                        {pl.name} ({pl.items.length})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleReloadHomeSimilar}
                disabled={isHomeSimilarLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
                title="Recarregar sugestões similares"
              >
                <RefreshCw size={13} className={isHomeSimilarLoading ? 'animate-spin' : ''} />
                <span>{isHomeSimilarLoading ? 'Buscando...' : 'Recarregar'}</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isHomeSimilarLoading && homeSimilarTracks.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-3.5 bg-white/10 rounded w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid de Músicas Similares */}
          {(!isHomeSimilarLoading || homeSimilarTracks.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {homeSimilarTracks.map((track) => {
                const isAdded = addedHomeSimilarIds.has(track.videoId)
                const alreadyInTarget = customPlaylists.some(
                  (pl) =>
                    (selectedPlaylistTargetId === 'all' || pl.id === selectedPlaylistTargetId) &&
                    pl.items.some((i) => i.videoId === track.videoId)
                )

                return (
                  <div
                    key={track.videoId}
                    className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 hover:border-purple-500/30 flex items-center gap-3 shadow-md"
                  >
                    {/* Capa + Botão Play para ouvir */}
                    <div
                      onClick={() => {
                        const qi: QueueItem = {
                          id: track.videoId,
                          source: 'youtube',
                          title: track.title,
                          subtitle: track.channelTitle,
                          imageUrl: track.thumbnailUrl,
                          videoId: track.videoId,
                        }
                        playUniversal([qi], 0)
                      }}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 relative cursor-pointer shadow-md"
                      title="Ouvir agora"
                    >
                      <img
                        src={track.thumbnailUrl || `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={16} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Título & Canal */}
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-bold truncate leading-tight group-hover:text-purple-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-white/40 text-[11px] truncate mt-0.5">
                        {track.channelTitle}
                      </p>
                    </div>

                    {/* Botão Adicionar à Playlist em 1 Clique */}
                    <button
                      onClick={() => !isAdded && !alreadyInTarget && handleAddHomeSimilarTrack(track)}
                      disabled={isAdded || alreadyInTarget}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0',
                        isAdded || alreadyInTarget
                          ? 'bg-spotify-green/20 text-spotify-green cursor-default'
                          : 'bg-white/5 hover:bg-spotify-green hover:text-black text-white/70 hover:shadow-lg hover:shadow-spotify-green/20 active:scale-95'
                      )}
                      title={
                        alreadyInTarget
                          ? 'Já está na playlist'
                          : isAdded
                          ? 'Adicionada!'
                          : 'Adicionar à playlist com 1 clique'
                      }
                    >
                      {isAdded || alreadyInTarget ? (
                        <Check size={13} />
                      ) : (
                        <Plus size={13} />
                      )}
                      <span className="text-[11px]">
                        {isAdded || alreadyInTarget ? 'Adicionada' : 'Adicionar'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {!isHomeSimilarLoading && homeSimilarTracks.length === 0 && (
            <p className="text-white/30 text-xs text-center py-4">
              Nenhuma recomendação encontrada. Clique em "Recarregar" para tentar novamente.
            </p>
          )}
        </section>
      )}

      {/* 📹 SEÇÃO 6: VÍDEOS SALVOS DO YOUTUBE */}
      {youtubeVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Youtube size={20} className="text-youtube-red" />
              <span>Vídeos Salvos do YouTube ({youtubeVideos.length})</span>
            </h2>
            <Link
              to="/youtube"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver Todos</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {youtubeVideos.slice(0, 4).map((video) => (
              <div
                key={video.id}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 flex flex-col justify-between space-y-2"
              >
                <div
                  className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer"
                  onClick={() => {
                    const queueItem: QueueItem = {
                      id: video.id,
                      source: 'youtube',
                      title: video.title,
                      subtitle: video.channelTitle,
                      imageUrl: video.thumbnailUrl,
                      videoId: video.videoId,
                    }
                    playUniversal([queueItem], 0)
                  }}
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-youtube-red flex items-center justify-center shadow-xl">
                      <Play size={16} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate">{video.title}</p>
                  <p className="text-white/40 text-[10px] truncate">{video.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
