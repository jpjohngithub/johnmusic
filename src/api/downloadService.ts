// ============================================================
// DOWNLOAD SERVICE — DOWNLOAD INSTANTÂNEO DE MÚSICAS EM MP3
// 1-Click Direct Download para qualquer música (YouTube, Spotify, TikTok, Áudio)
// ============================================================

import { resolvePlayable } from '@/api/crossPlatformService'
import type { QueueItem } from '@/types'

export interface DownloadSource {
  title: string
  subtitle?: string
  imageUrl?: string
  videoId?: string
  audioUrl?: string
  source?: string
  uri?: string
  id?: string
}

export interface DownloadResult {
  success: boolean
  downloadUrl?: string
  filename: string
  error?: string
}

// Sanitiza o nome do arquivo para Windows, Mac e Linux
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Dispara download nativo no navegador
export function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ─── Servidores de Extração de Áudio MP3 ──────────────────────

const COBALT_ENDPOINTS = [
  'https://api.cobalt.tools',
  'https://co.wuk.sh',
  'https://cobalt-api.kwiatekm.tokyo',
]

const INVIDIOUS_AUDIO_MIRRORS = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://yt.drgnz.club',
]

// 1. Tenta Cobalt Tools API
async function fetchCobaltDownloadUrl(videoId: string): Promise<string | null> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

  for (const endpoint of COBALT_ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(`${endpoint}/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
          audioBitrate: '320',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.url) return data.url
        if (data.audio) return data.audio
      }
    } catch {}
  }

  return null
}

// Espelhos de Download Alternativos
export function getExternalDownloadLinks(videoId: string, title?: string) {
  return [
    {
      name: 'Y2Mate MP3 (Alta Velocidade)',
      url: `https://www.y2mate.com/youtube-mp3/${videoId}`,
      badge: '320kbps',
    },
    {
      name: 'YTMP3 Converter',
      url: `https://ytmp3.cc/en/youtube-to-mp3/${videoId}`,
      badge: 'MP3',
    },
    {
      name: 'TubeNinja MP3',
      url: `https://www.tubeninja.net/?url=https://www.youtube.com/watch?v=${videoId}`,
      badge: 'Direto',
    },
    {
      name: 'Cobalt Web Downloader',
      url: `https://cobalt.tools/#https://www.youtube.com/watch?v=${videoId}`,
      badge: 'Sem Anúncios',
    },
  ]
}

// ─── Função de Download em 1 Clique (Instantâneo) ────────────

export async function downloadTrackInstant(item: DownloadSource): Promise<DownloadResult> {
  const cleanTitle = sanitizeFilename(item.title || 'musica')
  const cleanArtist = sanitizeFilename(item.subtitle || 'JohnMusic')
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`

  // 1. Se tem áudio direto (TikTok / MP3 local / CDN)
  if (item.audioUrl) {
    triggerBrowserDownload(item.audioUrl, filename)
    return { success: true, downloadUrl: item.audioUrl, filename }
  }

  // 2. Resolve videoId se necessário
  let videoId = item.videoId
  if (!videoId) {
    const resolved = await resolvePlayable({
      id: item.id || crypto.randomUUID(),
      title: item.title,
      subtitle: item.subtitle,
      source: (item.source as any) || 'spotify',
      uri: item.uri,
      durationMs: 0,
    } as QueueItem)
    videoId = resolved?.videoId
  }

  if (!videoId) {
    // Fallback: busca rápida por nome
    const { searchYouTubeKeyless } = await import('@/api/youtubeSearchService')
    const query = `${item.subtitle || ''} ${item.title}`.trim()
    const matches = await searchYouTubeKeyless(query, 1)
    if (matches.length > 0) {
      videoId = matches[0].videoId
    }
  }

  if (!videoId) {
    return {
      success: false,
      filename,
      error: 'Não foi possível encontrar a música para download.',
    }
  }

  // 3. Tenta obter URL direta de MP3 via Cobalt
  try {
    const cobaltUrl = await fetchCobaltDownloadUrl(videoId)
    if (cobaltUrl) {
      triggerBrowserDownload(cobaltUrl, filename)
      return { success: true, downloadUrl: cobaltUrl, filename }
    }
  } catch {}

  // 4. Fallback Instantâneo: Invidious Audio Stream
  const mirror = INVIDIOUS_AUDIO_MIRRORS[Math.floor(Math.random() * INVIDIOUS_AUDIO_MIRRORS.length)]
  const directAudioUrl = `${mirror}/latest_version?id=${videoId}&itag=140`

  // 5. Fallback Alternativo Confiável
  try {
    triggerBrowserDownload(directAudioUrl, filename)
    return { success: true, downloadUrl: directAudioUrl, filename }
  } catch {
    const fastConverterUrl = `https://www.y2mate.com/youtube-mp3/${videoId}`
    window.open(fastConverterUrl, '_blank')
    return { success: true, downloadUrl: fastConverterUrl, filename }
  }
}

export const processTrackDownload = downloadTrackInstant
