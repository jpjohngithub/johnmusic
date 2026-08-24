// ============================================================
// CROSS PLATFORM SERVICE — Conversão universal para YouTube
// ============================================================
// O YouTube é o "motor de reprodução": faixas do Spotify (sem
// login Premium) e sons do TikTok são convertidos para o vídeo
// equivalente no YouTube e tocados pelo player IFrame.

import { searchYouTubeKeyless, cacheSet, cacheGet, type YouTubeMatch } from './youtubeSearchService'
import type { PlaylistItem, QueueItem } from '@/types'

const RESOLVE_PREFIX = 'yt-resolve:'

// ─── Score de um candidato ────────────────────────────────────

function scoreCandidate(m: YouTubeMatch, targetDurationSec: number | null): number {
  let score = 0

  const titleLower = m.title.toLowerCase()
  if (titleLower.includes('audio') || titleLower.includes('topic')) score += 3
  if (titleLower.includes('live') || titleLower.includes('ao vivo')) score -= 2
  if (m.durationSeconds > 3600) return -1 // lives longas: descarta

  const target = targetDurationSec || 0
  if (target > 0) {
    const diff = Math.abs(m.durationSeconds - target)
    const ratio = diff / target
    if (ratio <= 0.05) score += 5
    else if (ratio <= 0.1) score += 3
    else if (ratio <= 0.25) score += 1
    else if (ratio > 1) score -= 2
  }

  return score
}

// ─── Busca do melhor vídeo equivalente ────────────────────────

export async function findYouTubeMatch(
  query: string,
  targetDurationSec?: number
): Promise<YouTubeMatch | null> {
  const results = await searchYouTubeKeyless(query, 15)
  if (results.length === 0) return null

  const target = targetDurationSec && targetDurationSec > 0 ? targetDurationSec : null
  const scored = results
    .map((m) => ({ m, score: scoreCandidate(m, target) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.m || results[0] || null
}

// ─── Cache de resolução sourceId → videoId ────────────────────

function resolveKey(item: PlaylistItem | QueueItem): string {
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
    const match = await findYouTubeMatch(query, anyItem.durationMs ? anyItem.durationMs / 1000 : undefined)
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
  return resolved
}
