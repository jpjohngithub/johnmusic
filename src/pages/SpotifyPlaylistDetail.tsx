import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Music2,
  Play,
  Pause,
  ArrowLeft,
  Loader2,
  ListPlus,
  Clock,
  Sparkles,
} from 'lucide-react'
import { importSpotifyPlaylist } from '@/api/playlistImportService'
import { usePlayerStore } from '@/store/playerStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem } from '@/types'

interface SpotifyPlaylistDetailProps {
  isAuthenticated?: boolean
  isPremium?: boolean
  onPlayTrack?: (track: any, index: number, contextUri?: string) => void
}

export function SpotifyPlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const {
    currentQueueItem,
    isPlaying,
    isResolving,
    togglePlay,
    playUniversal,
  } = usePlayerStore()

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['spotify', 'playlist-detail', id],
    queryFn: () => importSpotifyPlaylist(id!),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  })

  if (!id) return <div className="p-8 text-white/50 text-center">Playlist não encontrada</div>

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-white/40">
        <Loader2 size={32} className="animate-spin text-spotify-green" />
        <p className="text-sm">Carregando faixas da playlist...</p>
      </div>
    )
  }

  if (!playlist || playlist.items.length === 0) {
    return (
      <div className="p-12 text-center text-white/50 space-y-4">
        <p>Não foi possível carregar as faixas desta playlist.</p>
        <Link
          to="/spotify"
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
        >
          Voltar para Biblioteca Spotify
        </Link>
      </div>
    )
  }

  // Toca as faixas da playlist separadamente na fila unificada
  const handlePlayAll = async (startIndex = 0) => {
    const queueItems: QueueItem[] = playlist.items.map((i) => ({
      id: i.id,
      source: 'spotify',
      title: i.title,
      subtitle: i.subtitle,
      imageUrl: i.imageUrl,
      uri: i.uri,
      durationMs: i.durationMs,
    }))

    await playUniversal(queueItems, startIndex)
  }

  const isCurrentPlaying = (item: PlaylistItem) => {
    if (!isPlaying && !isResolving) return false
    return currentQueueItem?.title?.toLowerCase() === item.title?.toLowerCase()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-16">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Back button */}
      <Link
        to="/spotify"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar para Biblioteca Spotify</span>
      </Link>

      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl bg-white/5 flex-shrink-0 flex items-center justify-center">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-spotify-green">
              <Music2 size={64} />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-spotify-green flex items-center justify-center sm:justify-start gap-1">
            <Sparkles size={14} />
            <span>Playlist Oficial Spotify</span>
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-white/60 text-xs sm:text-sm max-w-2xl">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-white/50 text-xs font-medium">
            <span className="text-white font-semibold">{playlist.items.length} músicas separadas</span>
            <span>•</span>
            <span>Reprodução contínua no player unificado</span>
          </div>
        </div>
      </div>

      {/* Play All Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => handlePlayAll(0)}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-extrabold rounded-full transition-all shadow-xl shadow-spotify-green/20 text-sm tracking-wide"
        >
          <Play size={18} className="fill-black" />
          <span>Tocar Playlist ({playlist.items.length} faixas)</span>
        </button>
      </div>

      {/* Track list (Músicas separadas) */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-white mb-4">Lista de Faixas</h2>

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
            {playlist.items.map((item, index) => {
              const isCurrent = isCurrentPlaying(item)

              return (
                <div
                  key={item.id || index}
                  onClick={() => handlePlayAll(index)}
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
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Music2 size={18} />
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <p className={cn('text-sm font-semibold truncate', isCurrent ? 'text-spotify-green' : 'text-white')}>
                        {item.title}
                      </p>
                      <p className="text-white/40 text-xs truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  {/* Actions & Duration */}
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setModalItem(item)
                      }}
                      className="p-2 rounded-xl text-white/40 hover:text-spotify-green hover:bg-white/10 transition-colors"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus size={16} />
                    </button>

                    {item.durationMs && (
                      <span className="text-white/40 text-xs font-mono w-12 text-right">
                        {formatMs(item.durationMs)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
