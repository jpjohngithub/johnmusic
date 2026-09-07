import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function getImageUrl(images: { url: string }[] | undefined, fallback = ''): string {
  return images?.[0]?.url || fallback
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const success = document.execCommand('copy')
    document.body.removeChild(ta)
    return success
  } catch {
    return false
  }
}

export interface OfficialMediaLink {
  url: string
  label: 'YouTube' | 'Spotify' | 'TikTok' | 'Web'
  platform: 'youtube' | 'spotify' | 'tiktok' | 'web'
}

export function getOfficialMediaLink(item: {
  videoId?: string
  url?: string
  uri?: string
  source?: string | null
  id?: string
  tiktokUrl?: string
  tiktokPostId?: string
  title?: string
  subtitle?: string
  channelTitle?: string
  authorName?: string
}): OfficialMediaLink {
  // 1. YouTube videoId
  if (item.videoId) {
    return {
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      label: 'YouTube',
      platform: 'youtube',
    }
  }

  // 2. Spotify URI
  if (item.uri && item.uri.startsWith('spotify:')) {
    const parts = item.uri.split(':')
    const type = parts[1] || 'track'
    const id = parts[2]
    if (id) {
      return {
        url: `https://open.spotify.com/${type}/${id}`,
        label: 'Spotify',
        platform: 'spotify',
      }
    }
  }

  // 3. Direct URL
  if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      return { url: item.url, label: 'YouTube', platform: 'youtube' }
    }
    if (item.url.includes('spotify.com')) {
      return { url: item.url, label: 'Spotify', platform: 'spotify' }
    }
    if (item.url.includes('tiktok.com')) {
      return { url: item.url, label: 'TikTok', platform: 'tiktok' }
    }
    return { url: item.url, label: 'Web', platform: 'web' }
  }

  // 4. TikTok
  if (item.tiktokUrl) {
    return { url: item.tiktokUrl, label: 'TikTok', platform: 'tiktok' }
  }
  if (item.tiktokPostId) {
    return {
      url: `https://www.tiktok.com/@video/video/${item.tiktokPostId}`,
      label: 'TikTok',
      platform: 'tiktok',
    }
  }

  // 5. Spotify source with ID
  if (item.source === 'spotify' && item.id && !item.id.includes('-') && item.id.length >= 15) {
    return {
      url: `https://open.spotify.com/track/${item.id}`,
      label: 'Spotify',
      platform: 'spotify',
    }
  }

  // 6. Fallback Search on YouTube
  const artist = item.subtitle || item.channelTitle || item.authorName || ''
  const searchTerms = [item.title, artist].filter(Boolean).join(' ')
  if (searchTerms) {
    return {
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`,
      label: 'YouTube',
      platform: 'youtube',
    }
  }

  return { url: '', label: 'Web', platform: 'web' }
}
