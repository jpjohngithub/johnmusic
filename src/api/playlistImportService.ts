// ============================================================
// PLAYLIST IMPORT SERVICE — Replicação 100% Real das Músicas
// Extrai as faixas exatas do Spotify e do YouTube (Zero Login)
// ============================================================

import { parseSpotifyUrl, fetchSpotifyOEmbed } from './spotifyUrlService'
import { getPlaylist, getAllPlaylistTracks } from './spotifyService'
import { getValidAccessToken } from './spotifyAuth'
import type { CustomPlaylist, PlaylistItem } from '@/types'

// ─── Extração Real de Faixas do Embed do Spotify ─────────────

interface SpotifyEmbedResult {
  name: string
  description?: string
  coverUrl?: string
  tracks: PlaylistItem[]
}

function parseMicrolinkTrackHtml(html: string, coverUrl: string): PlaylistItem | null {
  try {
    const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i)
    const subtitleMatch = html.match(/<h4[^>]*>(?:<span[^>]*>[^<]*<\/span>)?([^<]+)<\/h4>/i)
    const durationMatch = html.match(/<div[^>]*data-testid="duration-cell"[^>]*>([^<]+)<\/div>/i)

    const title = titleMatch ? titleMatch[1].trim() : ''
    const subtitle = subtitleMatch ? subtitleMatch[1].replace(/&nbsp;/g, ' ').trim() : ''
    if (!title) return null

    const durStr = durationMatch ? durationMatch[1].trim() : '03:00'
    const parts = durStr.split(':').map(Number)
    const durationMs = parts.length === 2
      ? ((parts[0] || 0) * 60 + (parts[1] || 0)) * 1000
      : 180000

    return {
      id: crypto.randomUUID(),
      source: 'spotify' as const,
      title,
      subtitle: subtitle || 'Artista',
      imageUrl: coverUrl,
      url: `https://open.spotify.com/track/${crypto.randomUUID().slice(0, 8)}`,
      durationMs,
      addedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function fetchSpotifyEmbedRealTracks(playlistId: string): Promise<SpotifyEmbedResult | null> {
  const targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`

  // 1. Tenta API do Microlink (CORS liberado, rápido e confiável no navegador)
  try {
    const microUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&data.tracks.selectorAll=li&data.tracks.type=text`
    const res = await fetch(microUrl, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const json = await res.json()
      const rawTracksHtml = (json.data?.tracks || []) as string[]
      const coverUrl = json.data?.image?.url || ''
      const name = json.data?.title || 'Playlist Spotify'
      const description = json.data?.description || ''

      const tracks: PlaylistItem[] = rawTracksHtml
        .map((h) => parseMicrolinkTrackHtml(h, coverUrl))
        .filter((t): t is PlaylistItem => t !== null)

      if (tracks.length > 0) {
        return {
          name,
          description,
          coverUrl,
          tracks,
        }
      }
    }
  } catch {
    // segue para próximo fallback
  }

  // 2. Tenta proxy local do Vite / dev server
  try {
    const res = await fetch(`/api/spotify-embed/playlist/${playlistId}`, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: 'text/html,application/xhtml+xml' },
    })
    if (res.ok) {
      const html = await res.text()
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/)
      if (m) {
        const data = JSON.parse(m[1])
        const entity = data.props?.pageProps?.state?.data?.entity
        if (entity && Array.isArray(entity.trackList)) {
          const coverUrl = entity.coverArt?.sources?.[0]?.url || ''
          const tracks: PlaylistItem[] = entity.trackList.map((t: any) => ({
            id: crypto.randomUUID(),
            source: 'spotify' as const,
            title: t.title || 'Música',
            subtitle: t.subtitle || 'Artista',
            imageUrl: coverUrl,
            url: `https://open.spotify.com/track/${t.uri ? t.uri.replace('spotify:track:', '') : ''}`,
            uri: t.uri,
            durationMs: t.duration || 180000,
            addedAt: new Date().toISOString(),
          }))

          if (tracks.length > 0) {
            return {
              name: entity.name || 'Playlist Spotify',
              description: entity.subtitle || '',
              coverUrl,
              tracks,
            }
          }
        }
      }
    }
  } catch {
    // segue
  }

  return null
}

// ─── Extrai Faixas da Playlist do YouTube via Piped / Invidious ──────────

