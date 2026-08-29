// ============================================================
// CUSTOM PLAYLIST DETAIL — Gerenciamento Completo de Playlist
// Edição de Nome/Capa/Descrição, Drag-and-Drop (Arrastar para Reordenar),
// Ordenação Automática (A-Z/Artista), Duplicação e Adição Rápida
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Music2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Trash2,
  ArrowLeft,
  Youtube,
  Plus,
  Radio,
  Loader2,
  Edit3,
  Copy,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  X,
  SortAsc,
  FolderPlus,
  User,
  GripVertical,
  Share2,
  Link2,
  RefreshCw,
} from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { generatePlaylistShareUrl } from '@/api/playlistShareService'
import { createSpotifyItemFromUrl, isValidSpotifyUrl } from '@/api/spotifyUrlService'
import { createYouTubeVideoFromUrl, isValidYouTubeUrl } from '@/api/youtubeService'
import { createTikTokVideoFromUrl, isValidTikTokUrl } from '@/api/tiktokService'
import { getSimilarTracksForPlaylist, type SimilarTrack } from '@/api/recommendationService'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

export function CustomPlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    customPlaylists,
    deleteCustomPlaylist,
    removeItemFromCustomPlaylist,
    updateCustomPlaylist,
    movePlaylistItem,
    reorderPlaylistItems,
    reversePlaylistOrder,
    sortPlaylist,
    duplicateCustomPlaylist,
    addItemToCustomPlaylist,
  } = useLibraryStore()

  const {
    currentQueueItem,
    isPlaying,
    isResolving,
    perfectTransition,
    togglePerfectTransition,
    getNextTrack,
    togglePlay,
    playUniversal,
    playNext,
    playPrev,
  } = usePlayerStore()

  // Estados de Edição da Playlist
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCover, setEditCover] = useState('')

  // Estado para Adição Rápida de Faixas
  const [quickUrl, setQuickUrl] = useState('')
  const [isAddingTrack, setIsAddingTrack] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Estado para Salvar Música em Outra Playlist
  const [selectedTrackForSave, setSelectedTrackForSave] = useState<PlaylistItem | null>(null)

  // Estados para Drag and Drop (Arrastar Músicas)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Feedback de Compartilhamento
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  // ─── Estado de Músicas Similares ─────────────────────────────────
  const [similarTracks, setSimilarTracks] = useState<SimilarTrack[]>([])
  const [isSimilarLoading, setIsSimilarLoading] = useState(false)
  const [addedSimilarIds, setAddedSimilarIds] = useState<Set<string>>(new Set())
  const similarSeedRef = useRef(Date.now())

  const playlist = customPlaylists.find((p) => p.id === id)

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-white/60 text-base">Playlist não encontrada.</p>
        <Link
          to="/"
          className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-semibold"
        >
          Voltar ao Início
        </Link>
      </div>
    )
  }

  const openEditModal = () => {
    setEditName(playlist.name)
    setEditDesc(playlist.description || '')
    setEditCover(playlist.coverUrl || '')
    setIsEditingModalOpen(true)
  }

  // ─── Carrega Músicas Similares ────────────────────────────────────
  const loadSimilarTracks = useCallback(async (newSeed?: number) => {
    if (playlist.items.length === 0) return
    setIsSimilarLoading(true)
    const seed = newSeed ?? similarSeedRef.current
    similarSeedRef.current = seed
    const existingIds = new Set(playlist.items.map((i) => i.videoId || '').filter(Boolean))
    try {
      const tracks = await getSimilarTracksForPlaylist(playlist.items, existingIds, seed)
      setSimilarTracks(tracks)
      setAddedSimilarIds(new Set())
    } catch {
      // silently ignore
    } finally {
      setIsSimilarLoading(false)
    }
  }, [playlist.id, playlist.items])

  useEffect(() => {
    if (playlist.items.length > 0 && similarTracks.length === 0 && !isSimilarLoading) {
      loadSimilarTracks()
    }
  }, [playlist.id])

  const handleReloadSimilar = () => {
    const newSeed = Date.now()
    loadSimilarTracks(newSeed)
  }

  const handleAddSimilarTrack = (track: SimilarTrack) => {
    const item: PlaylistItem = {
      id: track.videoId,
      source: 'youtube',
      title: track.title,
      subtitle: track.channelTitle,
      imageUrl: track.thumbnailUrl,
      videoId: track.videoId,
      addedAt: new Date().toISOString(),
    }
    addItemToCustomPlaylist(playlist.id, item)
    setAddedSimilarIds((prev) => new Set([...prev, track.videoId]))
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    updateCustomPlaylist(playlist.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      coverUrl: editCover.trim(),
    })
    setIsEditingModalOpen(false)
  }

  const handleDuplicate = () => {
    const clone = duplicateCustomPlaylist(playlist.id)
    if (clone) {
      navigate(`/playlist/${clone.id}`)
    }
  }

  const handleSharePlaylist = async () => {
    try {
      const shareUrl = generatePlaylistShareUrl(playlist)
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback('Link copiado! Ao colar esse link no site, a playlist é duplicada exatamente como está.')
      setTimeout(() => setShareFeedback(null), 5000)
    } catch {
      const shareUrl = generatePlaylistShareUrl(playlist)
      window.prompt('Copie o link da sua playlist abaixo:', shareUrl)
    }
  }

  const handleDeletePlaylist = () => {
    if (window.confirm(`Tem certeza que deseja excluir a playlist "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id)
      navigate('/')
    }
  }

  // Adicionar faixa rápida por link
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = quickUrl.trim()
    if (!val) return

    setIsAddingTrack(true)
    setAddError(null)

    try {
      if (isValidSpotifyUrl(val)) {
        const item = await createSpotifyItemFromUrl(val)
        addItemToCustomPlaylist(playlist.id, {
          id: crypto.randomUUID(),
          source: 'spotify',
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.thumbnailUrl,
          url: item.url,
          uri: `spotify:${item.type}:${item.spotifyId}`,
          addedAt: new Date().toISOString(),
        })
      } else if (isValidYouTubeUrl(val)) {
        const video = await createYouTubeVideoFromUrl(val)
        addItemToCustomPlaylist(playlist.id, {
          id: crypto.randomUUID(),
          source: 'youtube',
          title: video.title,
          subtitle: video.channelTitle,
          imageUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
          videoId: video.videoId,
          url: video.url,
          durationMs: ((video as any).durationSeconds || 180) * 1000,
          addedAt: new Date().toISOString(),
        })
      } else if (isValidTikTokUrl(val)) {
        const video = await createTikTokVideoFromUrl(val)
        addItemToCustomPlaylist(playlist.id, {
          id: crypto.randomUUID(),
          source: 'tiktok',
          title: video.soundTitle || video.title,
          subtitle: video.soundAuthor || `@${video.authorName}`,
          imageUrl: video.thumbnailUrl,
          audioUrl: video.audioUrl,
          tiktokPostId: video.postId,
          url: video.url,
          durationMs: (video.durationSeconds || 30) * 1000,
          addedAt: new Date().toISOString(),
        })
      } else {
        setAddError('Link não reconhecido. Use links do Spotify, YouTube ou TikTok.')
        return
      }

      setQuickUrl('')
      setShowQuickAdd(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erro ao processar música')
    } finally {
      setIsAddingTrack(false)
    }
  }

  // Toca a partir do índice (inicia aleatório se for início geral com Shuffle ativo)
  const handlePlayItem = async (index: number, isExplicitClick = false) => {
    const queueItems: QueueItem[] = playlist.items.map((i) => ({
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

    await playUniversal(queueItems, index, isExplicitClick)
  }

  const isCurrentPlayingInPlaylist = (item: PlaylistItem) => {
    if (!isPlaying && !isResolving) return false
    if (currentQueueItem?.title.toLowerCase() === item.title.toLowerCase()) return true
    if (item.videoId && currentQueueItem?.videoId === item.videoId) return true
    if (item.uri && currentQueueItem?.uri === item.uri) return true
    return false
  }

  const activeIndex = playlist.items.findIndex(isCurrentPlayingInPlaylist)
  const currentActiveItem = activeIndex >= 0 ? playlist.items[activeIndex] : playlist.items[0]

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-20">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar</span>
      </Link>

      {/* ─── NOW PLAYING PLAYER HERO ────────── */}
      {playlist.items.length > 0 && currentActiveItem && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/90 via-black to-zinc-950 p-6 md:p-8 border border-spotify-green/40 shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-spotify-green/20 rounded-full blur-3xl pointer-events-none" />

          {/* Status header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-spotify-green font-extrabold text-xs tracking-wider uppercase">
              <span className="relative flex h-3 w-3">
                {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify-green opacity-75" />}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-spotify-green" />
              </span>
              <span>{isPlaying ? 'Tocando Agora na Playlist' : 'Playlist em Espera'}</span>
            </div>

            <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
              <Radio size={14} className="text-spotify-green animate-pulse" />
              <span>
                Faixa {Math.max(1, activeIndex + 1)} de {playlist.items.length}
              </span>
            </div>
          </div>

          {/* Hero Content Grid */}
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex-shrink-0 group">
              {currentActiveItem.imageUrl ? (
                <img
                  src={currentActiveItem.imageUrl}
                  alt={currentActiveItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Music2 size={48} className="text-spotify-green" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-white truncate tracking-tight">
                  {currentActiveItem.title}
                </h3>
                <p className="text-white/60 text-sm sm:text-base font-medium truncate flex items-center justify-center sm:justify-start gap-2 mt-1">
                  {currentActiveItem.source === 'spotify' && <span className="text-spotify-green font-bold">Spotify</span>}
                  {currentActiveItem.source === 'youtube' && <span className="text-youtube-red font-bold">YouTube</span>}
                  {currentActiveItem.source === 'tiktok' && <span className="text-tiktok-pink font-bold">TikTok</span>}
                  <span>•</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/search?q=${encodeURIComponent(currentActiveItem.subtitle)}`)
                    }}
                    className="hover:text-spotify-green hover:underline cursor-pointer transition-colors"
                    title={`Ver outras músicas de ${currentActiveItem.subtitle}`}
                  >
                    {currentActiveItem.subtitle}
                  </span>
                </p>
              </div>

              {/* Player Hero Controls */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                <button
                  onClick={() => playPrev()}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-95 border border-white/5"
                  title="Faixa Anterior"
                >
                  <SkipBack size={20} className="fill-current" />
                </button>

                <button
                  onClick={() => {
                    if (activeIndex >= 0) {
                      togglePlay()
                    } else {
                      handlePlayItem(0, false)
                    }
                  }}
                  disabled={isResolving}
                  className="flex items-center gap-2 px-8 py-3.5 bg-spotify-green hover:bg-purple-400 active:scale-95 text-black font-black rounded-full transition-all shadow-xl shadow-spotify-green/30 text-sm"
                >
                  {isResolving ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-black" />
                      <span>Carregando...</span>
                    </>
                  ) : isPlaying && activeIndex >= 0 ? (
                    <>
                      <Pause size={18} className="fill-black" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} className="fill-black ml-0.5" />
                      <span>Tocar Playlist</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => playNext()}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-95 border border-white/5"
                  title="Próxima Faixa"
                >
                  <SkipForward size={20} className="fill-current" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── PLAYLIST HEADER & MANAGEMENT TOOLBAR ────────── */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 flex-1 min-w-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
            {playlist.coverUrl ? (
              <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-spotify-green">
                <Music2 size={40} />
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-spotify-green">
              Sua Playlist Personalizada
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-white/60 text-xs sm:text-sm line-clamp-2">{playlist.description}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white/40 text-xs font-medium pt-1">
              <span className="text-white font-semibold">{playlist.items.length} faixas</span>
              <span>•</span>
              <span>Criada em {new Date(playlist.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <button
            onClick={() => handlePlayItem(0)}
            disabled={playlist.items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify-green hover:bg-purple-400 text-black font-bold text-xs transition-all shadow-lg shadow-spotify-green/20 active:scale-95 disabled:opacity-40"
          >
            <Play size={14} className="fill-black" />
            <span>Tocar Tudo</span>
          </button>

          <button
            onClick={togglePerfectTransition}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs transition-all border active:scale-95 shadow-sm',
              perfectTransition
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40 shadow-purple-500/20'
                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border-white/5'
            )}
            title={
              perfectTransition
                ? 'Transição Mágica ATIVADA: Mixagem mágica contínua e sem silêncio entre faixas'
                : 'Ativar Transição Mágica para esta playlist'
            }
          >
            <Sparkles size={14} className={cn(perfectTransition && 'text-purple-400 animate-pulse')} />
            <span>Transição Mágica: {perfectTransition ? 'Ligada' : 'Desligada'}</span>
          </button>

          <button
            onClick={() => setShowQuickAdd((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 active:scale-95"
            title="Adicionar Música"
          >
            <Plus size={14} className="text-spotify-green" />
            <span>Adicionar Música</span>
          </button>

          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs transition-all border border-white/5 active:scale-95"
            title="Renomear e Editar Playlist"
          >
            <Edit3 size={14} />
            <span>Editar</span>
          </button>

          <button
            onClick={handleSharePlaylist}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-spotify-green/20 hover:bg-spotify-green/30 text-spotify-green font-bold text-xs transition-all border border-spotify-green/40 active:scale-95 shadow-sm"
            title="Copiar URL para Compartilhar/Duplicar Playlist"
          >
            <Share2 size={14} />
            <span>Copiar Link</span>
          </button>

          <button
            onClick={handleDuplicate}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 active:scale-95"
            title="Duplicar Playlist"
          >
            <Copy size={16} />
          </button>

          <button
            onClick={handleDeletePlaylist}
            className="p-2.5 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Excluir Playlist"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Share Toast Banner */}
      {shareFeedback && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-spotify-green/10 border border-spotify-green/30 text-spotify-green text-xs font-semibold shadow-xl animate-slide-up">
          <Check size={18} className="flex-shrink-0" />
          <span className="flex-1">{shareFeedback}</span>
          <button onClick={() => setShareFeedback(null)} className="text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── QUICK ADD MUSIC FORM (EXPANDABLE) ────────── */}
      {showQuickAdd && (
        <form onSubmit={handleQuickAdd} className="p-5 rounded-2xl bg-white/[0.04] border border-spotify-green/30 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Plus size={14} className="text-spotify-green" />
              <span>Adicionar Música por Link à Playlist</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={quickUrl}
              onChange={(e) => { setQuickUrl(e.target.value); setAddError(null) }}
              placeholder="Cole o link do Spotify, YouTube ou TikTok para adicionar à playlist..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-xs focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/20"
              autoFocus
            />
            <button
              type="submit"
              disabled={isAddingTrack || !quickUrl.trim()}
              className="px-6 py-3 bg-spotify-green hover:bg-purple-400 text-black font-bold text-xs rounded-xl disabled:opacity-40 flex items-center gap-2 transition-all"
            >
              {isAddingTrack ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{isAddingTrack ? 'Adicionando...' : 'Adicionar'}</span>
            </button>
          </div>

          {addError && (
            <p className="text-red-400 text-xs">{addError}</p>
          )}
        </form>
      )}

      {/* ─── TRACKLIST & DRAG-AND-DROP REORDERING TOOLS ────────── */}
      {playlist.items.length > 0 ? (
        <div className="space-y-4">
          {/* Reordering and Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <span>Faixas ({playlist.items.length})</span>
              </h3>
              <span className="text-[11px] text-white/40 hidden sm:inline-block">
                • Arraste ou use as setas para reordenar
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => sortPlaylist(playlist.id, 'title')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-semibold transition-all border border-white/5"
                title="Ordenar por Nome da Música (A-Z)"
              >
                <SortAsc size={13} />
                <span>Nome A-Z</span>
              </button>

              <button
                onClick={() => sortPlaylist(playlist.id, 'artist')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-semibold transition-all border border-white/5"
                title="Ordenar por Artista (A-Z)"
              >
                <User size={13} />
                <span>Artista A-Z</span>
              </button>

              <button
                onClick={() => reversePlaylistOrder(playlist.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-semibold transition-all border border-white/5"
                title="Inverter Ordem das Músicas"
              >
                <ArrowUpDown size={13} />
                <span>Inverter</span>
              </button>
            </div>
          </div>

          {/* Tracks List with Native Drag & Drop */}
          <div className="space-y-1.5">
            {playlist.items.map((item, index) => {
              const isCurrent = isCurrentPlayingInPlaylist(item)
              const nextTrack = getNextTrack()
              const isNext = !isCurrent && nextTrack?.id === item.id
              const isBeingDragged = draggedIndex === index
              const isDragOver = dragOverIndex === index

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(index))
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dragOverIndex !== index) {
                      setDragOverIndex(index)
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === index) {
                      setDragOverIndex(null)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedIndex !== null && draggedIndex !== index) {
                      reorderPlaylistItems(playlist.id, draggedIndex, index)
                    }
                    setDraggedIndex(null)
                    setDragOverIndex(null)
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null)
                    setDragOverIndex(null)
                  }}
                  className={cn(
                    'group grid items-center px-4 py-2.5 rounded-2xl transition-all duration-200 border cursor-grab active:cursor-grabbing select-none',
                    isBeingDragged && 'opacity-30 scale-[0.98] border-dashed border-spotify-green bg-white/5',
                    isDragOver && 'border-spotify-green ring-2 ring-spotify-green/40 bg-spotify-green/10 scale-[1.01]',
                    !isBeingDragged && !isDragOver && isCurrent
                      ? 'bg-gradient-to-r from-spotify-green/20 via-purple-950/30 to-black border-spotify-green/50 shadow-lg text-white'
                      : !isBeingDragged && !isDragOver && isNext
                      ? 'bg-purple-500/10 border-purple-500/30 text-white hover:bg-purple-500/15'
                      : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/5 text-white/80 hover:text-white'
                  )}
                  style={{ gridTemplateColumns: '80px 1fr auto' }}
                >
                  {/* Drag Handle + Position + Quick Move Up/Down */}
                  <div className="flex items-center gap-1">
                    <span title="Clique e arraste para mudar a posição" className="flex items-center">
                      <GripVertical
                        size={14}
                        className="text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 cursor-grab"
                      />
                    </span>

                    <span
                      className={cn(
                        'text-xs font-semibold w-5 text-center',
                        isCurrent ? 'text-spotify-green font-bold' : 'text-white/40'
                      )}
                    >
                      {index + 1}
                    </span>

                    {/* Move Up / Down Buttons */}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          movePlaylistItem(playlist.id, item.id, 'up')
                        }}
                        disabled={index === 0}
                        className="p-0.5 text-white/60 hover:text-spotify-green disabled:opacity-20 disabled:hover:text-white/60 transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          movePlaylistItem(playlist.id, item.id, 'down')
                        }}
                        disabled={index === playlist.items.length - 1}
                        className="p-0.5 text-white/60 hover:text-spotify-green disabled:opacity-20 disabled:hover:text-white/60 transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Artwork & Info (Click to Play) */}
                  <div
                    onClick={() => handlePlayItem(index, true)}
                    className="flex items-center gap-3 min-w-0 pr-4 cursor-pointer"
                  >
                    {item.imageUrl || item.videoId ? (
                      <img
                        src={
                          item.imageUrl ||
                          (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : '')
                        }
                        alt={item.title}
                        onError={(e) => {
                          const target = e.currentTarget
                          if (item.videoId && !target.src.includes('mqdefault.jpg')) {
                            target.src = `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`
                          } else {
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }
                        }}
                        className={cn(
                          'w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md transition-transform',
                          isCurrent && 'ring-2 ring-spotify-green scale-105'
                        )}
                      />
                    ) : null}
                    <div
                      className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"
                      style={{ display: item.imageUrl || item.videoId ? 'none' : 'flex' }}
                    >
                      <Music2 size={18} className="text-white/40" />
                    </div>

                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-bold truncate',
                            isCurrent ? 'text-spotify-green' : 'text-white'
                          )}
                        >
                          {item.title}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0">
                            Tocando
                          </span>
                        )}
                        {isNext && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 shadow-sm">
                            <Sparkles size={10} className="text-purple-400" />
                            A Seguir
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50 text-xs truncate">
                        {item.source === 'spotify' && (
                          <span className="text-spotify-green flex items-center gap-1 font-medium">
                            <Music2 size={12} /> Spotify
                          </span>
                        )}
                        {item.source === 'youtube' && (
                          <span className="text-youtube-red flex items-center gap-1 font-medium">
                            <Youtube size={12} /> YouTube
                          </span>
                        )}
                        {item.source === 'tiktok' && (
                          <span className="text-tiktok-pink flex items-center gap-1 font-medium">
                            <TikTokIcon /> TikTok
                          </span>
                        )}
                        <span>•</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/search?q=${encodeURIComponent(item.subtitle)}`)
                          }}
                          className="truncate hover:text-spotify-green hover:underline cursor-pointer transition-colors"
                          title={`Ver outras músicas de ${item.subtitle}`}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration, Save to Another Playlist & Delete */}
                  <div className="flex items-center gap-2 justify-end pr-2">
                    {item.durationMs ? (
                      <span className="text-white/40 text-xs font-mono">
                        {formatMs(item.durationMs)}
                      </span>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTrackForSave(item)
                      }}
                      className="p-2 rounded-xl text-white/30 hover:text-spotify-green hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Copiar / Salvar em outra Playlist"
                    >
                      <FolderPlus size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItemFromCustomPlaylist(playlist.id, item.id)
                      }}
                      className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover da Playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
          <Music2 size={40} className="text-white/20 mx-auto" />
          <p className="text-white/60 text-sm">Esta playlist ainda não tem músicas.</p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-spotify-green text-black font-bold text-xs hover:bg-purple-400 transition-all shadow-lg shadow-spotify-green/20"
          >
            <Plus size={14} />
            <span>Adicionar Músicas por Link</span>
          </button>
        </div>
      )}

      {/* ─── MÚSICAS SIMILARES ─────────────────────────────────────── */}
      {playlist.items.length > 0 && (
        <div className="mt-8 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <h3 className="text-white font-bold text-base">Músicas Similares</h3>
              <span className="text-white/30 text-xs">
                • baseado no estilo desta playlist
              </span>
            </div>
            <button
              onClick={handleReloadSimilar}
              disabled={isSimilarLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
              title="Recarregar sugestões"
            >
              <RefreshCw size={13} className={isSimilarLoading ? 'animate-spin' : ''} />
              <span>{isSimilarLoading ? 'Buscando...' : 'Recarregar'}</span>
            </button>
          </div>

          {/* Loading skeleton */}
          {isSimilarLoading && similarTracks.length === 0 && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="h-2.5 bg-white/5 rounded w-1/3" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Similar tracks list */}
          {!isSimilarLoading || similarTracks.length > 0 ? (
            <div className="space-y-1">
              {similarTracks.map((track) => {
                const isAdded = addedSimilarIds.has(track.videoId)
                const alreadyInPlaylist = playlist.items.some((i) => i.videoId === track.videoId)
                return (
                  <div
                    key={track.videoId}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all"
                  >
                    {/* Thumbnail */}
                    <img
                      src={track.thumbnailUrl || `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/5"
                      onError={(e) => {
                        e.currentTarget.src = `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate leading-tight">{track.title}</p>
                      <p className="text-white/40 text-xs truncate mt-0.5">{track.channelTitle}</p>
                    </div>

                    {/* Play button */}
                    <button
                      onClick={() => {
                        const qi: QueueItem = {
                          id: track.videoId,
                          source: 'youtube',
                          title: track.title,
                          subtitle: track.channelTitle,
                          imageUrl: track.thumbnailUrl,
                          videoId: track.videoId,
                        }
                        playUniversal(qi)
                      }}
                      className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Ouvir"
                    >
                      <Play size={14} />
                    </button>

                    {/* Add button */}
                    <button
                      onClick={() => !isAdded && !alreadyInPlaylist && handleAddSimilarTrack(track)}
                      disabled={isAdded || alreadyInPlaylist}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0',
                        isAdded || alreadyInPlaylist
                          ? 'bg-spotify-green/20 text-spotify-green cursor-default'
                          : 'bg-white/5 hover:bg-spotify-green hover:text-black text-white/60 hover:shadow-lg hover:shadow-spotify-green/20'
                      )}
                      title={alreadyInPlaylist ? 'Já está na playlist' : isAdded ? 'Adicionada!' : 'Adicionar à playlist'}
                    >
                      {isAdded || alreadyInPlaylist ? (
                        <Check size={12} />
                      ) : (
                        <Plus size={12} />
                      )}
                      <span>{isAdded || alreadyInPlaylist ? 'Adicionada' : 'Adicionar'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          ) : null}

          {!isSimilarLoading && similarTracks.length === 0 && playlist.items.length > 0 && (
            <p className="text-white/30 text-sm text-center py-6">
              Não foi possível encontrar sugestões. Tente recarregar.
            </p>
          )}
        </div>
      )}

      {/* ─── MODAL DE EDIÇÃO DA PLAYLIST ────────── */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                <Edit3 size={18} className="text-spotify-green" />
                <span>Editar Playlist</span>
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Nome da Playlist *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome da sua playlist..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Adicione uma descrição para a playlist..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/20 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  URL da Imagem da Capa (Opcional)
                </label>
                <input
                  type="url"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/20"
                />
                {playlist.items[0]?.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setEditCover(playlist.items[0].imageUrl || '')}
                    className="text-[11px] text-spotify-green hover:underline font-semibold"
                  >
                    Usar capa da 1ª música da playlist
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-purple-400 text-black font-bold text-xs transition-all shadow-lg shadow-spotify-green/20 disabled:opacity-40"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Salvar Música em Outra Playlist */}
      <AddToPlaylistModal
        isOpen={Boolean(selectedTrackForSave)}
        onClose={() => setSelectedTrackForSave(null)}
        item={selectedTrackForSave}
      />
    </div>
  )
}
