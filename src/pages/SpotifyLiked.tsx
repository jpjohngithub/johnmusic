import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, Play, ArrowLeft } from 'lucide-react'
import { getAllLikedSongs } from '@/api/spotifyService'
import { TrackList } from '@/components/spotify/TrackList'
import { usePlayerStore } from '@/store/playerStore'
import type { SpotifyTrack } from '@/types'

interface SpotifyLikedProps {
  isAuthenticated?: boolean
  onPlayTrack?: (track: SpotifyTrack, index: number) => void
}

export function SpotifyLiked({ isAuthenticated = false, onPlayTrack }: SpotifyLikedProps) {
  const { spotifyTrack, isPlaying, playUniversal } = usePlayerStore()

  const { data: likedItems = [], isLoading } = useQuery({
    queryKey: ['spotify', 'liked-songs'],
    queryFn: getAllLikedSongs,
    enabled: isAuthenticated,
  })

  const tracks: SpotifyTrack[] = likedItems
    .map((item) => item.track)
    .filter((track): track is SpotifyTrack => track !== null)

  const handlePlayTrackInternal = (track: SpotifyTrack, index: number) => {
    if (onPlayTrack) {
      onPlayTrack(track, index)
    } else {
      playUniversal(
        tracks.map((t) => ({
          id: t.id,
          source: 'spotify',
          title: t.name,
          subtitle: t.artists.map((a) => a.name).join(', '),
          imageUrl: t.album.images?.[0]?.url || '',
          uri: t.uri,
          durationMs: t.duration_ms,
        })),
        index
      )
    }
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrackInternal(tracks[0], 0)
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-indigo-900/60 to-transparent p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <Heart size={80} className="fill-white" />
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Coleção Pessoal
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Músicas Curtidas
          </h1>
          <p className="text-white/50 text-xs sm:text-sm">
            {tracks.length} músicas salvas no seu perfil do Spotify
          </p>
        </div>
      </div>

      {/* Play All Button */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-extrabold rounded-full transition-all shadow-xl shadow-spotify-green/20 text-sm tracking-wide"
          >
            <Play size={18} className="fill-black" />
            <span>Tocar Curtidas</span>
          </button>
        </div>
      )}

      {/* Track List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-white/40">
            Carregando suas músicas curtidas...
          </div>
        ) : (
          <TrackList
            tracks={tracks}
            currentTrackId={spotifyTrack?.id}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrackInternal}
            showArtwork
          />
        )}
      </div>
    </div>
  )
}
