// ============================================================
// SPOTIFY WEB API SERVICE
// ============================================================

import { getValidAccessToken } from './spotifyAuth'
import type {
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyArtist,
  SpotifySearchResult,
} from '@/types'

const BASE_URL = 'https://api.spotify.com/v1'

// ─── API Helper ───────────────────────────────────────────────

async function spotifyFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Não autenticado no Spotify')

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (response.status === 204) return {} as T

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API Error: ${response.status}`)
  }

  return response.json()
}

// ─── User ─────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>('/me')
}

// ─── Playlists ────────────────────────────────────────────────

export async function getUserPlaylists(limit = 50, offset = 0): Promise<{
  items: SpotifyPlaylist[]
  total: number
  next: string | null
}> {
  return spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`)
}

export async function getAllUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const all: SpotifyPlaylist[] = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const result = await getUserPlaylists(limit, offset)
    all.push(...result.items)
    hasMore = Boolean(result.next)
    offset += limit
  }

  return all
}

export async function getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(`/playlists/${playlistId}`)
}

export async function getPlaylistTracks(
  playlistId: string,
  limit = 50,
  offset = 0
): Promise<{
  items: SpotifyPlaylistTrack[]
  total: number
  next: string | null
}> {
  return spotifyFetch(
    `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&market=from_token`
  )
}

export async function getAllPlaylistTracks(
  playlistId: string
): Promise<SpotifyPlaylistTrack[]> {
  const all: SpotifyPlaylistTrack[] = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const result = await getPlaylistTracks(playlistId, limit, offset)
    all.push(...result.items.filter((i) => i.track !== null))
    hasMore = Boolean(result.next)
    offset += limit
  }

  return all
}

// ─── Liked Songs ──────────────────────────────────────────────

export async function getLikedSongs(limit = 50, offset = 0): Promise<{
  items: SpotifyPlaylistTrack[]
  total: number
  next: string | null
}> {
  return spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}&market=from_token`)
}

export async function getAllLikedSongs(): Promise<SpotifyPlaylistTrack[]> {
  const all: SpotifyPlaylistTrack[] = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const result = await getLikedSongs(limit, offset)
    all.push(...result.items.filter((i) => i.track !== null))
    hasMore = Boolean(result.next)
    offset += limit
  }

  return all
}

// ─── Albums ───────────────────────────────────────────────────

export async function getSavedAlbums(limit = 50, offset = 0): Promise<{
  items: { added_at: string; album: SpotifyAlbum }[]
  total: number
  next: string | null
}> {
  return spotifyFetch(`/me/albums?limit=${limit}&offset=${offset}`)
}

export async function getAlbum(albumId: string): Promise<SpotifyAlbum & {
  tracks: { items: SpotifyTrack[]; total: number }
}> {
  return spotifyFetch(`/albums/${albumId}`)
}

// ─── Artists ──────────────────────────────────────────────────

export async function getFollowedArtists(limit = 50, after?: string): Promise<{
  artists: { items: SpotifyArtist[]; total: number; next: string | null; cursors: { after: string } }
}> {
  const params = new URLSearchParams({ type: 'artist', limit: String(limit) })
  if (after) params.set('after', after)
  return spotifyFetch(`/me/following?${params}`)
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${artistId}`)
}

export async function getArtistTopTracks(artistId: string): Promise<{ tracks: SpotifyTrack[] }> {
  return spotifyFetch(`/artists/${artistId}/top-tracks?market=from_token`)
}

// ─── Top Items ────────────────────────────────────────────────

export async function getTopTracks(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit = 20
): Promise<{ items: SpotifyTrack[] }> {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
}

export async function getTopArtists(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit = 20
): Promise<{ items: SpotifyArtist[] }> {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`)
}

export async function getRecentlyPlayed(limit = 20): Promise<{
  items: { track: SpotifyTrack; played_at: string }[]
}> {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`)
}

// ─── Search ───────────────────────────────────────────────────

export async function searchSpotify(
  query: string,
  types: ('track' | 'artist' | 'album' | 'playlist')[] = ['track', 'artist', 'album', 'playlist'],
  limit = 10
): Promise<SpotifySearchResult> {
  const params = new URLSearchParams({
    q: query,
    type: types.join(','),
    limit: String(limit),
    market: 'from_token',
  })
  return spotifyFetch(`/search?${params}`)
}

// ─── Playback Control ─────────────────────────────────────────

export async function playTrack(
  uri: string,
  contextUri?: string,
  deviceId?: string
): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : ''
  const body = contextUri
    ? { context_uri: contextUri, offset: { uri } }
    : { uris: [uri] }

  await spotifyFetch(`/me/player/play${params}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function pausePlayback(deviceId?: string): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : ''
  await spotifyFetch(`/me/player/pause${params}`, { method: 'PUT' })
}

export async function resumePlayback(deviceId?: string): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : ''
  await spotifyFetch(`/me/player/play${params}`, { method: 'PUT' })
}

export async function skipToNext(deviceId?: string): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : ''
  await spotifyFetch(`/me/player/next${params}`, { method: 'POST' })
}

export async function skipToPrevious(deviceId?: string): Promise<void> {
  const params = deviceId ? `?device_id=${deviceId}` : ''
  await spotifyFetch(`/me/player/previous${params}`, { method: 'POST' })
}

export async function seekToPosition(positionMs: number, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({ position_ms: String(positionMs) })
  if (deviceId) params.set('device_id', deviceId)
  await spotifyFetch(`/me/player/seek?${params}`, { method: 'PUT' })
}

export async function setVolume(volumePercent: number, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({ volume_percent: String(Math.round(volumePercent)) })
  if (deviceId) params.set('device_id', deviceId)
  await spotifyFetch(`/me/player/volume?${params}`, { method: 'PUT' })
}

export async function setShuffle(state: boolean, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({ state: String(state) })
  if (deviceId) params.set('device_id', deviceId)
  await spotifyFetch(`/me/player/shuffle?${params}`, { method: 'PUT' })
}

export async function setRepeat(
  state: 'track' | 'context' | 'off',
  deviceId?: string
): Promise<void> {
  const params = new URLSearchParams({ state })
  if (deviceId) params.set('device_id', deviceId)
  await spotifyFetch(`/me/player/repeat?${params}`, { method: 'PUT' })
}

export async function transferPlayback(deviceId: string, play = true): Promise<void> {
  await spotifyFetch('/me/player', {
    method: 'PUT',
    body: JSON.stringify({ device_ids: [deviceId], play }),
  })
}

// ─── Featured / Recommendations ──────────────────────────────

export async function getFeaturedPlaylists(limit = 20): Promise<{
  playlists: { items: SpotifyPlaylist[] }
}> {
  return spotifyFetch(`/browse/featured-playlists?limit=${limit}&country=BR`)
}

export async function getNewReleases(limit = 20): Promise<{
  albums: { items: SpotifyAlbum[] }
}> {
  return spotifyFetch(`/browse/new-releases?limit=${limit}&country=BR`)
}
