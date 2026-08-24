// ============================================================
// YOUTUBE SEARCH SERVICE — Busca keyless via Piped/Invidious
// ============================================================
// Estratégia sem chave de API: cadeia de instâncias públicas
// (Piped primeiro, Invidious como fallback), com cache local.
// Se VITE_YOUTUBE_API_KEY estiver definida, usa a Data API v3.

import type { YouTubeSearchResult } from '@/types'

const API_KEY = (import.meta.env.VITE_YOUTUBE_API_KEY || '') as string

// Instâncias públicas com CORS liberado
const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pa.il.ax',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.ducks.party',
  'https://pipedapi.drgns.space',
]

const INVIDIOUS_INSTANCES = [
  'https://invidious.asir.dev',
  'https://iv.melmac.space',
  'https://vid.priv.au',
  'https://invidious.io.lol',
  'https://inv.nadeko.net',
]

export interface YouTubeMatch {
  videoId: string
  title: string
  channelTitle: string
  durationSeconds: number
  thumbnailUrl: string
}

function fetchWithTimeout(url: string, ms = 3500): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

// ─── Cache ────────────────────────────────────────────────────

const CACHE_PREFIX = 'yt-search-cache:'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

interface CacheEntry<T> {
  at: number
  data: T
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key.toLowerCase())
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.at > CACHE_TTL) return null
    return entry.data
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key.toLowerCase(),
      JSON.stringify({ at: Date.now(), data })
    )
  } catch {
    // storage cheio — ignora silenciosamente
  }
}

// ─── Normalização de duração ISO-8601 (PT3M25S → 205s) ────────

export function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (
    Number(m[1] || 0) * 3600 +
    Number(m[2] || 0) * 60 +
    Number(m[3] || 0)
  )
}

// ─── Data API v3 (opcional, se houver chave) ─────────────────

async function searchViaDataApi(query: string, limit: number): Promise<YouTubeMatch[]> {
  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10', // Music
    maxResults: String(limit),
  })

  const searchRes = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/search?${params}`)
  if (!searchRes.ok) throw new Error(`DataAPI ${searchRes.status}`)
  const searchJson = await searchRes.json()

  const items = ((searchJson.items || []) as any[]).filter((i) => i.id?.videoId)
  if (items.length === 0) return []

  // Busca durações em lote (videos.list)
  const ids = items.map((i) => i.id.videoId)
  const detailsParams = new URLSearchParams({
    key: API_KEY,
    id: ids.join(','),
    part: 'contentDetails',
  })
  const detailsRes = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?${detailsParams}`)
  const durations: Record<string, number> = {}
  if (detailsRes.ok) {
    for (const item of ((await detailsRes.json()) as any).items || []) {
      durations[item.id] = parseIsoDuration(item.contentDetails?.duration || '')
    }
  }

  return items.map((i) => ({
      videoId: i.id.videoId,
      title: i.snippet?.title || 'YouTube Video',
      channelTitle: i.snippet?.channelTitle || '',
      durationSeconds: durations[i.id.videoId] || 0,
      thumbnailUrl:
        i.snippet?.thumbnails?.high?.url ||
        `https://img.youtube.com/vi/${i.id.videoId}/mqdefault.jpg`,
    }))
}

// ─── Piped ────────────────────────────────────────────────────

async function searchViaPiped(instance: string, query: string): Promise<YouTubeMatch[]> {
  const res = await fetchWithTimeout(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`)
  if (!res.ok) throw new Error(`Piped ${res.status}`)
  const json = await res.json()

  return ((json.items || []) as any[])
    .filter((i) => i.url?.includes('watch?v='))
    .map((i) => ({
      videoId: i.url.split('watch?v=')[1]?.split('&')[0],
      title: i.title || 'YouTube Video',
      channelTitle: i.uploaderName || '',
      durationSeconds: i.duration || 0,
      thumbnailUrl: i.thumbnail || `https://img.youtube.com/vi/${i.url.split('watch?v=')[1]?.split('&')[0]}/mqdefault.jpg`,
    }))
}

// ─── Invidious ────────────────────────────────────────────────

async function searchViaInvidious(instance: string, query: string): Promise<YouTubeMatch[]> {
  const res = await fetchWithTimeout(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`)
  if (!res.ok) throw new Error(`Invidious ${res.status}`)
  const items = await res.json()

  return ((items || []) as any[])
    .filter((i) => i.videoId)
    .map((i) => ({
      videoId: i.videoId,
      title: i.title || 'YouTube Video',
      channelTitle: i.author || '',
      durationSeconds: i.lengthSeconds || 0,
      thumbnailUrl: i.videoThumbnails?.find((t: any) => t.quality === 'high')?.url ||
        `https://img.youtube.com/vi/${i.videoId}/mqdefault.jpg`,
    }))
}

