// ============================================================
// HOOK: useSpotifyAuth — Gerencia autenticação do Spotify
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  loginWithSpotify,
  exchangeCodeForToken,
  saveTokens,
  clearTokens,
  getValidAccessToken,
} from '@/api/spotifyAuth'
import { getCurrentUser } from '@/api/spotifyService'
import type { SpotifyUser } from '@/types'

interface SpotifyAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: SpotifyUser | null
  isPremium: boolean
  error: string | null
}

interface SpotifyAuthActions {
  login: () => Promise<void>
  logout: () => void
  handleCallback: (code: string) => Promise<void>
  refreshUser: () => Promise<void>
}

export function useSpotifyAuth(): SpotifyAuthState & SpotifyAuthActions {
  const [state, setState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    isPremium: false,
    error: null,
  })

  // Verifica se já existe token válido ao montar
  useEffect(() => {
    const init = async () => {
      const token = await getValidAccessToken()
      if (token) {
        try {
          const user = await getCurrentUser()
          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            isPremium: user.product === 'premium',
            error: null,
          })
        } catch {
          clearTokens()
          setState((s) => ({ ...s, isLoading: false }))
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }
    init()
  }, [])

  const login = useCallback(async () => {
    setState((s) => ({ ...s, error: null }))
    await loginWithSpotify()
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      isPremium: false,
      error: null,
    })
  }, [])

  const handleCallback = useCallback(async (code: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const tokens = await exchangeCodeForToken(code)
      saveTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in)
      const user = await getCurrentUser()
      setState({
        isAuthenticated: true,
        isLoading: false,
        user,
        isPremium: user.product === 'premium',
        error: null,
      })
    } catch (err) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        isPremium: false,
        error: err instanceof Error ? err.message : 'Erro na autenticação',
      })
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      setState((s) => ({ ...s, user, isPremium: user.product === 'premium' }))
    } catch {
      // silent
    }
  }, [])

  return { ...state, login, logout, handleCallback, refreshUser }
}

// Singleton state para compartilhar entre componentes
const _authState: ReturnType<typeof useSpotifyAuth> | null = null

export function getSpotifyAuthState() {
  return _authState
}
