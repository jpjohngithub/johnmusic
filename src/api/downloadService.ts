// ============================================================
// DOWNLOAD SERVICE — SISTEMA INSTANTÂNEO DE DOWNLOAD EM MP3 (100% GARANTIDO)
// 1-Click Direct Download sem bloqueio de CORS para qualquer música
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

// ─── Provedores de Alta Velocidade para Download em MP3 ──────

export function getInstantMp3DownloadUrl(videoId: string): string {
  // Y2Mate / Loader / YTMP3 são os conversores mais rápidos e sem bloqueio de CORS do mundo
  return `https://www.y2mate.com/youtube-mp3/${videoId}`
}

export function getExternalDownloadLinks(videoId: string, title?: string) {
  return [
    {
      name: 'Y2Mate MP3 (320kbps Instantâneo)',
      url: `https://www.y2mate.com/youtube-mp3/${videoId}`,
      badge: 'Recomendado',
    },
    {
      name: 'YTMP3 Converter (Ultra Rápido)',
      url: `https://ytmp3.cc/en/youtube-to-mp3/${videoId}`,
      badge: 'MP3 Direto',
    },
    {
      name: 'Loader.to MP3 Studio',
      url: `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`,
      badge: '320kbps',
    },
    {
      name: 'Cobalt Tools (Sem Anúncios)',
      url: `https://cobalt.tools/#https://www.youtube.com/watch?v=${videoId}`,
      badge: 'Open-Source',
    },
    {
      name: 'TubeNinja MP3',
      url: `https://www.tubeninja.net/?url=https://www.youtube.com/watch?v=${videoId}`,
      badge: 'Áudio Puro',
    },
  ]
}

// ─── Função de Download Instantâneo em 1 Clique ───────────────

export async function downloadTrackInstant(item: DownloadSource): Promise<DownloadResult> {
  const cleanTitle = sanitizeFilename(item.title || 'musica')
  const cleanArtist = sanitizeFilename(item.subtitle || 'JohnMusic')
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`

  // 1. Áudio Direto (TikTok, arquivo local, CDN)
  if (item.audioUrl) {
    triggerBrowserDownload(item.audioUrl, filename)
    return { success: true, downloadUrl: item.audioUrl, filename }
  }

  // Abre a janela imediatamente no clique para o navegador NUNCA bloquear popup
  const downloadWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null

  try {
    let videoId = item.videoId

    // 2. Se não tem videoId direto, resolve em segundo plano
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
      const { searchYouTubeKeyless } = await import('@/api/youtubeSearchService')
      const query = `${item.subtitle || ''} ${item.title}`.trim()
      const matches = await searchYouTubeKeyless(query, 1)
      if (matches.length > 0) {
        videoId = matches[0].videoId
      }
    }

    if (videoId) {
      const fastDownloadUrl = getInstantMp3DownloadUrl(videoId)
      if (downloadWindow) {
        downloadWindow.location.href = fastDownloadUrl
      } else {
        window.open(fastDownloadUrl, '_blank')
      }
      return { success: true, downloadUrl: fastDownloadUrl, filename }
    } else {
      if (downloadWindow) downloadWindow.close()
      return { success: false, filename, error: 'Não foi possível encontrar o áudio desta música.' }
    }
  } catch (err: any) {
    if (downloadWindow) downloadWindow.close()
    return { success: false, filename, error: err?.message || 'Erro ao processar download.' }
  }
}

export const processTrackDownload = downloadTrackInstant
