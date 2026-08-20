import { cn } from '@/lib/utils'

interface SpotifyEmbedPlayerProps {
  uri?: string
  trackId?: string
  playlistId?: string
  albumId?: string
  className?: string
  height?: number
}

export function SpotifyEmbedPlayer({
  uri,
  trackId,
  playlistId,
  albumId,
  className,
  height = 152,
}: SpotifyEmbedPlayerProps) {
  let embedUrl = ''

  if (uri) {
    // uri format: spotify:track:xxx or spotify:playlist:xxx or spotify:album:xxx
    const parts = uri.split(':')
    if (parts.length === 3) {
      embedUrl = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`
    }
  } else if (trackId) {
    embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`
  } else if (playlistId) {
    embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
  } else if (albumId) {
    embedUrl = `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`
  }

  if (!embedUrl) return null

  return (
    <div className={cn('w-full rounded-xl overflow-hidden shadow-lg border border-white/5 bg-[#121212]', className)}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl"
      />
    </div>
  )
}
