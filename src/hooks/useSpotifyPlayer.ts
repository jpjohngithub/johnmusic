// ============================================================
// HOOK: useSpotifyPlayer — Web Playback SDK
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { getValidAccessToken } from '@/api/spotifyAuth'
import { transferPlayback } from '@/api/spotifyService'
import { usePlayerStore } from '@/store/playerStore'
import type { SpotifyImage } from '@/types'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayerOptions {
  name: string
  getOAuthToken: (cb: (token: string) => void) => void
  volume: number
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>
  disconnect: () => void
  addListener: (event: string, callback: (data: any) => void) => boolean
  removeListener: (event: string, callback?: (data: any) => void) => boolean
  getCurrentState: () => Promise<SpotifyPlayerState | null>
  setName: (name: string) => Promise<void>
  getVolume: () => Promise<number>
  setVolume: (volume: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  previousTrack: () => Promise<void>
  nextTrack: () => Promise<void>
}

interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: { name: string; uri: string }[]
      album: {
        name: string
        uri: string
        images: SpotifyImage[]
      }
    }
    previous_tracks: unknown[]
    next_tracks: unknown[]
  }
  shuffle: boolean
  repeat_mode: number
}

interface UseSpotifyPlayerReturn {
  player: SpotifyPlayer | null
  deviceId: string | null
  isReady: boolean
  isActive: boolean
  isPremium: boolean
  error: string | null
  play: (uri: string, contextUri?: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  next: () => Promise<void>
  prev: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
}

export function useSpotifyPlayer(isPremium: boolean): UseSpotifyPlayerReturn {
  const playerRef = useRef<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setSpotifyDeviceId, setSpotifyTrack, setIsPlaying, setProgress, setDuration } =
    usePlayerStore()

  useEffect(() => {
    if (!isPremium) return

    // Carrega o SDK do Spotify dinamicamente
    const loadSDK = () => {
      if (window.Spotify) {
        initPlayer()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)

      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    const initPlayer = async () => {
      const token = await getValidAccessToken()
      if (!token) return

      const player = new window.Spotify.Player({
        name: 'JohnMusic 2.0',
        getOAuthToken: async (cb) => {
          const t = await getValidAccessToken()
          if (t) cb(t)
        },
        volume: 0.8,
      })

      // Error handling
      player.addListener('initialization_error', (data: { message: string }) => {
        setError(`Erro de inicialização: ${data.message}`)
      })
      player.addListener('authentication_error', (data: { message: string }) => {
        setError(`Erro de autenticação: ${data.message}`)
      })
      player.addListener('account_error', (data: { message: string }) => {
        setError(`Conta Premium necessária: ${data.message}`)
      })
      player.addListener('playback_error', (data: { message: string }) => {
        console.error('Playback error:', data.message)
      })

      // Ready
      player.addListener('ready', (data: { device_id: string }) => {
        setDeviceId(data.device_id)
        setSpotifyDeviceId(data.device_id)
        setIsReady(true)
        setError(null)
        // Transfere playback para este dispositivo
        transferPlayback(data.device_id, false).catch(() => {})
      })

      // Not ready
      player.addListener('not_ready', () => {
        setIsReady(false)
      })

      // Player state changes
      player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        if (!state) {
          setIsActive(false)
          return
        }

        setIsActive(true)
        setIsPlaying(!state.paused)
        setDuration(state.duration / 1000)
        if (state.duration > 0) {
          setProgress((state.position / state.duration) * 100)
        }

        const track = state.track_window.current_track
        if (track) {
          setSpotifyTrack({
            id: track.id,
            uri: track.uri,
            name: track.name,
            duration_ms: track.duration_ms,
            artists: track.artists,
            album: {
              name: track.album.name,
              uri: track.album.uri,
              images: track.album.images,
            },
          })
        }
      })

      playerRef.current = player
      const connected = await player.connect()
      if (!connected) {
        setError('Falha ao conectar o player')
      }
    }

    loadSDK()

    return () => {
      playerRef.current?.disconnect()
    }
    // Ações do store são estáveis (zustand) — intencional omitir das deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium])

  const play = useCallback(
    async (uri: string, contextUri?: string) => {
      if (!deviceId) return
      const { playTrack } = await import('@/api/spotifyService')
      await playTrack(uri, contextUri, deviceId)
    },
    [deviceId]
  )

  const pause = useCallback(async () => {
    await playerRef.current?.pause()
  }, [])

  const resume = useCallback(async () => {
    await playerRef.current?.resume()
  }, [])

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay()
  }, [])

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs)
  }, [])

  const next = useCallback(async () => {
    await playerRef.current?.nextTrack()
  }, [])

  const prev = useCallback(async () => {
    await playerRef.current?.previousTrack()
  }, [])

  const setVolume = useCallback(async (volume: number) => {
    await playerRef.current?.setVolume(volume / 100)
  }, [])

  return {
    player: playerRef.current,
    deviceId,
    isReady,
    isActive,
    isPremium,
    error,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    next,
    prev,
    setVolume,
  }
}
