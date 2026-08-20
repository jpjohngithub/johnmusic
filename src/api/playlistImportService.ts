// ============================================================
// PLAYLIST IMPORT SERVICE — Importação do Spotify para o JohnMusic
// ============================================================

import { parseSpotifyUrl, fetchSpotifyOEmbed } from './spotifyUrlService'
import { getPlaylist, getAllPlaylistTracks } from './spotifyService'
import { getValidAccessToken } from './spotifyAuth'
import type { CustomPlaylist, PlaylistItem, SpotifySavedItem } from '@/types'

// ─── Import Spotify Playlist to Custom Local Playlist ─────────

export async function importSpotifyPlaylist(playlistUrlOrId: string): Promise<CustomPlaylist> {
  const parsed = parseSpotifyUrl(playlistUrlOrId)
  const playlistId = parsed ? parsed.id : playlistUrlOrId.trim()

  const playlistCanonicalUrl = `https://open.spotify.com/playlist/${playlistId}`

  // 1. Try to get full tracks via Spotify Web API if token is available
  const token = await getValidAccessToken()

  if (token) {
    try {
      const spotifyPlaylist = await getPlaylist(playlistId)
      const tracksData = await getAllPlaylistTracks(playlistId)

      const items: PlaylistItem[] = tracksData
        .filter((item) => item.track !== null)
        .map((item) => {
          const t = item.track!
          return {
            id: crypto.randomUUID(),
            source: 'spotify' as const,
            title: t.name,
            subtitle: t.artists?.map((a) => a.name).join(', ') || 'Artista',
            imageUrl: t.album?.images?.[0]?.url || spotifyPlaylist.images?.[0]?.url || '',
            url: `https://open.spotify.com/track/${t.id}`,
            uri: t.uri,
            durationMs: t.duration_ms,
            addedAt: new Date().toISOString(),
          }
        })

      return {
        id: crypto.randomUUID(),
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description || `Playlist importada do Spotify (${items.length} faixas)`,
        coverUrl: spotifyPlaylist.images?.[0]?.url || '',
        importedFrom: 'spotify',
        externalUrl: playlistCanonicalUrl,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } catch (e) {
      console.warn('Falha na importação via Web API, tentando fallback oEmbed:', e)
    }
  }

  // 2. Fallback via oEmbed (Zero Login)
  try {
    const oembed = await fetchSpotifyOEmbed(playlistCanonicalUrl)
    return {
      id: crypto.randomUUID(),
      name: oembed.title || `Playlist Spotify (${playlistId.slice(0, 6)})`,
      description: `Playlist importada do Spotify • Aberta via Player Oficial`,
      coverUrl: oembed.thumbnail_url || '',
      importedFrom: 'spotify',
      externalUrl: playlistCanonicalUrl,
      items: [
        {
          id: crypto.randomUUID(),
          source: 'spotify',
          title: oembed.title || 'Playlist do Spotify',
          subtitle: 'Spotify Playlist Completa',
          imageUrl: oembed.thumbnail_url || '',
          url: playlistCanonicalUrl,
          uri: `spotify:playlist:${playlistId}`,
          addedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      id: crypto.randomUUID(),
      name: `Playlist Spotify #${playlistId.slice(0, 6)}`,
      description: `Playlist importada via URL`,
      coverUrl: '',
      importedFrom: 'spotify',
      externalUrl: playlistCanonicalUrl,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}
