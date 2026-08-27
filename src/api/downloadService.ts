// ============================================================
// DOWNLOAD SERVICE — DOWNLOAD DE MÚSICAS EM MP3 ALTA QUALIDADE
// Suporte para YouTube, Spotify, TikTok e Áudio Direto com Múltiplos Espelhos
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
  isDirectBlob?: boolean
}

// Sanitiza o nome do arquivo para Windows, Mac e Linux
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '') // remove caracteres proibidos
    .replace(/\s+/g, ' ')
    .trim()
}

// Dispara download nativo no navegador a partir de Blob ou URL direta
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

// Baixa blob diretamente e salva no disco
export async function downloadBlobAndSave(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error('Falha no download direto')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerBrowserDownload(objectUrl, filename)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    return true
  } catch {
    // Fallback: abre a URL diretamente para o navegador baixar
    triggerBrowserDownload(url, filename)
    return true
  }
}

// ─── Provedores de Conversão de Áudio YouTube -> MP3 ─────────

const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt-api.kwiatekm.tokyo',
  'https://co.wuk.sh',
]

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://yt.drgnz.club',
  'https://invidious.drgns.space',
]

// 1. Tenta Cobalt Tools API (Melhor qualidade MP3 320kbps)
async function fetchCobaltMp3(videoId: string): Promise<string | null> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

  for (const instance of COBALT_INSTANCES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(`${instance}/`, {
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

      if (response.ok) {
        const data = await response.json()
        if (data.url) return data.url
        if (data.audio) return data.audio
      }
    } catch {
      // Tenta a próxima instância
    }
  }

  return null
}

// 2. Tenta Stream de Áudio Direto via Invidious (M4A / Áudio Puro)
export function getInvidiousAudioUrl(videoId: string): string {
  const randomInstance = INVIDIOUS_INSTANCES[Math.floor(Math.random() * INVIDIOUS_INSTANCES.length)]
  return `${randomInstance}/latest_version?id=${videoId}&itag=140`
}

// 3. Links de Espelhos Rápidos Externos para Download em 1 Clique
export function getExternalDownloadLinks(videoId: string, title: string) {
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

// ─── Função Principal de Download ────────────────────────────

export async function processTrackDownload(item: DownloadSource): Promise<DownloadResult> {
  const cleanTitle = sanitizeFilename(item.title || 'musica')
  const cleanArtist = sanitizeFilename(item.subtitle || 'JohnMusic')
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`

  // Caso 1: Áudio Direto ou TikTok
  if (item.audioUrl) {
    await downloadBlobAndSave(item.audioUrl, filename)
    return { success: true, downloadUrl: item.audioUrl, filename, isDirectBlob: true }
  }

  // Caso 2: Resolver videoId se não estiver pronto
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
    return {
      success: false,
      filename,
      error: 'Não foi possível encontrar a fonte de áudio desta música para download.',
    }
  }

  // Tenta conversão direta via Cobalt
  try {
    const cobaltUrl = await fetchCobaltMp3(videoId)
    if (cobaltUrl) {
      triggerBrowserDownload(cobaltUrl, filename)
      return { success: true, downloadUrl: cobaltUrl, filename }
    }
  } catch {}

  // Fallback: Invidious Audio Stream
  const invidiousUrl = getInvidiousAudioUrl(videoId)
  triggerBrowserDownload(invidiousUrl, filename)

  return { success: true, downloadUrl: invidiousUrl, filename }
}
