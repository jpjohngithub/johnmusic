import { Link } from 'react-router-dom'
import { Music2, Youtube, Play, Sparkles, ArrowRight, Trash2 } from 'lucide-react'
import { CURATED_PUBLIC_SPOTIFY } from '@/api/spotifyUrlService'
import { SpotifyInput } from '@/components/spotify/SpotifyInput'
import { YouTubeInput } from '@/components/youtube/YouTubeInput'
import { TikTokInput } from '@/components/tiktok/TikTokInput'
import { YouTubePlayer } from '@/components/youtube/YouTubePlayer'
import { TikTokEmbed } from '@/components/tiktok/TikTokEmbed'
import { SpotifyEmbedPlayer } from '@/components/spotify/SpotifyEmbedPlayer'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

export function Home() {
  const {
    source,
    spotifySavedItem,
    youtubeVideo,
    tiktokVideo,
    playSpotifySavedItem,
    playYouTubeVideo,
    playTikTokVideo,
  } = usePlayerStore()

  const { spotifyItems, youtubeVideos, tiktokVideos, removeSpotifyItem } = useLibraryStore()

  return (
    <div className="space-y-10 max-w-7xl mx-auto select-none">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/70 via-purple-950/60 to-black p-8 md:p-12 border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-400" />
            <span>JohnMusic 2.0 • 100% Livre Sem Necessidade de Login</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Ouça músicas do <span className="text-spotify-green">Spotify</span>,{' '}
            <span className="text-youtube-red">YouTube</span> e{' '}
            <span className="text-tiktok-pink">TikTok</span>.
          </h1>

          <p className="text-white/60 text-sm md:text-base leading-relaxed">
            Cole a URL de qualquer música, playlist ou vídeo do <strong>Spotify</strong>, <strong>YouTube</strong> e <strong>TikTok</strong> e ouça direto no site sem burocracia.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-spotify-green/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-tiktok-pink/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3 URL Input Boxes (Spotify, YouTube, TikTok) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spotify Box */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-spotify-green/20 backdrop-blur-sm space-y-4 hover:border-spotify-green/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-spotify-green/20 text-spotify-green flex items-center justify-center">
                <Music2 size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Spotify URL</h3>
                <p className="text-white/40 text-xs">Música ou Playlist</p>
              </div>
            </div>
            <Link
              to="/spotify"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver todos ({spotifyItems.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <SpotifyInput />
        </div>

        {/* YouTube Box */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-youtube-red/20 backdrop-blur-sm space-y-4 hover:border-youtube-red/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-youtube-red/20 text-youtube-red flex items-center justify-center">
                <Youtube size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">YouTube URL</h3>
                <p className="text-white/40 text-xs">Vídeo ou Música</p>
              </div>
            </div>
            <Link
              to="/youtube"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver todos ({youtubeVideos.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <YouTubeInput />
        </div>

        {/* TikTok Box */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-tiktok-pink/20 backdrop-blur-sm space-y-4 hover:border-tiktok-pink/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-tiktok-pink/20 text-tiktok-pink flex items-center justify-center">
                <TikTokIcon />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">TikTok URL</h3>
                <p className="text-white/40 text-xs">Música ou Vídeo</p>
              </div>
            </div>
            <Link
              to="/tiktok"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver todos ({tiktokVideos.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <TikTokInput />
        </div>
      </div>

      {/* Active Spotify Player Preview */}
      {source === 'spotify' && spotifySavedItem && (
        <section className="p-6 rounded-3xl bg-black/80 border border-spotify-green/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spotify-green font-bold text-sm">
              <Music2 size={18} />
              <span>Tocando Agora do Spotify: {spotifySavedItem.title}</span>
            </div>
            <span className="text-white/40 text-xs">{spotifySavedItem.subtitle}</span>
          </div>
          <div className="max-w-3xl mx-auto">
            <SpotifyEmbedPlayer
              uri={`spotify:${spotifySavedItem.type}:${spotifySavedItem.spotifyId}`}
              height={spotifySavedItem.type === 'track' ? 152 : 352}
            />
          </div>
        </section>
      )}

      {/* Active YouTube Player Preview */}
      {source === 'youtube' && youtubeVideo && (
        <section className="p-6 rounded-3xl bg-black/80 border border-youtube-red/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-youtube-red font-bold text-sm">
              <Youtube size={18} />
              <span>Tocando Agora do YouTube: {youtubeVideo.title}</span>
            </div>
            <span className="text-white/40 text-xs font-mono">{youtubeVideo.channelTitle}</span>
          </div>
          <div className="max-w-4xl mx-auto">
            <YouTubePlayer video={youtubeVideo} />
          </div>
        </section>
      )}

      {/* Active TikTok Player Preview */}
      {source === 'tiktok' && tiktokVideo && (
        <section className="p-6 rounded-3xl bg-black/80 border border-tiktok-pink/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-tiktok-pink font-bold text-sm">
              <TikTokIcon />
              <span>Tocando Agora do TikTok</span>
            </div>
            <span className="text-white/40 text-xs font-mono">@{tiktokVideo.authorName}</span>
          </div>
          <TikTokEmbed video={tiktokVideo} />
        </section>
      )}

      {/* Public Curated Spotify Playlists (Zero Login) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music2 size={20} className="text-spotify-green" />
              <span>Playlists Populares do Spotify (Prontas para Ouvir)</span>
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Clique para ouvir agora</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CURATED_PUBLIC_SPOTIFY.map((item) => (
            <div
              key={item.id}
              onClick={() => playSpotifySavedItem(item)}
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

      {/* User's Saved Spotify Items */}
      {spotifyItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music2 size={20} className="text-spotify-green" />
              <span>Seus Links Salvos do Spotify</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {spotifyItems.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => playSpotifySavedItem(item)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-spotify-green/20 text-spotify-green flex items-center justify-center flex-shrink-0">
                      <Music2 size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate hover:underline">{item.title}</p>
                    <p className="text-white/40 text-[10px] truncate">{item.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeSpotifyItem(item.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved YouTube Videos Grid */}
      {youtubeVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Youtube size={20} className="text-youtube-red" />
              <span>Vídeos Salvos do YouTube</span>
            </h2>
            <Link
              to="/youtube"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver Biblioteca Completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {youtubeVideos.slice(0, 4).map((video) => (
              <div
                key={video.id}
                onClick={() => playYouTubeVideo(video)}
                className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-md">
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
                <p className="text-white text-xs font-semibold truncate leading-snug">{video.title}</p>
                <p className="text-white/40 text-[11px] truncate">{video.channelTitle}</p>
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
              <span>Vídeos Salvos do TikTok</span>
            </h2>
            <Link
              to="/tiktok"
              className="text-white/40 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ver Biblioteca Completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tiktokVideos.slice(0, 6).map((video) => (
              <div
                key={video.id}
                onClick={() => playTikTokVideo(video)}
                className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col items-center"
              >
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-md">
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
                <p className="text-white text-xs font-semibold truncate w-full text-center leading-tight">
                  {video.title || 'TikTok'}
                </p>
                <p className="text-white/40 text-[10px] truncate w-full text-center">
                  @{video.authorName}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
