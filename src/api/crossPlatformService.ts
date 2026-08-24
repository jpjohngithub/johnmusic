// ============================================================
// CROSS PLATFORM SERVICE — Conversão universal para YouTube
// ============================================================
// O YouTube é o "motor de reprodução": faixas do Spotify (sem
// login Premium) e sons do TikTok são convertidos para o vídeo
// oficial equivalente no YouTube e tocados pelo player IFrame.
// ============================================================

import { searchYouTubeKeyless, cacheSet, cacheGet, type YouTubeMatch } from './youtubeSearchService'
import { useLibraryStore } from '@/store/libraryStore'
import type { PlaylistItem, QueueItem } from '@/types'

const RESOLVE_PREFIX = 'yt-resolve:'

// ─── Score de um candidato para Áudio Oficial de Estúdio ───────

function scoreCandidate(
  m: YouTubeMatch,
  targetDurationSec: number | null,
  songTitle?: string,
  artistName?: string
): number {
  let score = 10

  const titleLower = m.title.toLowerCase()
  const channelLower = (m.channelTitle || '').toLowerCase()
  const songLower = (songTitle || '').toLowerCase()
  const artistLower = (artistName || '').toLowerCase()

  // 1. Tópico Oficial do YouTube Music / Gravadora (- Topic) = ÁUDIO DE ESTÚDIO ORIGINAL
  if (channelLower.includes('- topic') || channelLower.includes('topic')) {
    score += 60
  } else if (
    channelLower.includes('vevo') ||
    channelLower.includes('official') ||
    channelLower.includes('oficial')
  ) {
    score += 35
  }

  // 2. Correspondência exata do nome da música
  if (songLower && titleLower.includes(songLower)) score += 40

  // 3. Correspondência do nome do artista
  if (artistLower && (channelLower.includes(artistLower) || titleLower.includes(artistLower))) {
    score += 30
  }

  // 4. Termos de áudio de estúdio oficial
  if (
    titleLower.includes('official audio') ||
    titleLower.includes('audio oficial') ||
    titleLower.includes('áudio oficial') ||
    titleLower.includes('official music video') ||
    titleLower.includes('clipe oficial') ||
    titleLower.includes('visualizer')
  ) {
    score += 25
  }

  // 5. Penalidade severa para versões ao vivo, covers, remixes e reacts
  const badKeywords = [
    'ao vivo',
    'en vivo',
    'live',
    'show',
    'cover',
    'karaoke',
    'remix',
    'react',
    'reaction',
    'tutorial',
    'parodia',
    'paródia',
    'slowed',
    'reverb',
    'bass boosted',
    '1 hour',
    '1 hora',
    'edit',
    'status',
    'instrumental',
    'acoustic',
    'acústico',
    'acustico',
    'tributo',
    'tribute',
    'sped up',
    'speed up',
  ]
  for (const bad of badKeywords) {
    if (titleLower.includes(bad) && !songLower.includes(bad)) {
      score -= 80
    }
  }

  if (m.durationSeconds > 3600) return -1 // lives muito longas

  const target = targetDurationSec || 0
  if (target > 0 && m.durationSeconds > 0) {
    const diff = Math.abs(m.durationSeconds - target)
    if (diff <= 3) score += 30
    else if (diff <= 10) score += 15
    else if (diff > 45) score -= 40
  }

  return score
}

// ─── Busca do melhor vídeo equivalente ────────────────────────

export async function findYouTubeMatch(
  query: string,
  targetDurationSec?: number,
  songTitle?: string,
  artistName?: string
): Promise<YouTubeMatch | null> {
  const results = await searchYouTubeKeyless(query, 15)
  if (results.length === 0) return null

  const target = targetDurationSec && targetDurationSec > 0 ? targetDurationSec : null
  const scored = results
    .map((m) => ({ m, score: scoreCandidate(m, target, songTitle, artistName) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.m || results[0] || null
}

// ─── Cache de resolução sourceId → videoId ────────────────────

export function resolveKey(item: PlaylistItem | QueueItem): string {
  if (item.source === 'spotify') return `spotify:${item.uri || item.id}`
  if (item.source === 'tiktok') return `tiktok:${item.tiktokPostId || item.id}`
  return `youtube:${item.videoId || item.id}`
}

// ─── Resolve qualquer item para um vídeo do YouTube ──────────

export async function resolvePlayable(
  item: PlaylistItem | QueueItem
): Promise<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string } | null> {
  // YouTube já é direto
  if (item.source === 'youtube' && item.videoId) {
    return {
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.subtitle,
      thumbnailUrl: item.imageUrl,
    }
  }

  // Se o item já tem videoId associado
  if (item.videoId) {
    return {
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.subtitle,
      thumbnailUrl: item.imageUrl,
    }
  }

  // Verifica cache em memória/localStorage
  const key = RESOLVE_PREFIX + resolveKey(item)
  const cached = cacheGet<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>(key)
  if (cached) return cached

  let videoId: string | null = null
  let title = item.title
  let channelTitle = item.subtitle
  const thumbnailUrl = item.imageUrl

  if (item.source === 'spotify') {
    const anyItem = item as PlaylistItem
    const cleanSubtitle =
      item.subtitle &&
      !item.subtitle.toLowerCase().includes('spotify') &&
      !item.subtitle.toLowerCase().includes('playlist') &&
      !item.subtitle.toLowerCase().includes('música')
        ? item.subtitle
        : ''
    const query = `${item.title} ${cleanSubtitle}`.trim()
    const match = await findYouTubeMatch(
      query,
      anyItem.durationMs ? anyItem.durationMs / 1000 : undefined,
      item.title,
      cleanSubtitle
    )
    if (match) {
      videoId = match.videoId
      title = item.title
      channelTitle = match.channelTitle || item.subtitle
    }
  } else if (item.source === 'tiktok') {
    let query = `${item.title} ${item.subtitle}`.trim()
    let targetDuration: number | undefined

    try {
      const url = (item as PlaylistItem).url || (item as QueueItem).tiktokUrl
      if (url && (!item.title || item.title === 'TikTok Video' || item.title === 'Música do TikTok')) {
        const { extractTikTokAudioAndMetadata } = await import('./tiktokService')
        const data = await extractTikTokAudioAndMetadata(url)
        if (data.soundTitle) {
          query = `${data.soundTitle} ${data.soundAuthor}`.trim()
          targetDuration = data.durationSeconds
        }
      }
    } catch {
      // segue com o título do item
    }

    const match = await findYouTubeMatch(query, targetDuration)
    if (match) {
      videoId = match.videoId
      title = item.title
      channelTitle = item.subtitle
    }
  }

  if (!videoId) return null

  const resolved = { videoId, title, channelTitle, thumbnailUrl }
  cacheSet(key, resolved)

  // Persiste videoId nos itens da biblioteca se fizer parte de uma playlist
  try {
    const store = useLibraryStore.getState()
    const playlists = store.customPlaylists
    let found = false
    const updated = playlists.map((p) => {
      const idx = p.items.findIndex((i) => i.id === item.id || (i.uri && i.uri === (item as any).uri))
      if (idx !== -1) {
        found = true
        const newItems = [...p.items]
        newItems[idx] = { ...newItems[idx], videoId: videoId! }
        return { ...p, items: newItems }
      }
      return p
    })
    if (found) {
      useLibraryStore.setState({ customPlaylists: updated })
    }
  } catch {}

  return resolved
}
