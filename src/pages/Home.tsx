import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Music2,
  Youtube,
  Play,
  Sparkles,
  ArrowRight,
  Trash2,
  Search,
  Plus,
  Layers,
  ListPlus,
  Loader2,
} from 'lucide-react'
import { CURATED_PUBLIC_SPOTIFY, isValidSpotifyUrl, createSpotifyItemFromUrl } from '@/api/spotifyUrlService'
import { isValidYouTubeUrl, createYouTubeVideoFromUrl } from '@/api/youtubeService'
import { isValidTikTokUrl, createTikTokVideoFromUrl } from '@/api/tiktokService'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import type { PlaylistItem, QueueItem, SpotifySavedItem, YouTubeVideo, TikTokVideo } from '@/types'

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

  const { playUniversal } = usePlayerStore()
  const {
    spotifyItems,
    youtubeVideos,
    tiktokVideos,
    customPlaylists,
    addSpotifyItem,
    addYouTubeVideo,
    addTikTokVideo,
    removeSpotifyItem,
    removeYouTubeVideo,
    removeTikTokVideo,
  } = useLibraryStore()

  // Processa URL ou redireciona busca universal
  const handleUniversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = universalInput.trim()
    if (!val) return

    setIsProcessing(true)
    setInputFeedback(null)

    try {
      if (isValidSpotifyUrl(val)) {
        const item = await createSpotifyItemFromUrl(val)
        addSpotifyItem(item)
        setUniversalInput('')
        setInputFeedback('Música/Playlist do Spotify adicionada!')
        // Toca imediatamente
        const queueItem: QueueItem = {
          id: item.id,
          source: 'spotify',
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.thumbnailUrl,
          uri: `spotify:${item.type}:${item.spotifyId}`,
        }
        await playUniversal([queueItem], 0)
      } else if (isValidYouTubeUrl(val)) {
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
        const video = await createTikTokVideoFromUrl(val)
        addTikTokVideo(video)
        setUniversalInput('')
        setInputFeedback('Som do TikTok adicionado!')
        const queueItem: QueueItem = {
          id: video.id,
          source: 'tiktok',
          title: video.title,
          subtitle: `@${video.authorName}`,
          imageUrl: video.thumbnailUrl,
          tiktokPostId: video.postId,
          tiktokUrl: video.url,
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

  // Toca itens salvos pelo motor unificado
  const playSavedSpotify = async (item: SpotifySavedItem) => {
    const queueItem: QueueItem = {
      id: item.id,
      source: 'spotify',
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.thumbnailUrl,
      uri: `spotify:${item.type}:${item.spotifyId}`,
    }
    await playUniversal([queueItem], 0)
  }

  const playSavedYouTube = async (video: YouTubeVideo) => {
    const queueItem: QueueItem = {
      id: video.id,
      source: 'youtube',
      title: video.title,
      subtitle: video.channelTitle,
      imageUrl: video.thumbnailUrl,
      videoId: video.videoId,
    }
    await playUniversal([queueItem], 0)
  }

  const playSavedTikTok = async (video: TikTokVideo) => {
    const queueItem: QueueItem = {
      id: video.id,
      source: 'tiktok',
      title: video.title || 'TikTok Music',
      subtitle: `@${video.authorName}`,
      imageUrl: video.thumbnailUrl,
      tiktokPostId: video.postId,
      tiktokUrl: video.url,
    }
    await playUniversal([queueItem], 0)
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto select-none pb-16">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Hero Banner Unificado */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/80 via-purple-950/60 to-black p-8 md:p-12 border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-400" />
            <span>JohnMusic 2.0 • Reprodução Unificada Spotify + YouTube + TikTok</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Todas as suas músicas juntas em um só player.
          </h1>

          <p className="text-white/60 text-sm md:text-base leading-relaxed">
            Pesquise qualquer artista ou cole qualquer link do <strong className="text-spotify-green">Spotify</strong>, <strong className="text-youtube-red">YouTube</strong> ou <strong className="text-tiktok-pink">TikTok</strong>. Todas as faixas tocam em fila contínua sem parar.
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
                placeholder="Cole um link do Spotify, YouTube, TikTok ou busque qualquer música..."
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
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-spotify-green/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-tiktok-pink/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Seção de Playlists Multiplataforma Personalizadas */}
      {customPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers size={20} className="text-spotify-green" />
                <span>Suas Playlists Multiplataforma ({customPlaylists.length})</span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Faixas de qualquer plataforma tocando em harmonia</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {customPlaylists.map((pl) => (
              <Link
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-spotify-green/20 space-y-2 flex flex-col justify-between"
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

      {/* Curated Spotify Playlists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music2 size={20} className="text-spotify-green" />
              <span>Playlists Populares (Spotify)</span>
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Toque instantaneamente sem login</p>
          </div>
          <Link
            to="/spotify"
            className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Ver Biblioteca Spotify</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CURATED_PUBLIC_SPOTIFY.map((item) => (
            <div
              key={item.id}
              onClick={() => playSavedSpotify(item)}
              className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col justify-between"
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
          ))}
        </div>
      </section>

      {/* Saved YouTube Videos Grid */}
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
                  onClick={() => playSavedYouTube(video)}
                  className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md cursor-pointer"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-youtube-red flex items-center justify-center shadow-lg">
                      <Play size={18} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p
                    onClick={() => playSavedYouTube(video)}
                    className="text-white text-xs font-semibold truncate leading-snug cursor-pointer hover:underline"
                  >
                    {video.title}
                  </p>
                  <p className="text-white/40 text-[11px] truncate">{video.channelTitle}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() =>
                      setModalItem({
                        id: video.id,
                        source: 'youtube',
                        title: video.title,
                        subtitle: video.channelTitle,
                        imageUrl: video.thumbnailUrl,
                        videoId: video.videoId,
                        url: video.url,
                        addedAt: new Date().toISOString(),
                      })
                    }
                    className="p-1 text-white/40 hover:text-spotify-green text-xs flex items-center gap-1 transition-colors"
                    title="Adicionar à Playlist"
                  >
                    <ListPlus size={14} />
                    <span className="text-[10px]">Playlist</span>
                  </button>
                  <button
                    onClick={() => removeYouTubeVideo(video.id)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved TikTok Videos Grid */}
      {tiktokVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-tiktok-pink"><TikTokIcon /></span>
              <span>Sons do TikTok Salvos ({tiktokVideos.length})</span>
            </h2>
            <Link
              to="/tiktok"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver Todos</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tiktokVideos.slice(0, 6).map((video) => (
              <div
                key={video.id}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 space-y-2 flex flex-col justify-between"
              >
                <div
                  onClick={() => playSavedTikTok(video)}
                  className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-md cursor-pointer"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-tiktok-pink opacity-50">
                      <TikTokIcon />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-tiktok-pink flex items-center justify-center shadow-lg">
                      <Play size={18} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <p
                    onClick={() => playSavedTikTok(video)}
                    className="text-white text-xs font-semibold truncate cursor-pointer hover:underline"
                  >
                    {video.title || 'TikTok'}
                  </p>
                  <p className="text-white/40 text-[10px] truncate">@{video.authorName}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    onClick={() =>
                      setModalItem({
                        id: video.id,
                        source: 'tiktok',
                        title: video.title || 'TikTok Music',
                        subtitle: `@${video.authorName}`,
                        imageUrl: video.thumbnailUrl,
                        tiktokPostId: video.postId,
                        url: video.url,
                        addedAt: new Date().toISOString(),
                      })
                    }
                    className="p-1 text-white/40 hover:text-tiktok-pink transition-colors"
                    title="Adicionar à Playlist"
                  >
                    <ListPlus size={13} />
                  </button>
                  <button
                    onClick={() => removeTikTokVideo(video.id)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
