import { useState } from 'react'
import { Play, Clock, FolderPlus } from 'lucide-react'
import { formatMs, cn } from '@/lib/utils'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import type { SpotifyTrack, PlaylistItem } from '@/types'

interface TrackListProps {
  tracks: SpotifyTrack[]
  currentTrackId?: string
  isPlaying?: boolean
  onPlayTrack: (track: SpotifyTrack, index: number) => void
  showAlbum?: boolean
  showArtwork?: boolean
  numbered?: boolean
}

export function TrackList({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  showAlbum = true,
  showArtwork = false,
  numbered = true,
}: TrackListProps) {
  const [selectedTrack, setSelectedTrack] = useState<PlaylistItem | null>(null)

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div
        className="grid items-center px-4 pb-2 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider"
        style={{ gridTemplateColumns: numbered ? '40px 1fr 100px' : '1fr 100px' }}
      >
        {numbered && <span className="text-center">#</span>}
        <span>Título</span>
        <div className="flex items-center gap-1 justify-end pr-2">
          <Clock size={14} />
        </div>
      </div>

      {/* Tracks */}
      <div className="mt-2 space-y-1">
        {tracks.map((track, index) => {
          if (!track) return null
          const isCurrentTrack = track.id === currentTrackId

          const playlistItem: PlaylistItem = {
            id: crypto.randomUUID(),
            source: 'spotify',
            title: track.name,
            subtitle: track.artists?.map((a) => a.name).join(', ') || 'Artista',
            imageUrl: track.album?.images?.[0]?.url || '',
            uri: track.uri,
            durationMs: track.duration_ms,
            addedAt: new Date().toISOString(),
          }

          return (
            <div
              key={`${track.id}-${index}`}
              className={cn(
                'group grid items-center px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                'hover:bg-white/10',
                isCurrentTrack ? 'bg-white/10 text-spotify-green' : 'text-white'
              )}
              style={{ gridTemplateColumns: numbered ? '40px 1fr 100px' : '1fr 100px' }}
              onClick={() => onPlayTrack(track, index)}
            >
              {/* Number / Play icon */}
              {numbered && (
                <div className="flex items-center justify-center">
                  {isCurrentTrack && isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3.5">
                      <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '60%' }} />
                      <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '100%' }} />
                      <span className="w-0.5 bg-spotify-green animate-pulse" style={{ height: '40%' }} />
                    </div>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'text-xs font-medium group-hover:hidden',
                          isCurrentTrack ? 'text-spotify-green' : 'text-white/40'
                        )}
                      >
                        {index + 1}
                      </span>
                      <Play
                        size={14}
                        className="hidden group-hover:block text-white fill-white transition-transform transform active:scale-90"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Title + Artist */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {showArtwork && track.album?.images?.[0] && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-sm"
                  />
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      isCurrentTrack ? 'text-spotify-green' : 'text-white'
                    )}
                  >
                    {track.name}
                  </p>
                  <p className="text-white/50 text-xs truncate">
                    {track.artists?.map((a) => a.name).join(', ') || 'Artista desconhecido'}
                    {showAlbum && track.album?.name && ` • ${track.album.name}`}
                  </p>
                </div>
              </div>

              {/* Duration & Add to Playlist */}
              <div className="flex items-center justify-end gap-2 pr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTrack(playlistItem)
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-spotify-green hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Salvar em uma Playlist"
                >
                  <FolderPlus size={15} />
                </button>
                <span className="text-white/40 text-xs font-mono">
                  {formatMs(track.duration_ms || 0)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal para Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={Boolean(selectedTrack)}
        onClose={() => setSelectedTrack(null)}
        item={selectedTrack}
      />
    </div>
  )
}
