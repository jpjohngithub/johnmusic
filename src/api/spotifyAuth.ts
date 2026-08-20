// ============================================================
// SPOTIFY AUTH — OAuth 2.0 PKCE + Client Credentials (Sem Login)
// ============================================================

const CLIENT_ID = (import.meta.env.VITE_SPOTIFY_CLIENT_ID || '') as string
const CLIENT_SECRET = (import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '') as string
const REDIRECT_URI = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback') as string

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'app-remote-control',
].join(' ')

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

// ─── PKCE Helpers ────────────────────────────────────────────

function generateCodeVerifier(length = 128): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ─── Login / Redirect (OAuth Usuário) ─────────────────────────

export async function loginWithSpotify(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateCodeVerifier(16)

  localStorage.setItem('spotify_code_verifier', verifier)
  localStorage.setItem('spotify_auth_state', state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    show_dialog: 'false',
  })

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
}

// ─── Token Exchange ───────────────────────────────────────────

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const verifier = localStorage.getItem('spotify_code_verifier')
  if (!verifier) throw new Error('Code verifier não encontrado')

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error_description || 'Falha ao trocar código por token')
  }

  return response.json()
}

// ─── Token Refresh ────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error('Falha ao renovar access token')
  }

  return response.json()
}

// ─── Client Credentials Flow (Acesso Geral Sem Login) ────────

export async function getClientCredentialsToken(): Promise<string | null> {
  const customId = localStorage.getItem('custom_spotify_client_id') || CLIENT_ID
  const customSecret = localStorage.getItem('custom_spotify_client_secret') || CLIENT_SECRET

  if (!customId || !customSecret || customId === 'seu_client_id_aqui') {
    return null
  }

  // Check cached app token
  const cachedToken = localStorage.getItem('spotify_app_token')
  const cachedExp = Number(localStorage.getItem('spotify_app_token_exp') || '0')
  if (cachedToken && Date.now() < cachedExp) {
    return cachedToken
  }

  try {
    const basicAuth = btoa(`${customId}:${customSecret}`)
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) return null

    const data = await response.json()
    const expiresAt = Date.now() + data.expires_in * 1000 - 60000
    localStorage.setItem('spotify_app_token', data.access_token)
    localStorage.setItem('spotify_app_token_exp', String(expiresAt))
    return data.access_token
  } catch {
    return null
  }
}

// ─── Token Storage ────────────────────────────────────────────

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRES_AT: 'spotify_expires_at',
}

export function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  const expiresAt = Date.now() + expiresIn * 1000 - 60000 // 1 min de margem
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt))
}

export function getStoredTokens(): {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number
} {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    expiresAt: Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0'),
  }
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt
}

export function clearTokens(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem('spotify_code_verifier')
  localStorage.removeItem('spotify_auth_state')
}

// ─── Get Valid Token (User OAuth ou Client Credentials) ───────

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, expiresAt } = getStoredTokens()

  if (accessToken && refreshToken) {
    if (!isTokenExpired(expiresAt)) return accessToken

    try {
      const result = await refreshAccessToken(refreshToken)
      saveTokens(
        result.access_token,
        result.refresh_token || refreshToken,
        result.expires_in
      )
      return result.access_token
    } catch {
      clearTokens()
    }
  }

  // Fallback: Client Credentials Token (Sem login)
  return getClientCredentialsToken()
}
