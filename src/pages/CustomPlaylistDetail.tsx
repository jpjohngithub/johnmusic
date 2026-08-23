import { useState } from 'react'
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
  Sparkles,
  Radio,
} from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { formatMs, cn } from '@/lib/utils'
import type { PlaylistItem, SpotifySavedItem, YouTubeVideo, TikTokVideo, AudioTrack } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

export function CustomPlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customPlaylists, deleteCustomPlaylist, removeItemFromCustomPlaylist } = useLibraryStore()
  const {
    source,
    audioTrack,
    spotifySavedItem,
    youtubeVideo,
    tiktokVideo,
    isPlaying,
    togglePlay,
    playAudioTrack,
    playSpotifySavedItem,
    playYouTubeVideo,
    playTikTokVideo,
    setQueue,
  } = usePlayerStore()

  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0)

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

  const handleDeletePlaylist = () => {
    if (window.confirm(`Tem certeza que deseja excluir a playlist "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id)
      navigate('/')
    }
  }

  // Play a specific item in the playlist
  const handlePlayItem = (item: PlaylistItem, index: number) => {
    setCurrentPlayingIndex(index)

    // Set full playlist as active queue
    const queueItems = playlist.items.map((i) => ({
      id: i.id,
      source: i.source,
      title: i.title,
      subtitle: i.subtitle,
      imageUrl: i.imageUrl,
      uri: i.uri,
      videoId: i.videoId,
      tiktokPostId: i.tiktokPostId,
      tiktokUrl: i.url,
    }))
    setQueue(queueItems, index)

    if (item.source === 'spotify') {
      const spotifyId = item.uri?.split(':')?.[2] || item.id
      const savedItem: SpotifySavedItem = {
        id: item.id,
        type: item.uri?.includes('playlist') ? 'playlist' : 'track',
        spotifyId,
        title: item.title,
        subtitle: item.subtitle,
        thumbnailUrl: item.imageUrl,
        url: item.url || `https://open.spotify.com/track/${spotifyId}`,
        embedUrl: `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`,
        addedAt: item.addedAt,
      }
      playSpotifySavedItem(savedItem)
    } else if (item.source === 'audio') {
      const audio: AudioTrack = {
        id: item.id,
        title: item.title,
        artist: item.subtitle,
        artworkUrl: item.imageUrl,
        audioUrl: item.url || '',
        durationMs: item.durationMs,
      }
      playAudioTrack(audio)
    } else if (item.source === 'youtube') {
      const video: YouTubeVideo = {
        id: item.id,
        videoId: item.videoId || item.id,
        title: item.title,
        channelTitle: item.subtitle,
        thumbnailUrl: item.imageUrl,
        url: item.url || '',
        addedAt: item.addedAt,
      }
      playYouTubeVideo(video)
    } else if (item.source === 'tiktok') {
      const video: TikTokVideo = {
        id: item.id,
        postId: item.tiktokPostId || item.id,
        title: item.title,
        authorName: item.subtitle,
        thumbnailUrl: item.imageUrl,
        url: item.url || '',
        embedHtml: '',
        addedAt: item.addedAt,
      }
      playTikTokVideo(video)
    }
  }

  // Play Next / Previous in this playlist
  const handleNextTrack = () => {
    if (playlist.items.length === 0) return
    const nextIdx = (currentPlayingIndex + 1) % playlist.items.length
    handlePlayItem(playlist.items[nextIdx], nextIdx)
  }

  const handlePrevTrack = () => {
    if (playlist.items.length === 0) return
    const prevIdx = (currentPlayingIndex - 1 + playlist.items.length) % playlist.items.length
    handlePlayItem(playlist.items[prevIdx], prevIdx)
  }

  // Determine current active item from player state
  const isCurrentPlayingInPlaylist = (item: PlaylistItem) => {
    if (!isPlaying) return false
    if (source === 'audio' && audioTrack?.title.toLowerCase() === item.title.toLowerCase()) return true
    if (source === 'spotify' && spotifySavedItem?.title.toLowerCase() === item.title.toLowerCase()) return true
    if (source === 'youtube' && youtubeVideo?.videoId === (item.videoId || item.id)) return true
    if (source === 'tiktok' && tiktokVideo?.postId === (item.tiktokPostId || item.id)) return true
    return false
  }

  const activePlaylistItem = playlist.items.find(isCurrentPlayingInPlaylist) || playlist.items[currentPlayingIndex]

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-12">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar</span>
      </Link>

      {/* ─── SPECIAL NOW PLAYING PLAYLIST PLAYER HERO ────────── */}
      {playlist.items.length > 0 && activePlaylistItem && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-black to-zinc-950 p-6 md:p-8 border border-spotify-green/40 shadow-2xl space-y-6">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-spotify-green/20 rounded-full blur-3xl pointer-events-none" />

          {/* Status header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-spotify-green font-extrabold text-xs tracking-wider uppercase">
              <span className="relative flex h-3 w-3">
                {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify-green opacity-75" />}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-spotify-green" />
              </span>
              <span>{isPlaying ? 'Tocando Agora na Playlist' : 'Playlist em Pausa'}</span>
            </div>

            <span className="text-white/40 text-xs font-medium">
              Faixa {currentPlayingIndex + 1} de {playlist.items.length}
            </span>
          </div>

          {/* Hero Track Details & Waveform */}
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Artwork with glow */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex-shrink-0 flex items-center justify-center">
              {activePlaylistItem.imageUrl ? (
                <img
                  src={activePlaylistItem.imageUrl}
                  alt={activePlaylistItem.title}
                  className={cn(
                    'w-full h-full object-cover transition-transform duration-700',
                    isPlaying && 'scale-105'
                  )}
                />
              ) : (
                <div className="text-spotify-green">
                  <Music2 size={56} />
                </div>
              )}

              {/* Animated Equalizer Wave Overlay */}
              {isPlaying && (
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-center gap-1 h-8 bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10">
                  <span className="w-1.5 bg-spotify-green rounded-full animate-[bounce_0.6s_infinite] h-full" />
                  <span className="w-1.5 bg-spotify-green rounded-full animate-[bounce_0.8s_infinite] h-3/4" />
                  <span className="w-1.5 bg-spotify-green rounded-full animate-[bounce_0.5s_infinite] h-full" />
                  <span className="w-1.5 bg-spotify-green rounded-full animate-[bounce_0.9s_infinite] h-2/3" />
                  <span className="w-1.5 bg-spotify-green rounded-full animate-[bounce_0.7s_infinite] h-5/6" />
                </div>
              )}
            </div>

            {/* Track Info & Interactive Player Controls */}
            <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
              <div>
                <span className="text-xs font-semibold text-spotify-green flex items-center justify-center md:justify-start gap-1">
                  <Radio size={14} /> {activePlaylistItem.source.toUpperCase()}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate mt-1">
                  {activePlaylistItem.title}
                </h2>
                <p className="text-white/60 text-sm font-medium truncate mt-0.5">
                  {activePlaylistItem.subtitle}
                </p>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
                <button
                  onClick={handlePrevTrack}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-95 border border-white/5"
                  title="Faixa Anterior"
                >
                  <SkipBack size={20} className="fill-current" />
                </button>

                <button
                  onClick={() => {
                    if (isCurrentPlayingInPlaylist(activePlaylistItem)) {
                      togglePlay()
                    } else {
                      handlePlayItem(activePlaylistItem, currentPlayingIndex)
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3.5 bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-black rounded-full transition-all shadow-xl shadow-spotify-green/30 text-sm"
                >
                  {isPlaying && isCurrentPlayingInPlaylist(activePlaylistItem) ? (
                    <>
                      <Pause size={18} className="fill-black" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} className="fill-black ml-0.5" />
                      <span>Tocar Agora</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-95 border border-white/5"
                  title="Próxima Faixa"
                >
                  <SkipForward size={20} className="fill-current" />
                </button>
              </div>

              {/* Next Track Preview */}
              {playlist.items.length > 1 && (
                <p className="text-[11px] text-white/40 truncate">
                  <strong className="text-white/60 font-semibold">A seguir:</strong>{' '}
                  {playlist.items[(currentPlayingIndex + 1) % playlist.items.length]?.title}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Playlist Meta Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-xl bg-white/5 flex-shrink-0 flex items-center justify-center">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-spotify-green">
              <Music2 size={40} />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-spotify-green flex items-center justify-center sm:justify-start gap-1">
            <Sparkles size={12} />
            <span>Playlist</span>
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-white/60 text-xs sm:text-sm max-w-2xl">{playlist.description}</p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 text-white/40 text-xs">
            <span className="text-white font-semibold">{playlist.items.length} itens</span>
            <span>•</span>
            <span>Criada em {new Date(playlist.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          onClick={handleDeletePlaylist}
          className="p-2.5 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors self-center sm:self-end"
          title="Excluir Playlist"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Items list with Active Glow */}
      {playlist.items.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Faixas da Playlist</h2>

          <div className="w-full select-none space-y-1.5">
            {playlist.items.map((item, index) => {
              const isCurrent = isCurrentPlayingInPlaylist(item)

              return (
                <div
                  key={item.id}
                  onClick={() => handlePlayItem(item, index)}
                  className={cn(
                    'group grid items-center px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 border',
                    isCurrent
                      ? 'bg-gradient-to-r from-spotify-green/20 via-emerald-900/20 to-black border-spotify-green/50 shadow-lg text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/5 text-white/80 hover:text-white'
                  )}
                  style={{ gridTemplateColumns: '40px 1fr auto' }}
                >
                  {/* Number / Equalizer Animation / Play Icon */}
                  <div className="flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-4">
                        <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '70%' }} />
                        <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '100%' }} />
                        <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '40%' }} />
                      </div>
                    ) : (
                      <>
                        <span
                          className={cn(
                            'text-xs font-semibold group-hover:hidden',
                            isCurrent ? 'text-spotify-green font-bold' : 'text-white/40'
                          )}
                        >
                          {index + 1}
                        </span>
                        <Play
                          size={14}
                          className={cn(
                            'hidden group-hover:block',
                            isCurrent ? 'text-spotify-green fill-spotify-green' : 'text-white fill-white'
                          )}
                        />
                      </>
                    )}
                  </div>

                  {/* Artwork & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className={cn(
                          'w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md transition-transform',
                          isCurrent && 'ring-2 ring-spotify-green scale-105'
                        )}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Music2 size={18} />
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
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
                          <span className="px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-[10px] font-extrabold uppercase tracking-wider">
                            Tocando
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
                        <span className="truncate">{item.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Delete */}
                  <div className="flex items-center gap-3 justify-end pr-2">
                    {item.durationMs && (
                      <span className="text-white/40 text-xs font-mono">
                        {formatMs(item.durationMs)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItemFromCustomPlaylist(playlist.id, item.id)
                      }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remover da playlist"
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
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-spotify-green text-black font-bold text-xs hover:bg-green-400 transition-all shadow-lg shadow-spotify-green/20"
          >
            <Plus size={14} />
            <span>Buscar e Adicionar Músicas</span>
          </Link>
        </div>
      )}
    </div>
  )
}
