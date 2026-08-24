// ============================================================
// PLAYLIST SHARE SERVICE — Compartilhamento e Clonagem 100% Fiel
// Gera links universais codificados para importar playlists completas
// com todas as músicas, capas, ordem e metadados intactos
// ============================================================

import type { CustomPlaylist, PlaylistItem } from '@/types'

interface ShareTrackPayload {
  s: PlaylistItem['source']
  t: string
  a: string
  img?: string
  v?: string
  u?: string
  d?: number
}

interface SharePlaylistPayload {
  n: string
  desc?: string
  cov?: string
  items: ShareTrackPayload[]
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) {
    b64 += '='
  }
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

// ─── Gera a URL de Compartilhamento da Playlist ─────────────

export function generatePlaylistShareUrl(playlist: CustomPlaylist): string {
  const payload: SharePlaylistPayload = {
    n: playlist.name,
    desc: playlist.description || '',
    cov: playlist.coverUrl || '',
    items: playlist.items.map((i) => {
      let vid = i.videoId
      if (!vid && typeof localStorage !== 'undefined') {
        try {
          const resolveKey = i.source === 'spotify'
            ? `yt-resolve:spotify:${i.uri || i.id}`
            : i.source === 'tiktok'
            ? `yt-resolve:tiktok:${i.tiktokPostId || i.id}`
            : `yt-resolve:youtube:${i.videoId || i.id}`
          const raw = localStorage.getItem('yt-search-cache:' + resolveKey.toLowerCase())
          if (raw) {
            const entry = JSON.parse(raw)
            if (entry?.data?.videoId) {
              vid = entry.data.videoId
            }
          }
        } catch {}
      }

      return {
        s: i.source,
        t: i.title,
        a: i.subtitle,
        img: i.imageUrl || '',
        v: vid,
        u: i.uri || i.url,
        d: i.durationMs,
      }
    }),
  }

  const jsonStr = JSON.stringify(payload)
  const b64 = toBase64Url(jsonStr)

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://johnmusic.app'

  return `${origin}/?playlist=${b64}`
}

// ─── Verifica se a URL é um Link Compartilhado do JohnMusic ───

export function isJohnMusicShareUrl(urlOrString: string): boolean {
  if (!urlOrString) return false
  const str = urlOrString.trim()
  return (
    str.includes('playlist=') ||
    str.includes('?share=') ||
    str.startsWith('johnmusic:playlist:') ||
    str.includes('/share?data=')
  )
}

// ─── Extrai e Reconstrói a Playlist a partir do Link ────────

export function importPlaylistFromShareUrl(urlOrString: string): CustomPlaylist | null {
  try {
    let b64 = urlOrString.trim()

    // Se for URL completa
    if (b64.includes('playlist=')) {
      const match = b64.match(/playlist=([a-zA-Z0-9_-]+)/)
      if (match) b64 = match[1]
    } else if (b64.includes('share=')) {
      const match = b64.match(/share=([a-zA-Z0-9_-]+)/)
      if (match) b64 = match[1]
    } else if (b64.includes('data=')) {
      const match = b64.match(/data=([a-zA-Z0-9_-]+)/)
      if (match) b64 = match[1]
    } else if (b64.startsWith('johnmusic:playlist:')) {
      b64 = b64.replace('johnmusic:playlist:', '')
    }

    if (!b64) return null

    const jsonStr = fromBase64Url(b64)
    const payload: SharePlaylistPayload = JSON.parse(jsonStr)

    if (!payload.n || !Array.isArray(payload.items)) return null

    const items: PlaylistItem[] = payload.items.map((i) => ({
      id: crypto.randomUUID(),
      source: i.s || 'spotify',
      title: i.t || 'Música',
      subtitle: i.a || 'Artista',
      imageUrl: i.img || payload.cov || '',
      videoId: i.v,
      uri: i.u?.startsWith('spotify:') ? i.u : undefined,
      url: i.u,
      durationMs: i.d,
      addedAt: new Date().toISOString(),
    }))

    return {
      id: crypto.randomUUID(),
      name: payload.n,
      description: payload.desc || `Playlist importada via link compartilhado (${items.length} faixas)`,
      coverUrl: payload.cov || items[0]?.imageUrl || '',
      importedFrom: 'manual',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('Erro ao importar playlist compartilhada:', err)
    return null
  }
}
