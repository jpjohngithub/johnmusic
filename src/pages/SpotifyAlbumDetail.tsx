import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Disc3, ArrowLeft } from 'lucide-react'
import { getAlbum } from '@/api/spotifyService'
import { TrackList } from '@/components/spotify/TrackList'
import { SpotifyEmbedPlayer } from '@/components/spotify/SpotifyEmbedPlayer'
import { usePlayerStore } from '@/store/playerStore'
import { getImageUrl } from '@/lib/utils'
import type { SpotifyTrack } from '@/types'

interface SpotifyAlbumDetailProps {
  isAuthenticated?: boolean
  onPlayTrack?: (track: SpotifyTrack, index: number, contextUri?: string) => void
}

export function SpotifyAlbumDetail({
  isAuthenticated = false,
  onPlayTrack,
}: SpotifyAlbumDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { spotifyTrack, isPlaying, playUniversal } = usePlayerStore()

  const { data: album, isLoading } = useQuery({
    queryKey: ['spotify', 'album', id],
    queryFn: () => getAlbum(id!),
    enabled: isAuthenticated && Boolean(id),
  })

  if (!id) return <div>Álbum não encontrado</div>

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        Carregando detalhes do álbum...
      </div>
    )
  }

  if (!album) return <div>Álbum não encontrado</div>

  const tracks: SpotifyTrack[] = album.tracks.items.map((t) => ({
    ...t,
    album: {
      id: album.id,
      name: album.name,
      uri: album.uri,
      images: album.images,
      release_date: album.release_date,
      artists: album.artists,
      total_tracks: album.total_tracks,
    },
  }))

  const coverUrl = getImageUrl(album.images)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Link
        to="/spotify"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar para Biblioteca</span>
      </Link>

      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl bg-white/5 flex-shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt={album.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#282828]">
              <Disc3 size={64} className="text-white/20" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-spotify-green">
            Álbum
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {album.name}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-white/50 text-xs font-medium">
            <span className="text-white font-semibold">
              {album.artists.map((a) => a.name).join(', ')}
            </span>
            <span>•</span>
            <span>{album.release_date?.slice(0, 4)}</span>
            <span>•</span>
            <span>{tracks.length} músicas</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Player Oficial Embutido</p>
        <SpotifyEmbedPlayer albumId={album.id} height={352} />
      </div>

      <div className="pt-4">
        <h2 className="text-lg font-bold text-white mb-4">Lista de Faixas</h2>
        <TrackList
          tracks={tracks}
          currentTrackId={spotifyTrack?.id}
          isPlaying={isPlaying}
          onPlayTrack={(track, index) => {
            if (onPlayTrack) {
              onPlayTrack(track, index, album.uri)
            } else {
              playUniversal(
                tracks.map((t) => ({
                  id: t.id,
                  source: 'spotify',
                  title: t.name,
                  subtitle: t.artists.map((a) => a.name).join(', '),
                  imageUrl: t.album.images?.[0]?.url || coverUrl,
                  uri: t.uri,
                  durationMs: t.duration_ms,
                })),
                index,
                true
              )
            }
          }}
          showAlbum={false}
        />
      </div>
    </div>
  )
}
