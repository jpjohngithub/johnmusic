import { useState } from 'react'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { executeUniversalSearch, type UniversalTrackResult } from '@/api/universalSearchService'
import { SpotifyIFramePlayer } from '@/components/spotify/SpotifyIFramePlayer'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'
import { formatMs, cn } from '@/lib/utils'
import type { SpotifyTrack, AudioTrack } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

type SearchFilterType = 'all' | 'tracks' | 'playlists' | 'youtube' | 'tiktok'

interface SearchProps {
  isAuthenticated: boolean
  onPlayTrack: (track: SpotifyTrack, index: number, contextUri?: string) => void
}

export function Search({ isAuthenticated, onPlayTrack }: SearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filterType, setFilterType] = useState<SearchFilterType>('all')

  const {
    audioTrack,
    spotifyTrack,
    spotifySavedItem,
    isPlaying,
    playAudioTrack,
    playSpotifySavedItem,
    playYouTubeVideo,
    playTikTokVideo,
  } = usePlayerStore()

  const { spotifyItems, youtubeVideos, tiktokVideos, customPlaylists, addSpotifyItem } =
    useLibraryStore()

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

  // Handle Track Click -> Play direct audio stream!
  const handleTrackClick = (track: UniversalTrackResult, index: number) => {
    if (track.rawTrack && isAuthenticated) {
      onPlayTrack(track.rawTrack, index)
    } else if (track.previewUrl) {
      const directAudio: AudioTrack = {
        id: track.id,
        title: track.name,
        artist: track.artistName,
        album: track.albumName,
        artworkUrl: track.artworkUrl,
        audioUrl: track.previewUrl,
        durationMs: track.durationMs,
        externalUrl: track.spotifyUrl,
      }
      playAudioTrack(directAudio)
    } else if (track.spotifyUri) {
      const spotifyId = track.spotifyUri.split(':')?.[2] || track.id
      playSpotifySavedItem({
        id: track.id,
        type: 'track',
        spotifyId,
        title: track.name,
        subtitle: track.artistName,
        thumbnailUrl: track.artworkUrl,
        url: track.spotifyUrl || `https://open.spotify.com/track/${spotifyId}`,
        embedUrl: `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`,
        addedAt: new Date().toISOString(),
      })
    }
  }

  const showTracks = filterType === 'all' || filterType === 'tracks'
  const showPlaylists = filterType === 'all' || filterType === 'playlists'
  const showYouTube = filterType === 'all' || filterType === 'youtube'
  const showTikTok = filterType === 'all' || filterType === 'tiktok'

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
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
                <button
                  onClick={() => addSpotifyItem(searchData.directSpotifyItem!)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-spotify-green text-black font-bold text-xs rounded-full hover:bg-green-400 transition-all shadow-md"
                >
                  <Plus size={14} />
                  <span>Salvar na Biblioteca</span>
                </button>
              </div>

              <div className="max-w-3xl mx-auto">
                <SpotifyIFramePlayer
                  key={searchData.directSpotifyItem.spotifyId}
                  spotifyUri={`spotify:${searchData.directSpotifyItem.type}:${searchData.directSpotifyItem.spotifyId}`}
                  height={searchData.directSpotifyItem.type === 'track' ? 152 : 352}
                />
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
                    <Link
                      key={pl.id}
                      to={`/playlist/${pl.id}`}
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
                    </Link>
                  ))}

                  {/* Spotify Catalog Playlists */}
                  {searchData?.playlists?.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => playSpotifySavedItem(playlist)}
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

          {/* Tracks List Result */}
          {showTracks && searchData?.tracks && searchData.tracks.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Music2 size={20} className="text-spotify-green" />
                <span>Músicas ({searchData.tracks.length})</span>
              </h2>

              <div className="w-full select-none">
                <div className="grid items-center px-4 pb-2 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider grid-cols-[40px_1fr_auto]">
                  <span className="text-center">#</span>
                  <span>Título / Artista</span>
                  <div className="flex items-center gap-1 justify-end pr-2">
                    <Clock size={14} />
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {searchData.tracks.map((track, index) => {
                    const isCurrentPlaying =
                      (audioTrack?.title.toLowerCase() === track.name.toLowerCase() && isPlaying) ||
                      (spotifyTrack?.name.toLowerCase() === track.name.toLowerCase() && isPlaying)

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTrackClick(track, index)}
                        className={cn(
                          'group grid items-center px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                          'hover:bg-white/10',
                          isCurrentPlaying ? 'bg-white/10 text-spotify-green' : 'text-white'
                        )}
                        style={{ gridTemplateColumns: '40px 1fr auto' }}
                      >
                        <div className="flex items-center justify-center">
                          {isCurrentPlaying ? (
                            <div className="flex gap-0.5 items-end h-3.5">
                              <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '60%' }} />
                              <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '100%' }} />
                              <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '40%' }} />
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-white/40 group-hover:hidden">
                                {index + 1}
                              </span>
                              <Play
                                size={14}
                                className="hidden group-hover:block text-white fill-white transition-transform transform active:scale-90"
                              />
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          {track.artworkUrl && (
                            <img
                              src={track.artworkUrl}
                              alt={track.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-sm font-semibold truncate',
                                isCurrentPlaying ? 'text-spotify-green' : 'text-white'
                              )}
                            >
                              {track.name}
                            </p>
                            <p className="text-white/50 text-xs truncate">
                              {track.artistName}
                              {track.albumName && ` • ${track.albumName}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pr-2">
                          <span className="text-white/40 text-xs font-mono">
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

          {/* YouTube Matches */}
          {showYouTube && matchedYouTube.length > 0 && (
            <section className="space-y-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 text-youtube-red">
                <Youtube size={18} />
                <span>Vídeos do YouTube ({matchedYouTube.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchedYouTube.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => playYouTubeVideo(video)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-white/5"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{video.title}</p>
                      <p className="text-white/40 text-[10px] truncate">{video.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TikTok Matches */}
          {showTikTok && matchedTikTok.length > 0 && (
            <section className="space-y-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 text-tiktok-pink">
                <TikTokIcon />
                <span>Vídeos do TikTok ({matchedTikTok.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchedTikTok.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => playTikTokVideo(video)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-tiktok-pink/20 text-tiktok-pink flex items-center justify-center flex-shrink-0">
                      <TikTokIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{video.title || 'TikTok'}</p>
                      <p className="text-white/40 text-[10px] truncate">@{video.authorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty State / Suggestions */}
      {!debouncedQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-8">
          {[
            { label: 'Pop & Hits', color: 'from-pink-600 to-purple-800' },
            { label: 'Hip-Hop & Trap', color: 'from-orange-600 to-amber-800' },
            { label: 'Rock & Metal', color: 'from-red-700 to-zinc-900' },
            { label: 'Eletrônica & Dance', color: 'from-cyan-600 to-blue-900' },
            { label: 'Sertanejo & Piseiro', color: 'from-emerald-600 to-teal-900' },
            { label: 'Funk & Brega Funk', color: 'from-yellow-600 to-red-800' },
            { label: 'Acústico & Lo-Fi', color: 'from-indigo-600 to-slate-900' },
            { label: 'Viral no TikTok', color: 'from-rose-600 to-pink-900' },
          ].map((cat) => (
            <div
              key={cat.label}
              onClick={() => {
                setQuery(cat.label)
                setDebouncedQuery(cat.label)
              }}
              className={`h-32 rounded-2xl bg-gradient-to-br ${cat.color} p-4 flex flex-col justify-between cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl`}
            >
              <span className="text-white font-extrabold text-base tracking-tight leading-tight">
                {cat.label}
              </span>
              <Sparkles size={18} className="text-white/40 self-end" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