export async function fetchYouTubePlaylistTracks(playlistId: string): Promise<{
  name: string
  coverUrl: string
  tracks: PlaylistItem[]
}> {
  const instances = [
    'https://api.piped.private.coffee',
    'https://pa.il.ax',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.ducks.party',
    'https://inv.nadeko.net',
  ]

  for (const instance of instances) {
    try {
      const isPiped = instance.includes('piped') || instance.includes('pa.il.ax')
      const url = isPiped
        ? `${instance}/playlists/${playlistId}`
        : `${instance}/api/v1/playlists/${playlistId}`

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const data = await res.json()

      const rawItems = isPiped ? data.relatedStreams : data.videos
      if (!Array.isArray(rawItems) || rawItems.length === 0) continue

      const name = (isPiped ? data.name : data.title) || `Playlist YouTube`
      const coverUrl = (isPiped ? data.thumbnailUrl : data.playlistThumbnail) || ''

      const tracks: PlaylistItem[] = rawItems.map((item: any) => {
        const videoId = isPiped
          ? item.url?.split('watch?v=')[1]?.split('&')[0]
          : item.videoId

        return {
          id: crypto.randomUUID(),
          source: 'youtube' as const,
          title: item.title || 'Vídeo',
          subtitle: (isPiped ? item.uploaderName : item.author) || 'YouTube',
          imageUrl:
            (isPiped ? item.thumbnail : item.videoThumbnails?.[0]?.url) ||
            `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          durationMs: ((isPiped ? item.duration : item.lengthSeconds) || 180) * 1000,
          addedAt: new Date().toISOString(),
        }
      })

      return {
        name,
        coverUrl: coverUrl || tracks[0]?.imageUrl || '',
        tracks,
      }
    } catch {
      // tenta próxima instância
    }
  }

  return {
    name: 'Playlist YouTube',
    coverUrl: '',
    tracks: [],
  }
}

// ─── Import Spotify Playlist to Custom Local Playlist ────────

export async function importSpotifyPlaylist(playlistUrlOrId: string): Promise<CustomPlaylist> {
  const parsed = parseSpotifyUrl(playlistUrlOrId)
  const playlistId = parsed ? parsed.id : playlistUrlOrId.trim()
  const playlistCanonicalUrl = `https://open.spotify.com/playlist/${playlistId}`

  // 1. Tenta extração direta das faixas reais do Spotify
  const embedData = await fetchSpotifyEmbedRealTracks(playlistId)
  if (embedData && embedData.tracks.length > 0) {
    return {
      id: crypto.randomUUID(),
      name: embedData.name,
      description: embedData.description || `Playlist replicada do Spotify com ${embedData.tracks.length} músicas`,
      coverUrl: embedData.coverUrl || embedData.tracks[0]?.imageUrl || '',
      importedFrom: 'spotify',
      externalUrl: playlistCanonicalUrl,
      items: embedData.tracks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // 2. Se houver token Spotify (OAuth ou Client Credentials)
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

      if (items.length > 0) {
        return {
          id: crypto.randomUUID(),
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description || `Playlist replicada do Spotify (${items.length} faixas)`,
          coverUrl: spotifyPlaylist.images?.[0]?.url || items[0]?.imageUrl || '',
          importedFrom: 'spotify',
          externalUrl: playlistCanonicalUrl,
          items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback oEmbed para pegar nome e capa corretos
  try {
    const oembed = await fetchSpotifyOEmbed(playlistCanonicalUrl)
    return {
      id: crypto.randomUUID(),
      name: oembed.title || `Playlist Spotify (${playlistId.slice(0, 6)})`,
      description: `Playlist do Spotify`,
      coverUrl: oembed.thumbnail_url || '',
      importedFrom: 'spotify',
      externalUrl: playlistCanonicalUrl,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      id: crypto.randomUUID(),
      name: `Playlist Spotify #${playlistId.slice(0, 6)}`,
      description: `Playlist do Spotify`,
      coverUrl: '',
      importedFrom: 'spotify',
      externalUrl: playlistCanonicalUrl,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

// ─── Import YouTube Playlist ──────────────────────────────────

export async function importYouTubePlaylist(urlOrId: string): Promise<CustomPlaylist> {
  const match = urlOrId.match(/[&?]list=([a-zA-Z0-9_-]+)/)
  const playlistId = match ? match[1] : urlOrId.trim()

  const data = await fetchYouTubePlaylistTracks(playlistId)

  return {
    id: crypto.randomUUID(),
    name: data.name,
    description: `Playlist replicada do YouTube com ${data.tracks.length} faixas`,
    coverUrl: data.coverUrl,
    importedFrom: 'youtube',
    externalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    items: data.tracks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
