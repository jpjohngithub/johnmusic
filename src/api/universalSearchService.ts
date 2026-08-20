// ============================================================
// UNIVERSAL SEARCH SERVICE — Puxa músicas e playlists do Spotify
// ============================================================

import { searchSpotify } from './spotifyService'
import { getValidAccessToken } from './spotifyAuth'
import { parseSpotifyUrl, createSpotifyItemFromUrl, CURATED_PUBLIC_SPOTIFY } from './spotifyUrlService'
import type { SpotifyTrack, SpotifySavedItem, SpotifySearchResult } from '@/types'

export interface UniversalTrackResult {
  id: string
  name: string
  artistName: string
  albumName: string
  artworkUrl: string
  durationMs: number
  previewUrl: string | null
  spotifyUri?: string
  spotifyUrl?: string
  source: 'spotify' | 'public'
  rawTrack?: SpotifyTrack
}

export interface UniversalSearchResult {
  directSpotifyItem?: SpotifySavedItem | null
  tracks: UniversalTrackResult[]
  playlists: SpotifySavedItem[]
  isSpotifyAuthenticated: boolean
}

// ─── Search iTunes Public API (No key, 100% free fallback) ────

async function searchPublicMusic(query: string, limit = 20): Promise<UniversalTrackResult[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=${limit}&country=BR`
    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()
    if (!data.results || !Array.isArray(data.results)) return []

    return data.results.map((item: any) => ({
      id: `itunes-${item.trackId}`,
      name: item.trackName || 'Música',
      artistName: item.artistName || 'Artista',
      albumName: item.collectionName || '',
      artworkUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      durationMs: item.trackTimeMillis || 180000,
      previewUrl: item.previewUrl || null,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.trackName} ${item.artistName}`)}`,
      source: 'public' as const,
    }))
  } catch {
    return []
  }
}

// ─── Main Universal Search Function ───────────────────────────

export async function executeUniversalSearch(
  query: string,
  isAuthenticated: boolean
): Promise<UniversalSearchResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      tracks: [],
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
    } catch {
      // ignore
    }
  }

  // 2. Curated playlists matching query
  const matchingCurated = CURATED_PUBLIC_SPOTIFY.filter(
    (p) =>
      p.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(trimmed.toLowerCase())
  )

  // 3. Check if we have valid Spotify API access token (OAuth or Client Credentials)
  const token = await getValidAccessToken()

  if (token) {
    try {
      const spotifyRes = await searchSpotify(trimmed, ['track', 'playlist'], 15)
      const tracks: UniversalTrackResult[] = (spotifyRes.tracks?.items || []).map((t) => ({
        id: t.id,
        name: t.name,
        artistName: t.artists?.map((a) => a.name).join(', ') || 'Artista',
        albumName: t.album?.name || '',
        artworkUrl: t.album?.images?.[0]?.url || '',
        durationMs: t.duration_ms || 0,
        previewUrl: t.preview_url || null,
        spotifyUri: t.uri,
        spotifyUrl: `https://open.spotify.com/track/${t.id}`,
        source: 'spotify' as const,
        rawTrack: t,
      }))

      const playlists: SpotifySavedItem[] = (spotifyRes.playlists?.items || []).map((p) => ({
        id: p.id,
        type: 'playlist' as const,
        spotifyId: p.id,
        title: p.name,
        subtitle: `${p.tracks?.total || 0} músicas • ${p.owner?.display_name || 'Spotify'}`,
        thumbnailUrl: p.images?.[0]?.url || '',
        url: `https://open.spotify.com/playlist/${p.id}`,
        embedUrl: `https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0`,
        addedAt: new Date().toISOString(),
      }))

      return {
        directSpotifyItem,
        tracks,
        playlists: [...matchingCurated, ...playlists],
        isSpotifyAuthenticated: true,
      }
    } catch (e) {
      console.warn('Spotify catalog search fallback:', e)
    }
  }

  // 4. Fallback: Public music catalog search
  const publicTracks = await searchPublicMusic(trimmed, 20)

  return {
    directSpotifyItem,
    tracks: publicTracks,
    playlists: matchingCurated,
    isSpotifyAuthenticated: false,
  }
}