// ─── Busca principal com cadeia de fallback ───────────────────

async function tryInstances<T>(
  instances: string[],
  fn: (instance: string) => Promise<T[]>
): Promise<T[]> {
  for (const instance of instances) {
    try {
      const result = await fn(instance)
      if (result.length > 0) return result
    } catch {
      // tenta próxima instância
    }
  }
  return []
}

export async function searchYouTubeKeyless(query: string, limit = 15): Promise<YouTubeMatch[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const cached = cacheGet<YouTubeMatch[]>(`q:${trimmed}:${limit}`)
  if (cached) return cached.slice(0, limit)

  let results: YouTubeMatch[] = []

  // 1. Data API oficial se houver chave
  if (API_KEY) {
    try {
      results = await searchViaDataApi(trimmed, limit)
    } catch {
      results = []
    }
  }

  // 2. Piped (filtro music_songs)
  if (results.length === 0) {
    results = await tryInstances(PIPED_INSTANCES, (i) => searchViaPiped(i, trimmed))
  }

  // 3. Invidious (busca geral em vídeo)
  if (results.length === 0) {
    results = await tryInstances(INVIDIOUS_INSTANCES, (i) => searchViaInvidious(i, trimmed))
  }

  if (results.length > 0) {
    cacheSet(`q:${trimmed}:${limit}`, results)
  }

  return results.slice(0, limit)
}

// ─── Conversão para resultados da UI ──────────────────────────

export function matchToSearchResult(m: YouTubeMatch): YouTubeSearchResult {
  return {
    id: `yt-${m.videoId}`,
    videoId: m.videoId,
    title: m.title,
    channelTitle: m.channelTitle,
    durationSeconds: m.durationSeconds,
    thumbnailUrl: m.thumbnailUrl,
    url: `https://www.youtube.com/watch?v=${m.videoId}`,
  }
}

// ─── Busca de Playlists no YouTube ────────────────────────────

export interface YouTubePlaylistMatch {
  playlistId: string
  title: string
  channelTitle: string
  videoCount: number
  thumbnailUrl: string
  url: string
}

async function searchPlaylistsViaPiped(instance: string, query: string): Promise<YouTubePlaylistMatch[]> {
  const res = await fetchWithTimeout(`${instance}/search?q=${encodeURIComponent(query)}&filter=playlists`)
  if (!res.ok) throw new Error(`Piped ${res.status}`)
  const json = await res.json()
  return ((json.items || []) as any[])
    .filter((i) => i.type === 'playlist' || i.url?.includes('list='))
    .map((i) => {
      const listId = i.url?.includes('list=') ? i.url.split('list=')[1]?.split('&')[0] : ''
      return {
        playlistId: listId,
        title: i.name || i.title || 'Playlist do YouTube',
        channelTitle: i.uploaderName || i.author || 'YouTube',
        videoCount: i.videos || 0,
        thumbnailUrl: i.thumbnail || (listId ? `https://i.ytimg.com/vi/${listId}/hqdefault.jpg` : ''),
        url: `https://www.youtube.com/playlist?list=${listId}`,
      }
    })
    .filter((p) => Boolean(p.playlistId))
}

async function searchPlaylistsViaInvidious(instance: string, query: string): Promise<YouTubePlaylistMatch[]> {
  const res = await fetchWithTimeout(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=playlist`)
  if (!res.ok) throw new Error(`Invidious ${res.status}`)
  const items = await res.json()
  return ((items || []) as any[])
    .filter((i) => i.playlistId)
    .map((i) => ({
      playlistId: i.playlistId,
      title: i.title || 'Playlist do YouTube',
      channelTitle: i.author || 'YouTube',
      videoCount: i.videoCount || 0,
      thumbnailUrl: i.playlistThumbnail || `https://i.ytimg.com/vi/${i.playlistId}/hqdefault.jpg`,
      url: `https://www.youtube.com/playlist?list=${i.playlistId}`,
    }))
}

export async function searchYouTubePlaylistsKeyless(query: string, limit = 25): Promise<YouTubePlaylistMatch[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const cached = cacheGet<YouTubePlaylistMatch[]>(`pl-q:${trimmed}:${limit}`)
  if (cached) return cached.slice(0, limit)

  let results: YouTubePlaylistMatch[] = []

  // 1. Piped
  results = await tryInstances(PIPED_INSTANCES, (i) => searchPlaylistsViaPiped(i, trimmed))

  // 2. Invidious
  if (results.length === 0) {
    results = await tryInstances(INVIDIOUS_INSTANCES, (i) => searchPlaylistsViaInvidious(i, trimmed))
  }

  if (results.length > 0) {
    cacheSet(`pl-q:${trimmed}:${limit}`, results)
  }

  return results.slice(0, limit)
}
