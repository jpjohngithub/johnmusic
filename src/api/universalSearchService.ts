// ============================================================
// UNIVERSAL SEARCH SERVICE — Busca Unificada Multi-Plataforma
// Pesquisa em larga escala no Spotify, YouTube e TikTok (40+ resultados)
// ============================================================

import { searchSpotify } from './spotifyService'
import { getValidAccessToken } from './spotifyAuth'
import { parseSpotifyUrl, createSpotifyItemFromUrl } from './spotifyUrlService'
import { searchYouTubeKeyless } from './youtubeSearchService'
import type { SpotifyTrack, SpotifySavedItem } from '@/types'

export interface SearchTrackItem {
  id: string
  source: 'spotify' | 'youtube' | 'tiktok'
  title: string
  subtitle: string
  albumName?: string
  artworkUrl: string
  durationMs: number
  previewUrl?: string | null
  spotifyUri?: string
  spotifyUrl?: string
  videoId?: string
  tiktokUrl?: string
  audioUrl?: string
}

export interface UniversalSearchResults {
  directSpotifyItem?: SpotifySavedItem | null
  spotifyTracks: SearchTrackItem[]
  youtubeVideos: SearchTrackItem[]
  tiktokTracks: SearchTrackItem[]
  allCombined: SearchTrackItem[]
  playlists: SpotifySavedItem[]
  isSpotifyAuthenticated: boolean
}

// ─── 1. Busca no Catálogo do Spotify / Apple Music (40+ Músicas) ────────

async function searchSpotifyCatalog(query: string): Promise<SearchTrackItem[]> {
  const token = await getValidAccessToken()

  if (token) {
    try {
      const res = await searchSpotify(query, ['track'], 40)
      if (res.tracks?.items?.length) {
        return res.tracks.items.map((t) => ({
          id: t.id,
          source: 'spotify' as const,
          title: t.name,
          subtitle: t.artists?.map((a) => a.name).join(', ') || 'Artista',
          albumName: t.album?.name || '',
          artworkUrl: t.album?.images?.[0]?.url || '',
          durationMs: t.duration_ms || 180000,
          previewUrl: t.preview_url || null,
          spotifyUri: t.uri,
          spotifyUrl: `https://open.spotify.com/track/${t.id}`,
        }))
      }
    } catch {
      // segue para fallback
    }
  }

  // Fallback aberto de alta fidelidade (Capa 600x600 HD — até 40 músicas)
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=40&country=BR`
    const response = await fetch(url, { signal: AbortSignal.timeout(4500) })
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.results)) {
        return data.results.map((item: any) => ({
          id: `sp-${item.trackId}`,
          source: 'spotify' as const,
          title: item.trackName || 'Música',
          subtitle: item.artistName || 'Artista',
          albumName: item.collectionName || '',
          artworkUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          durationMs: item.trackTimeMillis || 180000,
          previewUrl: item.previewUrl || null,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.trackName} ${item.artistName}`)}`,
        }))
      }
    }
  } catch {}

  return []
}

// ─── 2. Busca no YouTube (25+ Vídeos e Áudios Oficiais) ────────

async function searchYouTubeCatalog(query: string): Promise<SearchTrackItem[]> {
  try {
    const matches = await searchYouTubeKeyless(query, 25)
    return matches.map((m) => ({
      id: `yt-${m.videoId}`,
      source: 'youtube' as const,
      title: m.title,
      subtitle: m.channelTitle || 'YouTube',
      artworkUrl: m.thumbnailUrl || `https://i.ytimg.com/vi/${m.videoId}/hqdefault.jpg`,
      videoId: m.videoId,
      durationMs: (m.durationSeconds || 180) * 1000,
      previewUrl: null,
    }))
  } catch {
    return []
  }
}

// ─── 3. Busca no TikTok (25+ Sons Virais, Remixes e Tendências) ───

