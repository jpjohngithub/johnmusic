// ============================================================
// TIKTOK SERVICE — oEmbed API + URL Parser
// ============================================================

import type { TikTokVideo } from '@/types'

// ─── URL Parsing ──────────────────────────────────────────────

export function extractTikTokPostId(url: string): string | null {
  const pattern = /tiktok\.com\/@[\w.]+\/video\/(\d+)/
  const match = url.match(pattern)
  return match ? match[1] : null
}

export function isValidTikTokUrl(url: string): boolean {
  return (
    url.includes('tiktok.com') &&
    (url.includes('/video/') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com'))
  )
}

export function buildTikTokEmbedUrl(postId: string): string {
  return `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&autoplay=1`
}

// ─── oEmbed API ───────────────────────────────────────────────

export interface TikTokOEmbed {
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
  html: string
  width: number
  height: number
}

export async function getTikTokOEmbed(url: string): Promise<TikTokOEmbed> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`

  // 1. Tentativa direta (alguns navegadores/ambientes liberam)
  try {
    const response = await fetch(oembedUrl, {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) return response.json()
  } catch {
    // CORS bloqueou — segue para o proxy
  }

  // 2. Fallback via proxy público
  const proxied = await fetch(`https://corsproxy.io/?${encodeURIComponent(oembedUrl)}`)
  if (!proxied.ok) {
    throw new Error('Não foi possível obter informações do TikTok')
  }
  return proxied.json()
}

// ─── Resolve shortened URLs ───────────────────────────────────
// vm.tiktok.com e vt.tiktok.com são URLs curtas

export async function resolveTikTokUrl(url: string): Promise<string> {
  // Tenta extrair o postId diretamente da URL
  const directPostId = extractTikTokPostId(url)
  if (directPostId) return url

  // Para URLs curtas, tenta via oEmbed que retorna info mesmo de URLs curtas
  return url
}

// ─── Create TikTokVideo from URL ─────────────────────────────

export async function createTikTokVideoFromUrl(url: string): Promise<TikTokVideo> {
  if (!isValidTikTokUrl(url)) {
    throw new Error('URL do TikTok inválida. Formatos aceitos: tiktok.com/@usuario/video/ID')
  }

  try {
    const oembed = await getTikTokOEmbed(url)
    const postId = extractTikTokPostId(url) || extractPostIdFromEmbed(oembed.html) || crypto.randomUUID()

    return {
      id: crypto.randomUUID(),
      postId,
      title: oembed.title || 'TikTok Video',
      authorName: oembed.author_name || 'TikTok User',
      thumbnailUrl: oembed.thumbnail_url || '',
      url,
      embedHtml: oembed.html,
      addedAt: new Date().toISOString(),
    }
  } catch {
    // Fallback: tenta extrair ID da URL e cria um embed básico
    const postId = extractTikTokPostId(url)
    if (!postId) throw new Error('Não foi possível processar a URL do TikTok')

    const embedHtml = `<iframe src="${buildTikTokEmbedUrl(postId)}" width="325" height="580" frameborder="0" allow="encrypted-media; autoplay" allowfullscreen></iframe>`

    return {
      id: crypto.randomUUID(),
      postId,
      title: 'TikTok Video',
      authorName: 'TikTok User',
      thumbnailUrl: '',
      url,
      embedHtml,
      addedAt: new Date().toISOString(),
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function extractPostIdFromEmbed(html: string): string | null {
  const match = html.match(/data-video-id="(\d+)"/)
  return match ? match[1] : null
}
