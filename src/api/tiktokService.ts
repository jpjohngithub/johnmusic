// ============================================================
// TIKTOK SERVICE — Extração Direta de Capa, Nome do Vídeo,
// Nome do Áudio e Stream MP3 (Zero Login)
// ============================================================

import type { TikTokVideo } from '@/types'

export interface TikTokAudioResult {
  id: string
  postId: string
  title: string // Nome do Vídeo
  soundTitle: string // Nome do Áudio / Som
  authorName: string // Nome do Criador do Vídeo
  soundAuthor: string // Autor da Música
  audioUrl?: string // Stream direto do MP3
  thumbnailUrl: string // Capa oficial do Vídeo
  url: string
  durationSeconds: number
}

// ─── URL Validation & ID Extraction ───────────────────────────

export function extractTikTokPostId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /video\/(\d+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function isValidTikTokUrl(url: string): boolean {
  const trimmed = url.trim()
  return (
    trimmed.includes('tiktok.com') ||
    trimmed.includes('vm.tiktok.com') ||
    trimmed.includes('vt.tiktok.com') ||
    trimmed.includes('tiktok.com/t/')
  )
}

export function buildTikTokEmbedUrl(postId: string): string {
  return `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&autoplay=1`
}

// ─── Extração Completa de Metadados e Áudio ──────────────────

export async function extractTikTokAudioAndMetadata(url: string): Promise<TikTokAudioResult> {
  const trimmed = url.trim()

  // 1. TikWM API via POST
  try {
    const formData = new FormData()
    formData.append('url', trimmed)
    formData.append('hd', '1')

    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) {
      const json = await res.json()
      if (json.code === 0 && json.data) {
        const d = json.data
        const soundTitle = d.music_info?.title || d.music_info?.album || 'Som Original'
        const soundAuthor = d.music_info?.author || d.author?.nickname || 'TikTok'
        const videoTitle = d.title || soundTitle || 'Vídeo do TikTok'
        const authorName = d.author?.nickname || d.author?.unique_id || 'TikTok User'
        const postId = d.id || extractTikTokPostId(trimmed) || crypto.randomUUID()
        const coverUrl = d.cover || d.origin_cover || d.dynamic_cover || ''

        return {
          id: crypto.randomUUID(),
          postId,
          title: videoTitle,
          soundTitle,
          authorName,
          soundAuthor,
          audioUrl: d.music || undefined,
          thumbnailUrl: coverUrl,
          url: trimmed,
          durationSeconds: d.duration || 30,
        }
      }
    }
  } catch (e) {
    console.warn('TikWM extraction:', e)
  }

  // 2. Fallback: Official oEmbed
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmed)}`
    const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    if (oembedRes.ok) {
      const oembed = await oembedRes.json()
      const postId = extractTikTokPostId(trimmed) || crypto.randomUUID()
      return {
        id: crypto.randomUUID(),
        postId,
        title: oembed.title || 'Vídeo do TikTok',
        soundTitle: oembed.title || 'Som do TikTok',
        authorName: oembed.author_name || 'TikTok User',
        soundAuthor: oembed.author_name || 'TikTok',
        thumbnailUrl: oembed.thumbnail_url || '',
        url: trimmed,
        durationSeconds: 30,
      }
    }
  } catch {
    // segue para fallback básico
  }

  // 3. Fallback genérico
  const postId = extractTikTokPostId(trimmed) || crypto.randomUUID()
  return {
    id: crypto.randomUUID(),
    postId,
    title: 'Vídeo do TikTok',
    soundTitle: 'Som Original',
    authorName: 'TikTok',
    soundAuthor: 'TikTok',
    thumbnailUrl: '',
    url: trimmed,
    durationSeconds: 30,
  }
}

// ─── Create TikTokVideo from URL ─────────────────────────────

export async function createTikTokVideoFromUrl(url: string): Promise<TikTokVideo> {
  if (!isValidTikTokUrl(url)) {
    throw new Error('URL do TikTok inválida. Cole links como: tiktok.com/@usuario/video/... ou vm.tiktok.com/...')
  }

  const result = await extractTikTokAudioAndMetadata(url)

  return {
    id: result.id,
    postId: result.postId,
    title: result.title, // Nome do Vídeo
    soundTitle: result.soundTitle, // Nome do Áudio
    authorName: result.authorName,
    soundAuthor: result.soundAuthor,
    thumbnailUrl: result.thumbnailUrl, // Capa oficial do Vídeo
    url: result.url,
    audioUrl: result.audioUrl,
    durationSeconds: result.durationSeconds,
    embedHtml: `<iframe src="${buildTikTokEmbedUrl(result.postId)}" width="325" height="580" frameborder="0" allow="encrypted-media; autoplay" allowfullscreen></iframe>`,
    addedAt: new Date().toISOString(),
  }
}
