// ============================================================
// YOUTUBE SERVICE — URL Parser + Embed
// ============================================================

import type { YouTubeVideo } from '@/types'

// ─── URL Parsing ──────────────────────────────────────────────

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=1&rel=0`
}

export function buildYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

// ─── oEmbed API (pega título e info sem necessitar API Key) ──

export interface YouTubeOEmbed {
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string
}

export async function getYouTubeOEmbed(videoId: string): Promise<YouTubeOEmbed> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  )

  if (!response.ok) {
    throw new Error('Não foi possível obter informações do vídeo')
  }

  return response.json()
}

// ─── Create YouTubeVideo object from URL ──────────────────────

export async function createYouTubeVideoFromUrl(url: string): Promise<YouTubeVideo> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) throw new Error('URL do YouTube inválida')

  try {
    const oembed = await getYouTubeOEmbed(videoId)
    return {
      id: crypto.randomUUID(),
      videoId,
      title: oembed.title,
      channelTitle: oembed.author_name,
      thumbnailUrl: oembed.thumbnail_url || buildYouTubeThumbnail(videoId),
      url,
      addedAt: new Date().toISOString(),
    }
  } catch {
    // Fallback se oEmbed falhar
    return {
      id: crypto.randomUUID(),
      videoId,
      title: `Vídeo ${videoId}`,
      channelTitle: 'YouTube',
      thumbnailUrl: buildYouTubeThumbnail(videoId),
      url,
      addedAt: new Date().toISOString(),
    }
  }
}

// ─── Format duration ──────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
