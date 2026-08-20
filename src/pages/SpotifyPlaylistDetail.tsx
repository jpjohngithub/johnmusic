import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Music2, Play, Heart, Clock, ArrowLeft, Share2 } from 'lucide-react'
import { getPlaylist, getAllPlaylistTracks } from '@/api/spotifyService'
import { TrackList } from '@/components/spotify/TrackList'
import { SpotifyEmbedPlayer } from '@/components/spotify/SpotifyEmbedPlayer'
import { usePlayerStore } from '@/store/playerStore'
import { getImageUrl } from '@/lib/utils'
import type { SpotifyTrack } from '@/types'

interface SpotifyPlaylistDetailProps {
  isAuthenticated: boolean
  isPremium: boolean
  onPlayTrack: (track: SpotifyTrack, index: number, contextUri?: string) => void
}

export function SpotifyPlaylistDetail({
  isAuthenticated,
  isPremium,
  onPlayTrack,
}: SpotifyPlaylistDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { spotifyTrack, isPlaying } = usePlayerStore()

  const { data: playlist, isLoading: loadingPlaylist } = useQuery({
    queryKey: ['spotify', 'playlist', id],
    queryFn: () => getPlaylist(id!),
    enabled: isAuthenticated && Boolean(id),
  })

  const { data: playlistTracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ['spotify', 'playlist-tracks', id],
    queryFn: () => getAllPlaylistTracks(id!),
    enabled: isAuthenticated && Boolean(id),
  })

  if (!id) return <div>Playlist não encontrada</div>

  if (loadingPlaylist || loadingTracks) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        Carregando detalhes da playlist...
      </div>
    )
  }

  if (!playlist) return <div>Playlist não encontrada</div>

  const tracks: SpotifyTrack[] = playlistTracks
    .map((item) => item.track)
    .filter((track): track is SpotifyTrack => track !== null)

  const coverUrl = getImageUrl(playlist.images)

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], 0, playlist.uri)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to="/spotify"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar para Biblioteca</span>
      </Link>

      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl bg-white/5 flex-shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#282828]">
              <Music2 size={64} className="text-white/20" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-spotify-green">
            Playlist Spotify
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-white/60 text-xs sm:text-sm max-w-2xl line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-white/50 text-xs font-medium">
            <span className="text-white font-semibold">{playlist.owner.display_name}</span>
            <span>•</span>
            <span>{tracks.length} músicas</span>
          </div>
        </div>
      </div>

      {/* Play Controls & Embed */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-extrabold rounded-full transition-all shadow-xl shadow-spotify-green/20 text-sm tracking-wide"
        >
          <Play size={18} className="fill-black" />
          <span>Tocar Playlist</span>
        </button>
      </div>

      {/* Embed Player fallback (useful for full song playback on free accounts or quick preview) */}
      <div className="space-y-2">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Player Oficial Embutido</p>
        <SpotifyEmbedPlayer playlistId={playlist.id} height={352} />
      </div>

      {/* Track list */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-white mb-4">Lista de Faixas</h2>
        <TrackList
          tracks={tracks}
          currentTrackId={spotifyTrack?.id}
          isPlaying={isPlaying}
          onPlayTrack={(track, index) => onPlayTrack(track, index, playlist.uri)}
          showArtwork
        />
      </div>
    </div>
  )
}
