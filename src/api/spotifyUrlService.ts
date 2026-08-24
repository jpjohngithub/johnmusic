// ============================================================
// SPOTIFY URL & OEMBED SERVICE — 100% SEM LOGIN
// ============================================================

import type { SpotifySavedItem } from '@/types'

export interface SpotifyUrlInfo {
  type: 'track' | 'playlist' | 'album' | 'artist' | 'episode'
  id: string
  uri: string
  embedUrl: string
  canonicalUrl: string
}

// ─── Parse any Spotify URL or URI ────────────────────────────

export function parseSpotifyUrl(urlOrUri: string): SpotifyUrlInfo | null {
  const trimmed = urlOrUri.trim()

  // 1. Format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  if (trimmed.startsWith('spotify:')) {
    const parts = trimmed.split(':')
    if (parts.length >= 3) {
      const type = parts[1] as SpotifyUrlInfo['type']
      const id = parts[2]
      return {
        type,
        id,
        uri: trimmed,
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      }
    }
  }

  // 2. Format: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
  const webPattern = /open\.spotify\.com\/(track|playlist|album|artist|episode)\/([a-zA-Z0-9]+)/
  const match = trimmed.match(webPattern)
  if (match) {
    const type = match[1] as SpotifyUrlInfo['type']
    const id = match[2]
    return {
      type,
      id,
      uri: `spotify:${type}:${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
    }
  }

  return null
}

export function isValidSpotifyUrl(urlOrUri: string): boolean {
  return parseSpotifyUrl(urlOrUri) !== null
}

// ─── Fetch public metadata via official Spotify oEmbed API ───

export interface SpotifyOEmbedResponse {
  title: string
  type: string
  provider_name: string
  provider_url: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string
  width: number
  height: number
}

export async function fetchSpotifyOEmbed(spotifyUrl: string): Promise<SpotifyOEmbedResponse> {
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error('Não foi possível obter dados do Spotify')
  }
  return response.json()
}

// ─── Create SpotifySavedItem from URL (Zero Login Required) ──

function cleanSpotifyMetadata(
  rawTitle: string | undefined,
  rawAuthor: string | undefined,
  rawDesc: string | undefined,
  trackId: string
): { title: string; author: string } | null {
  let title = (rawTitle || '').trim()
  let author = (rawAuthor || '').trim()

  if (
    !title ||
    title.toLowerCase() === trackId.toLowerCase() ||
    title.toLowerCase().includes('spotify – web player') ||
    title.toLowerCase().includes('spotify web') ||
    title.toLowerCase() === 'page not found' ||
    title.toLowerCase().includes('we can’t seem to find')
  ) {
    return null
  }

  // Se o título vier no formato "Nome da Música - song and lyrics by Artista | Spotify"
  if (title.includes(' - song and lyrics by ')) {
    const parts = title.split(' - song and lyrics by ')
    title = parts[0].trim()
    if (!author && parts[1]) {
      author = parts[1].split('|')[0].trim()
    }
  }

  if (title.includes(' | Spotify')) {
    title = title.replace(' | Spotify', '').trim()
  }

  if (!author && rawDesc) {
    const descParts = rawDesc.split('·')
    if (descParts.length > 0 && descParts[0].trim().length > 1) {
      author = descParts[0].trim()
    }
  }

  return { title, author }
}

export async function createSpotifyItemFromUrl(urlOrUri: string): Promise<SpotifySavedItem> {
  const parsed = parseSpotifyUrl(urlOrUri)
  if (!parsed) {
    throw new Error('URL do Spotify inválida. Use links como: open.spotify.com/track/... ou open.spotify.com/playlist/...')
  }

  // 1. Tenta extrair dados precisos via Microlink na URL canônica
  try {
    const microRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(parsed.canonicalUrl)}`,
      { signal: AbortSignal.timeout(4500) }
    )
    if (microRes.ok) {
      const json = await microRes.json()
      const cleaned = cleanSpotifyMetadata(
        json.data?.title,
        json.data?.author,
        json.data?.description,
        parsed.id
      )

      if (cleaned) {
        return {
          id: crypto.randomUUID(),
          type: parsed.type,
          spotifyId: parsed.id,
          title: cleaned.title,
          subtitle: cleaned.author || (parsed.type === 'track' ? 'Música' : `Playlist`),
          thumbnailUrl: json.data?.image?.url || '',
          url: parsed.canonicalUrl,
          embedUrl: parsed.embedUrl,
          addedAt: new Date().toISOString(),
        }
      }
    }
  } catch {
    // segue para próximo método
  }

  // 2. Tenta extrair dados via Microlink na URL do Embed
  try {
    const embedRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(parsed.embedUrl)}`,
      { signal: AbortSignal.timeout(4500) }
    )
    if (embedRes.ok) {
      const json = await embedRes.json()
      const cleaned = cleanSpotifyMetadata(
        json.data?.title,
        json.data?.author,
        json.data?.description,
        parsed.id
      )

      if (cleaned) {
        return {
          id: crypto.randomUUID(),
          type: parsed.type,
          spotifyId: parsed.id,
          title: cleaned.title,
          subtitle: cleaned.author || (parsed.type === 'track' ? 'Música' : `Playlist`),
          thumbnailUrl: json.data?.image?.url || '',
          url: parsed.canonicalUrl,
          embedUrl: parsed.embedUrl,
          addedAt: new Date().toISOString(),
        }
      }
    }
  } catch {
    // segue
  }

  // 3. Fallback via oEmbed + iTunes Search
  try {
    const oembed = await fetchSpotifyOEmbed(parsed.canonicalUrl)
    let title = oembed.title || `Faixa #${parsed.id.slice(0, 6)}`
    let subtitle = ''
    let thumbnailUrl = oembed.thumbnail_url || ''

    if (parsed.type === 'track' && oembed.title) {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(oembed.title)}&entity=song&limit=1&country=BR`,
          { signal: AbortSignal.timeout(3000) }
        )
        if (res.ok) {
          const data = await res.json()
          if (data.results && data.results.length > 0) {
            const hit = data.results[0]
            if (hit.trackName) title = hit.trackName
            if (hit.artistName) subtitle = hit.artistName
            if (hit.artworkUrl100 && !thumbnailUrl) {
              thumbnailUrl = hit.artworkUrl100.replace('100x100bb', '600x600bb')
            }
          }
        }
      } catch {
        // fallback
      }
    }

    return {
      id: crypto.randomUUID(),
      type: parsed.type,
      spotifyId: parsed.id,
      title,
      subtitle: subtitle || (parsed.type === 'track' ? 'Spotify Track' : `Playlist / ${parsed.type}`),
      thumbnailUrl,
      url: parsed.canonicalUrl,
      embedUrl: parsed.embedUrl,
      addedAt: new Date().toISOString(),
    }
  } catch {
    return {
      id: crypto.randomUUID(),
      type: parsed.type,
      spotifyId: parsed.id,
      title: `Música Spotify`,
      subtitle: `Spotify ${parsed.type}`,
      thumbnailUrl: '',
      url: parsed.canonicalUrl,
      embedUrl: parsed.embedUrl,
      addedAt: new Date().toISOString(),
    }
  }
}

// ─── Playlists e Músicas Públicas Prontas (Sem Login) ────────

export const CURATED_PUBLIC_SPOTIFY: SpotifySavedItem[] = [
  {
    id: 'curated-top-50-br',
    type: 'playlist',
    spotifyId: '37i9dQZEVXbMXbN3EUUhlg',
    title: 'Top 50 - Brasil',
    subtitle: 'As músicas mais tocadas no Brasil agora',
    thumbnailUrl: 'https://charts-images.scdn.co/assets/locale_en/regional/daily/region_br_default.jpg',
    url: 'https://open.spotify.com/playlist/37i9dQZEVXbMXbN3EUUhlg',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZEVXbMXbN3EUUhlg?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'curated-top-50-global',
    type: 'playlist',
    spotifyId: '37i9dQZEVXbMDoHDwVN2tF',
    title: 'Top 50 - Global',
    subtitle: 'Os maiores hits do planeta no momento',
    thumbnailUrl: 'https://charts-images.scdn.co/assets/locale_en/regional/daily/region_global_default.jpg',
    url: 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'curated-viral-br',
    type: 'playlist',
    spotifyId: '37i9dQZEVXbMOkSwG072FG',
    title: 'Viral 50 - Brasil',
    subtitle: 'As faixas mais compartilhadas e virais',
    thumbnailUrl: 'https://charts-images.scdn.co/assets/locale_en/viral/daily/region_br_default.jpg',
    url: 'https://open.spotify.com/playlist/37i9dQZEVXbMOkSwG072FG',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZEVXbMOkSwG072FG?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'curated-hits-brasil',
    type: 'playlist',
    spotifyId: '37i9dQZF1DX0FOF1IUWK1W',
    title: 'Mega Hits Brasil',
    subtitle: 'Sucessos que não saem da cabeça',
    thumbnailUrl: 'https://i.scdn.co/image/ab67706f00000002b8d0c8d13dd22bbda7a7df64',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0FOF1IUWK1W',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0FOF1IUWK1W?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'curated-lofi-beats',
    type: 'playlist',
    spotifyId: '37i9dQZF1DXdLEN7aqioXM',
    title: 'Lo-Fi Beats',
    subtitle: 'Batidas relaxantes para estudar e focar',
    thumbnailUrl: 'https://i.scdn.co/image/ab67706f0000000257e0f2f35492f153a7a7b8e1',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'curated-rock-classics',
    type: 'playlist',
    spotifyId: '37i9dQZF1DWXRqgorJj26U',
    title: 'Rock Classics',
    subtitle: 'Os maiores hinos do Rock de todos os tempos',
    thumbnailUrl: 'https://i.scdn.co/image/ab67706f00000002798e4d3c333a886b6279f64e',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWXRqgorJj26U?utm_source=generator&theme=0',
    addedAt: new Date().toISOString(),
  },
]
