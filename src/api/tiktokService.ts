// ============================================================
// TIKTOK SERVICE — Extração Direta de Capa, Nome do Vídeo,
// Nome do Áudio e Resolução Automática para YouTube
// ============================================================

import type { TikTokVideo } from '@/types'

export interface TikTokAudioResult {
  id: string
  postId: string
  title: string // Nome do Vídeo / Legenda
  soundTitle: string // Nome do Áudio / Som
  authorName: string // Nome do Criador do Vídeo
  soundAuthor: string // Autor da Música
  audioUrl?: string // Stream direto do MP3 (quando disponível)
  thumbnailUrl: string // Capa oficial do Vídeo
  url: string
  durationSeconds: number
  videoId?: string
}

// ─── URL Validation & ID Extraction ───────────────────────────

export function extractTikTokPostId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    /tiktok\.com\/v\/(\d+)/i,
    /video\/(\d+)/i,
    /\/music\/[\w-]+-(\d+)/i,
    /tiktok\.com\/t\/([\w-]+)/i,
    /vm\.tiktok\.com\/([\w-]+)/i,
    /vt\.tiktok\.com\/([\w-]+)/i,
    /(\d{15,22})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function isValidTikTokUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase()
  return (
    trimmed.includes('tiktok.com') ||
    trimmed.includes('vm.tiktok.com') ||
    trimmed.includes('vt.tiktok.com') ||
    trimmed.includes('tiktok.com/t/') ||
    trimmed.includes('tiktok.com/@')
  )
}

export function buildTikTokEmbedUrl(postId: string): string {
  return `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&autoplay=1`
}

// ─── Construtor Inteligente de Termo de Busca (YouTube Match) ───

export function buildTikTokSearchQuery(
  soundTitle?: string,
  soundAuthor?: string,
  videoTitle?: string,
  authorName?: string
): string {
  const isGeneric = (str?: string) => {
    if (!str) return true
    const l = str.toLowerCase().trim()
    return (
      l.includes('som original') ||
      l.includes('original sound') ||
      l.includes('som do tiktok') ||
      l.includes('música do tiktok') ||
      l.includes('musica do tiktok') ||
      l.includes('vídeo do tiktok') ||
      l.includes('video do tiktok') ||
      l === 'tiktok' ||
      l === 'tiktok user' ||
      l === 'tiktok music'
    )
  }

  // 1. Se tem o nome do som/música real (ex: "Flowers", "M to the B", "Montagem Funk")
  if (soundTitle && !isGeneric(soundTitle)) {
    const author = soundAuthor && !isGeneric(soundAuthor) ? soundAuthor : ''
    return `${soundTitle} ${author}`.trim()
  }

  // 2. Limpa hashtags, menções e links da legenda do vídeo
  let cleanTitle = (videoTitle || '')
    .replace(/#[\w\u00C0-\u017F]+/g, '')
    .replace(/@[\w.-]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanTitle.length > 5 && !isGeneric(cleanTitle)) {
    const author = authorName && !isGeneric(authorName) ? authorName : ''
    return `${cleanTitle} ${author}`.trim()
  }

  if (soundTitle) return soundTitle
  if (authorName && !isGeneric(authorName)) return `${authorName} música tiktok`
  return cleanTitle || 'TikTok Viral Music'
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

  // 2. Fallback: Official oEmbed da TikTok
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmed)}`
    const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) })
    if (oembedRes.ok) {
      const oembed = await oembedRes.json()
      const postId = extractTikTokPostId(trimmed) || oembed.embed_product_id || crypto.randomUUID()

      // Extrai o nome do som/música real de dentro do HTML incorporado do oembed
      // Ex: title="♬ Zach Kings Magic Broomstick - Zach King" ou >♬ Flowers - Miley Cyrus<
      let soundTitle = ''
      let soundAuthor = oembed.author_name || 'TikTok'

      if (oembed.html) {
        const match = oembed.html.match(/title="♬\s*([^"]+)"/) || oembed.html.match(/>♬\s*([^<]+)</)
        if (match) {
          const raw = match[1].trim()
          const splitIdx = raw.lastIndexOf(' - ')
          if (splitIdx !== -1) {
            soundTitle = raw.substring(0, splitIdx).trim()
            soundAuthor = raw.substring(splitIdx + 3).trim()
          } else {
            soundTitle = raw
          }
        }
      }

      if (!soundTitle) {
        soundTitle = oembed.title || 'Som Original'
      }

      return {
        id: crypto.randomUUID(),
        postId,
        title: oembed.title || 'Vídeo do TikTok',
        soundTitle,
        authorName: oembed.author_name || 'TikTok User',
        soundAuthor,
        thumbnailUrl: oembed.thumbnail_url || '',
        url: trimmed,
        durationSeconds: 30,
      }
    }
  } catch (e) {
    console.warn('TikTok oEmbed extraction error:', e)
  }

  // 3. Fallback genérico quando APIs externas estiverem inacessíveis
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

// ─── Create TikTokVideo from URL (com Pré-Resolução do YouTube) ───

export async function createTikTokVideoFromUrl(url: string): Promise<TikTokVideo> {
  if (!isValidTikTokUrl(url)) {
    throw new Error('URL do TikTok inválida. Cole links como: tiktok.com/@usuario/video/... ou vm.tiktok.com/...')
  }

  const result = await extractTikTokAudioAndMetadata(url)

  // Pré-resolve a música no motor do YouTube para garantir reprodução 100% contínua
  let videoId: string | undefined
  try {
    const { findYouTubeMatch } = await import('./crossPlatformService')
    const query = buildTikTokSearchQuery(
      result.soundTitle,
      result.soundAuthor,
      result.title,
      result.authorName
    )
    const match = await findYouTubeMatch(
      query,
      result.durationSeconds,
      result.soundTitle,
      result.soundAuthor
    )
    if (match) {
      videoId = match.videoId
    }
  } catch (err) {
    console.warn('Pre-resolving TikTok to YouTube video match:', err)
  }

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
    videoId,
    durationSeconds: result.durationSeconds,
    embedHtml: `<iframe src="${buildTikTokEmbedUrl(result.postId)}" width="325" height="580" frameborder="0" allow="encrypted-media; autoplay" allowfullscreen></iframe>`,
    addedAt: new Date().toISOString(),
  }
}