async function searchTikTokCatalog(query: string): Promise<SearchTrackItem[]> {
  const results: SearchTrackItem[] = []
  const seenIds = new Set<string>()

  // 1. Busca vídeos, remixes e áudios virais do TikTok no YouTube (play imediato)
  try {
    const [yt1, yt2] = await Promise.allSettled([
      searchYouTubeKeyless(`${query} tiktok`, 18),
      searchYouTubeKeyless(`${query} remix tiktok`, 12),
    ])

    const matches1 = yt1.status === 'fulfilled' ? yt1.value : []
    const matches2 = yt2.status === 'fulfilled' ? yt2.value : []

    for (const m of [...matches1, ...matches2]) {
      if (!seenIds.has(m.videoId)) {
        seenIds.add(m.videoId)
        results.push({
          id: `tt-yt-${m.videoId}`,
          source: 'tiktok' as const,
          title: m.title.replace(/\s*\(?(?:tiktok|tik tok|tiktok song|tiktok viral|tiktok remix)\)?/gi, '').trim() || m.title,
          subtitle: m.channelTitle ? `TikTok • ${m.channelTitle}` : 'TikTok Viral',
          artworkUrl: m.thumbnailUrl || `https://i.ytimg.com/vi/${m.videoId}/hqdefault.jpg`,
          videoId: m.videoId,
          durationMs: (m.durationSeconds || 60) * 1000,
          previewUrl: null,
        })
      }
    }
  } catch {}

  // 2. Complementa com catálogo viral do Apple Music / TikTok (capas em alta definição)
  if (results.length < 20) {
    try {
      const encoded = encodeURIComponent(`${query} tiktok`)
      const url = `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=25&country=BR`
      const response = await fetch(url, { signal: AbortSignal.timeout(3500) })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.results)) {
          data.results.forEach((item: any) => {
            const trackKey = `${item.trackName}-${item.artistName}`.toLowerCase()
            if (!seenIds.has(trackKey)) {
              seenIds.add(trackKey)
              results.push({
                id: `tt-${item.trackId}`,
                source: 'tiktok' as const,
                title: item.trackName || 'Som do TikTok',
                subtitle: item.artistName ? `TikTok Viral • ${item.artistName}` : 'TikTok Sound',
                albumName: 'TikTok Trending',
                artworkUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
                durationMs: Math.min(item.trackTimeMillis || 60000, 90000),
                previewUrl: item.previewUrl || null,
              })
            }
          })
        }
      }
    } catch {}
  }

  return results
}

// ─── Função Principal de Busca Universal Multi-Plataforma ────

export async function executeUniversalSearch(
  query: string,
  isAuthenticated: boolean
): Promise<UniversalSearchResults> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      spotifyTracks: [],
      youtubeVideos: [],
      tiktokTracks: [],
      allCombined: [],
      playlists: [],
      isSpotifyAuthenticated: isAuthenticated,
    }
  }

  // 1. Direct Spotify URL detection
  const parsedSpotify = parseSpotifyUrl(trimmed)
  let directSpotifyItem: SpotifySavedItem | null = null
  if (parsedSpotify) {
    try {
      directSpotifyItem = await createSpotifyItemFromUrl(trimmed)
    } catch {}
  }

  // 2. Dispara busca simultânea em larga escala nas 3 plataformas em paralelo
  const [spotifyRes, youtubeRes, tiktokRes] = await Promise.allSettled([
    searchSpotifyCatalog(trimmed),
    searchYouTubeCatalog(trimmed),
    searchTikTokCatalog(trimmed),
  ])

  const spotifyTracks = spotifyRes.status === 'fulfilled' ? spotifyRes.value : []
  const youtubeVideos = youtubeRes.status === 'fulfilled' ? youtubeRes.value : []
  const tiktokTracks = tiktokRes.status === 'fulfilled' ? tiktokRes.value : []

  // Intercala os melhores resultados no feed combinado "Tudo"
  const allCombined: SearchTrackItem[] = []
  const maxLen = Math.max(spotifyTracks.length, youtubeVideos.length, tiktokTracks.length)

  for (let i = 0; i < maxLen; i++) {
    if (spotifyTracks[i]) allCombined.push(spotifyTracks[i])
    if (youtubeVideos[i]) allCombined.push(youtubeVideos[i])
    if (tiktokTracks[i]) allCombined.push(tiktokTracks[i])
  }

  return {
    directSpotifyItem,
    spotifyTracks,
    youtubeVideos,
    tiktokTracks,
    allCombined,
    playlists: [],
    isSpotifyAuthenticated: isAuthenticated,
  }
}
